/**
 * Salesforce Integration — Generate Report from SF Record
 *
 * POST /api/salesforce/generate
 * Body: { recordId: string }
 *
 * Reads data from the CW Benefits Platform data proxy
 * (no direct SF OAuth needed — the proxy handles SF auth).
 */

import { NextRequest, NextResponse } from 'next/server';
import { differenceInMonths, parseISO } from 'date-fns';
import { calculateReport } from '@/lib/calculations';
import type { ReportInput } from '@/lib/types';

/**
 * Compute civilian creditable service from SCD to planned retirement date.
 * Returns whole years + remainder months. Sick leave + military are added
 * separately by the calc engine — this is civilian-only.
 */
function deriveCreditableService(
  scd: string | undefined,
  retirementDate: string | undefined,
): { years: number; months: number } {
  if (!scd || !retirementDate) return { years: 0, months: 0 };
  try {
    const start = parseISO(scd);
    const end = parseISO(retirementDate);
    const totalMonths = Math.max(0, differenceInMonths(end, start));
    return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
  } catch {
    return { years: 0, months: 0 };
  }
}

const DATA_PROXY_URL = process.env.DATA_PROXY_URL || 'https://benefits.capitalwealth.com';
const DATA_PROXY_KEY = process.env.DATA_PROXY_KEY || '';

async function fetchIntakeData(recordId: string): Promise<Record<string, any>> {
  const url = `${DATA_PROXY_URL}/api/records?id=${recordId}`;
  const response = await fetch(url, {
    headers: { 'X-API-Key': DATA_PROXY_KEY, 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Data proxy fetch failed: ${response.status} — ${error}`);
  }
  return response.json();
}

/**
 * Inspect the SF data payload for missing critical fields. Returns:
 *  - errors: blocking — generate should refuse, advisor must populate before retry
 *  - warnings: non-blocking — included in PDF cover so advisor can see what's
 *    being defaulted
 * Keeps fail-loud semantics so we never silently ship a $75k-fallback report.
 */
function validateIntakeData(data: Record<string, any>): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.serviceComputationDate) errors.push('Service Computation Date missing — annuity cannot be computed.');
  if (!data.plannedRetirementDate) errors.push('Planned Retirement Date missing — projection cannot be computed.');
  if (!data.currentAnnualSalary) errors.push('Current Annual Salary missing — high-3 cannot be computed.');
  if (!data.dateOfBirth) errors.push('Date of Birth missing — retirement age cannot be computed.');
  if (!data.retirementSystem) errors.push('Retirement System (FERS/CSRS) missing.');

  // Soft warnings — non-blocking, surfaced on cover.
  const tspTotal = ['G', 'F', 'C', 'S', 'I', 'L'].reduce((sum, fund) => {
    return sum + (Number(data[`tspTraditional${fund}`]) || 0) + (Number(data[`tspRoth${fund}`]) || 0);
  }, 0);
  if (tspTotal === 0) warnings.push('TSP balances all zero — TSP statement may not have been parsed.');

  if (data.survivorElection == null) warnings.push('Survivor election not specified — defaulting to 50%.');
  if (data.ssBenefitAge62 == null) warnings.push('Estimated Social Security benefit missing — defaulting to $1,500/mo.');
  if (data.fegliBasic === false && !data.fegliOptionA && !data.fegliOptionB) {
    warnings.push('No FEGLI elections recorded — assuming no life insurance.');
  }
  if (data.aiParseConfidence != null && Number(data.aiParseConfidence) < 50) {
    warnings.push(`AI parse confidence is low (${data.aiParseConfidence}%) — verify all values with the client.`);
  }

  return { errors, warnings };
}

function mapToReportInput(data: Record<string, any>): ReportInput {
  const get = (field: string, defaultValue: any = '') => data[field] ?? defaultValue;
  const getNum = (field: string, defaultValue: number = 0) => {
    const val = data[field];
    return val != null ? Number(val) : defaultValue;
  };

  const mapRetirementSystem = (val: string) => {
    const upper = (val || 'FERS').toUpperCase();
    if (upper === 'XFERS') return 'FERS_TRANSFER' as const;
    if (upper.includes('CSRS')) return 'CSRS' as const;
    return 'FERS' as const;
  };

  const mapEmployeeType = (type: string, category: string) => {
    const cat = (category || '').toUpperCase();
    if (cat.includes('LAW')) return 'LEO' as const;
    if (cat.includes('FIRE')) return 'FIREFIGHTER' as const;
    if (cat.includes('AIR TRAFFIC')) return 'ATC' as const;
    if (data.isPostalEmployee) return 'POSTAL' as const;
    return 'REGULAR' as const;
  };

  // CRITICAL: derive civilian creditable service from SCD → planned retirement date.
  // Hardcoding 0 here was causing all FERS annuities to compute as $0 in the
  // generated PDF. Sick leave + military are added separately by the calc engine.
  const scd = get('serviceComputationDate', '') || undefined;
  const retDate = get('plannedRetirementDate', '') || undefined;
  const civilian = deriveCreditableService(scd, retDate);

  // FERS_TRANSFER: split civilian by transferDate into CSRS + FERS components.
  const transferDate = get('transferDate', '') || undefined;
  let csrsService = { years: 0, months: 0 };
  let fersService = { years: 0, months: 0 };
  if (transferDate && scd && retDate) {
    csrsService = deriveCreditableService(scd, transferDate);
    fersService = deriveCreditableService(transferDate, retDate);
  }

  // Per-fund TSP returns. Proxy returns whole percentages (e.g. 14.6 for C);
  // calc engine expects decimals (0.146). Falls back to long-term averages
  // only when a per-fund value isn't on the SF record.
  const perFund = (data.tspPerFundReturns ?? {}) as Record<string, number | null>;
  const fundReturn = (fund: 'G' | 'F' | 'C' | 'S' | 'I' | 'L', fallback: number) => {
    const v = perFund[fund];
    return v != null ? Number(v) / 100 : fallback;
  };
  const rateG = fundReturn('G', 0.025);
  const rateF = fundReturn('F', 0.04);
  const rateC = fundReturn('C', 0.10);
  const rateS = fundReturn('S', 0.09);
  const rateI = fundReturn('I', 0.07);
  const rateL = fundReturn('L', 0.07);

  return {
    personal: {
      fullName: get('clientName', 'Federal Employee'),
      dateOfBirth: get('dateOfBirth', '1970-01-01'),
      address: '',
      maritalStatus: (get('maritalStatus', 'SINGLE') || 'SINGLE') as any,
      spouseDateOfBirth: get('spouseDOB', ''),
    },
    employment: {
      serviceComputationDate: get('serviceComputationDate', '2000-01-01'),
      retirementSystem: mapRetirementSystem(get('retirementSystem', 'FERS')),
      employeeType: mapEmployeeType(get('employeeType', ''), get('employeeCategory', '')),
      currentAnnualSalary: getNum('currentAnnualSalary', 75000),
      annualSalaryIncreaseRate: getNum('annualSalaryIncreaseRate', 0.02),
      creditableServiceYears: civilian.years,
      creditableServiceMonths: civilian.months,
      sickLeaveHours: getNum('sickLeaveHours', 0),
      plannedRetirementDate: get('plannedRetirementDate', '2030-01-01'),
      csrsServiceYears: csrsService.years, csrsServiceMonths: csrsService.months,
      fersServiceYears: fersService.years, fersServiceMonths: fersService.months,
    },
    tsp: {
      traditionalBalances: [
        { fund: 'G' as const, balance: getNum('tspTraditionalG', 0), returnRate: rateG },
        { fund: 'F' as const, balance: getNum('tspTraditionalF', 0), returnRate: rateF },
        { fund: 'C' as const, balance: getNum('tspTraditionalC', 0), returnRate: rateC },
        { fund: 'S' as const, balance: getNum('tspTraditionalS', 0), returnRate: rateS },
        { fund: 'I' as const, balance: getNum('tspTraditionalI', 0), returnRate: rateI },
        { fund: 'L' as const, balance: getNum('tspTraditionalL', 0), returnRate: rateL },
      ],
      rothBalances: [
        { fund: 'G' as const, balance: getNum('tspRothG', 0), returnRate: rateG },
        { fund: 'F' as const, balance: getNum('tspRothF', 0), returnRate: rateF },
        { fund: 'C' as const, balance: getNum('tspRothC', 0), returnRate: rateC },
        { fund: 'S' as const, balance: getNum('tspRothS', 0), returnRate: rateS },
        { fund: 'I' as const, balance: getNum('tspRothI', 0), returnRate: rateI },
        { fund: 'L' as const, balance: getNum('tspRothL', 0), returnRate: rateL },
      ],
      annualContributionTraditional: getNum('tspAnnualContribution', 0),
      annualContributionRoth: getNum('tspRothContribution', 0),
      governmentMatchPercent: 5,
      catchUpContribution: getNum('tspCatchUp', 0),
      expectedReturnRate: getNum('tspExpectedReturn', 0.07),
      plannedWithdrawalAge: getNum('tspWithdrawalAge', 62),
      withdrawalMethod: (get('tspWithdrawalMethod', 'MONTHLY_PAYMENTS') || 'MONTHLY_PAYMENTS') as any,
      monthlyWithdrawalAmount: getNum('tspMonthlyWithdrawal', undefined),
    },
    fegli: {
      basicCoverage: get('fegliBasic', true) !== false,
      optionA: get('fegliOptionA', false) === true,
      optionB: get('fegliOptionB', false) === true,
      optionBMultiple: getNum('fegliOptionBMultiple', 1),
      optionC: get('fegliOptionC', false) === true,
      optionCMultiple: getNum('fegliOptionCMultiple', 1),
      postRetirementReduction: (get('fegliPostRetirement', '75_PERCENT') || '75_PERCENT') as any,
    },
    fehb: {
      currentPlanName: get('fehbPlanName', 'BCBS Standard'),
      enrollment: (get('fehbEnrollment', 'SELF_ONLY') || 'SELF_ONLY') as any,
      biweeklyPremium: getNum('fehbBiweeklyPremium', 200),
      premiumIncreaseRate: getNum('fehbIncreaseRate', 0.05),
    },
    socialSecurity: (() => {
      // The SF field SS_FERS_Monthly_Benefit__c is the benefit at the planned
      // start age (typically what the SSA "your personalized statement" shows
      // for the age the client picked), NOT specifically the age-62 amount.
      // We feed it as estimatedBenefitFRA — when planned start age >= FRA the
      // calc engine returns this value verbatim; when start age < FRA the calc
      // applies SSA's early-claiming reduction.
      const benefitAtStartAge = getNum('ssBenefitAge62', 0);
      const startAge = getNum('ssStartAge', 67);
      return {
        estimatedBenefitAge62: 0, // unknown — calc engine derives from FRA if needed
        estimatedBenefitFRA: benefitAtStartAge,
        plannedStartAge: startAge,
      };
    })(),
    ltc: { enrolled: false, currentPremium: 0, dailyBenefitAmount: 0, benefitPeriodYears: 3 },
    otherIncome: {
      otherPensions: getNum('otherPensions', 0),
      spouseIncome: getNum('spouseIncome', 0),
      rentalIncome: getNum('rentalIncome', 0),
      investmentIncome: getNum('investmentIncome', 0),
      otherTaxableIncome: 0, otherNonTaxableIncome: 0,
    },
    expenses: {
      housing: getNum('monthlyHousing', 0),
      utilities: 0, transportation: 0, food: 0,
      healthcareOutOfPocket: 0, insurance: 0, debtPayments: 0,
      entertainment: 0, travel: 0, charitableGiving: 0, other: 0,
    },
    tax: {
      filingStatus: (get('filingStatus', 'SINGLE') || 'SINGLE') as any,
      federalTaxRate: getNum('federalTaxRate', 0.22),
      stateOfResidence: get('stateOfResidence', 'VA'),
      stateTaxRate: getNum('stateTaxRate', 0.05),
    },
    military: {
      hasMilitaryService: get('hasMilitaryService', false) === true,
      branch: get('militaryBranch', ''),
      activeDutyStartDate: get('militaryStartDate', ''),
      activeDutyEndDate: get('militaryEndDate', ''),
      depositPaid: get('militaryDepositPaid', false) === true,
      depositAmountOwed: 0,
    },
    deposits: {
      hasNonDeductionService: get('hasNonDeductionService', false) === true,
      depositOwed: getNum('depositOwed', 0),
      hasRefundedService: get('hasRefundedService', false) === true,
      reDepositOwed: getNum('reDepositOwed', 0),
    },
    advisorName: process.env.ADVISOR_NAME || 'Capital Wealth Advisors',
    advisorCompany: 'Capital Wealth Advisors',
    advisorPhone: process.env.ADVISOR_PHONE || '',
    advisorEmail: process.env.ADVISOR_EMAIL || '',
    survivorElection: (get('survivorElection', '50_PERCENT') || '50_PERCENT') as any,
    // COLA from SF (record.COLA_Adjustment__c, returned as whole percentage e.g. 2.0)
    // falls back to FERS standard 2% if not on the record.
    colaAssumption: data.colaAdjustment != null ? Number(data.colaAdjustment) / 100 : 0.02,
    projectionYears: 30,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId } = body;

    if (!recordId) {
      return NextResponse.json({ error: 'recordId is required' }, { status: 400 });
    }

    const data = await fetchIntakeData(recordId);
    const { errors, warnings } = validateIntakeData(data);
    if (errors.length > 0) {
      // Fail loud — refuse to generate a report that would silently use fallbacks.
      return NextResponse.json(
        {
          error: 'Intake data is incomplete — cannot generate report',
          missing: errors,
          warnings,
          recordId,
        },
        { status: 422 },
      );
    }
    const reportInput = mapToReportInput(data);
    const results = calculateReport(reportInput);

    return NextResponse.json({
      success: true,
      recordId,
      employeeName: reportInput.personal.fullName,
      input: reportInput,
      results,
      dataWarnings: warnings,
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
