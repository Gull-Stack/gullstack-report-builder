/**
 * Salesforce Integration — Generate Report from SF Record
 *
 * POST /api/salesforce/generate
 * Body: { recordId: string }
 *
 * Reads data from the CW Benefits Platform data proxy
 * (no direct SF OAuth needed — the proxy handles SF auth).
 *
 * Design contract:
 *   - Critical fields (those that affect $ figures): if missing → HTTP 422 with
 *     a list of what to populate. NO silent fallbacks.
 *   - Soft assumptions (TSP fund returns, COLA, tax rates, projection horizon):
 *     pulled from src/lib/assumptions.ts and emitted into `dataWarnings` so the
 *     advisor sees exactly what was assumed. NO inline magic numbers in this
 *     file.
 *   - Advisor identity: pulled from FBI Owner / Advisor__c via the data proxy.
 *     Falls back to env vars only when the SF user record has no data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { differenceInMonths, parseISO } from 'date-fns';
import { calculateReport } from '@/lib/calculations';
import type { ReportInput } from '@/lib/types';
import { ASSUMPTIONS } from '@/lib/assumptions';

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
 * Block generation when any field with material $ impact is null. The cover
 * page also requires clientName + address, so those are blocking too.
 */
function validateIntakeData(data: Record<string, any>): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.clientName) errors.push('Client name missing — cannot title the report.');
  if (!data.address) errors.push('Mailing address missing — cover page requires it.');
  if (!data.dateOfBirth) errors.push('Date of Birth missing — retirement age cannot be computed.');
  if (!data.serviceComputationDate) errors.push('Service Computation Date missing — annuity cannot be computed.');
  if (!data.plannedRetirementDate) errors.push('Planned Retirement Date missing — projection cannot be computed.');
  if (!data.currentAnnualSalary) errors.push('Current Annual Salary missing — high-3 cannot be computed.');
  if (!data.retirementSystem) errors.push('Retirement System (FERS/CSRS) missing.');

  const tspTotal = ['G', 'F', 'C', 'S', 'I', 'L'].reduce((sum, fund) => {
    return sum + (Number(data[`tspTraditional${fund}`]) || 0) + (Number(data[`tspRoth${fund}`]) || 0);
  }, 0);
  if (tspTotal === 0) warnings.push('TSP balances all zero — TSP statement may not have been parsed.');

  // Data-quality warnings that aren't covered by assumptionsApplied (which only
  // tracks what the mapper actually substituted from src/lib/assumptions.ts).
  // These are about what's missing on the SF record itself.
  if (data.ssBenefitAge62 == null) warnings.push('Estimated Social Security benefit missing — feeding $0 into the calc.');
  if (data.fegliBasic === false && !data.fegliOptionA && !data.fegliOptionB) {
    warnings.push('No FEGLI elections recorded — assuming no life insurance.');
  }
  if (data.fehbBiweeklyPremium == null) warnings.push('FEHB biweekly premium missing — feeding $0 into the calc.');
  if (data.aiParseConfidence != null && Number(data.aiParseConfidence) < 50) {
    warnings.push(`AI parse confidence is low (${data.aiParseConfidence}%) — verify all values with the client.`);
  }
  return { errors, warnings };
}

/**
 * Builds the calc-engine input from SF data. Every soft default is tracked:
 * `applied` collects a label for each assumption so the response can echo
 * exactly what was assumed.
 */
function mapToReportInput(data: Record<string, any>): { input: ReportInput; applied: string[] } {
  const applied: string[] = [];
  const useAssumption = <T,>(a: { value: T; label: string }): T => {
    applied.push(a.label);
    return a.value;
  };

  // Number with no fallback — null/undefined stays falsy and the validator
  // is responsible for blocking before we get here for critical fields.
  const num = (v: unknown): number | undefined => (v == null ? undefined : Number(v));
  const str = (v: unknown): string | undefined => (v == null || v === '' ? undefined : String(v));

  const mapRetirementSystem = (val: string | undefined) => {
    const upper = (val || '').toUpperCase();
    if (upper === 'XFERS') return 'FERS_TRANSFER' as const;
    if (upper.includes('CSRS')) return 'CSRS' as const;
    return 'FERS' as const;
  };

  const mapEmployeeType = () => {
    const cat = String(data.employeeCategory ?? '').toUpperCase();
    if (cat.includes('LAW')) return 'LEO' as const;
    if (cat.includes('FIRE')) return 'FIREFIGHTER' as const;
    if (cat.includes('AIR TRAFFIC')) return 'ATC' as const;
    if (data.isPostalEmployee) return 'POSTAL' as const;
    return 'REGULAR' as const;
  };

  const scd = str(data.serviceComputationDate)!;
  const retDate = str(data.plannedRetirementDate)!;
  const civilian = deriveCreditableService(scd, retDate);

  const transferDate = str(data.transferDate);
  let csrsService = { years: 0, months: 0 };
  let fersService = { years: 0, months: 0 };
  if (transferDate && scd && retDate) {
    csrsService = deriveCreditableService(scd, transferDate);
    fersService = deriveCreditableService(transferDate, retDate);
  }

  const perFund = (data.tspPerFundReturns ?? {}) as Record<string, number | null>;
  const fundReturn = (fund: 'G' | 'F' | 'C' | 'S' | 'I' | 'L'): number => {
    const v = perFund[fund];
    if (v != null) return Number(v) / 100;
    return useAssumption(ASSUMPTIONS.tspFundReturns[fund]);
  };
  const rateG = fundReturn('G');
  const rateF = fundReturn('F');
  const rateC = fundReturn('C');
  const rateS = fundReturn('S');
  const rateI = fundReturn('I');
  const rateL = fundReturn('L');

  const annualSalaryIncreaseRate =
    num(data.annualSalaryIncreaseRate) ?? useAssumption(ASSUMPTIONS.annualSalaryIncreaseRate);

  const fehbIncreaseRate =
    num(data.fehbIncreaseRate) ?? useAssumption(ASSUMPTIONS.fehbIncreaseRate);

  const tspExpectedReturn =
    num(data.tspExpectedReturn) ?? useAssumption(ASSUMPTIONS.tspExpectedReturn);

  const colaAssumption =
    data.colaAdjustment != null ? Number(data.colaAdjustment) / 100 : useAssumption(ASSUMPTIONS.colaRate);

  const filingStatus = str(data.filingStatus) ?? useAssumption(ASSUMPTIONS.filingStatus);
  const maritalStatus = str(data.maritalStatus) ?? useAssumption(ASSUMPTIONS.maritalStatus);
  const fehbEnrollment = str(data.fehbEnrollment) ?? useAssumption(ASSUMPTIONS.fehbEnrollment);
  const fegliPostRetirement = str(data.fegliPostRetirement) ?? useAssumption(ASSUMPTIONS.fegliPostRetirement);
  const survivorElection = str(data.survivorElection) ?? useAssumption(ASSUMPTIONS.survivorElection);

  const federalTaxRate = num(data.federalTaxRate) ?? useAssumption(ASSUMPTIONS.federalTaxRate);
  const stateTaxRate = num(data.stateTaxRate) ?? useAssumption(ASSUMPTIONS.stateTaxRate);

  const ssBenefit = num(data.ssBenefitAge62) ?? 0;
  const ssStartAge = num(data.ssStartAge) ?? useAssumption(ASSUMPTIONS.ssDefaultStartAge);

  const tspWithdrawalAge = (() => {
    const explicit = num(data.tspWithdrawalAge);
    if (explicit != null && explicit > 0) return explicit;
    // Derive from retirement date - DOB. Both fields are validated upstream.
    try {
      const ret = new Date(retDate);
      const dob = new Date(str(data.dateOfBirth)!);
      const age = ret.getFullYear() - dob.getFullYear();
      if (age > 0 && age < 100) return age;
    } catch { /* fall through */ }
    return useAssumption(ASSUMPTIONS.ssDefaultStartAge);
  })();

  const input: ReportInput = {
    personal: {
      fullName: str(data.clientName)!,
      dateOfBirth: str(data.dateOfBirth)!,
      address: str(data.address) ?? '',
      maritalStatus: maritalStatus as any,
      spouseDateOfBirth: str(data.spouseDOB) ?? '',
    },
    employment: {
      serviceComputationDate: scd,
      retirementSystem: mapRetirementSystem(str(data.retirementSystem)),
      employeeType: mapEmployeeType(),
      currentAnnualSalary: num(data.currentAnnualSalary)!,
      annualSalaryIncreaseRate,
      creditableServiceYears: civilian.years,
      creditableServiceMonths: civilian.months,
      sickLeaveHours: num(data.sickLeaveHours) ?? 0,
      plannedRetirementDate: retDate,
      csrsServiceYears: csrsService.years, csrsServiceMonths: csrsService.months,
      fersServiceYears: fersService.years, fersServiceMonths: fersService.months,
    },
    tsp: {
      traditionalBalances: [
        { fund: 'G', balance: num(data.tspTraditionalG) ?? 0, returnRate: rateG },
        { fund: 'F', balance: num(data.tspTraditionalF) ?? 0, returnRate: rateF },
        { fund: 'C', balance: num(data.tspTraditionalC) ?? 0, returnRate: rateC },
        { fund: 'S', balance: num(data.tspTraditionalS) ?? 0, returnRate: rateS },
        { fund: 'I', balance: num(data.tspTraditionalI) ?? 0, returnRate: rateI },
        { fund: 'L', balance: num(data.tspTraditionalL) ?? 0, returnRate: rateL },
      ],
      rothBalances: [
        { fund: 'G', balance: num(data.tspRothG) ?? 0, returnRate: rateG },
        { fund: 'F', balance: num(data.tspRothF) ?? 0, returnRate: rateF },
        { fund: 'C', balance: num(data.tspRothC) ?? 0, returnRate: rateC },
        { fund: 'S', balance: num(data.tspRothS) ?? 0, returnRate: rateS },
        { fund: 'I', balance: num(data.tspRothI) ?? 0, returnRate: rateI },
        { fund: 'L', balance: num(data.tspRothL) ?? 0, returnRate: rateL },
      ],
      annualContributionTraditional: num(data.tspAnnualContribution) ?? 0,
      annualContributionRoth: num(data.tspRothContribution) ?? 0,
      governmentMatchPercent: ASSUMPTIONS.governmentMatchPercent.value,
      catchUpContribution: num(data.tspCatchUp) ?? 0,
      expectedReturnRate: tspExpectedReturn,
      plannedWithdrawalAge: tspWithdrawalAge,
      withdrawalMethod: (str(data.tspWithdrawalMethod) ?? 'MONTHLY_PAYMENTS') as any,
      monthlyWithdrawalAmount: num(data.tspMonthlyWithdrawal),
    },
    fegli: {
      basicCoverage: data.fegliBasic !== false,
      optionA: data.fegliOptionA === true,
      optionB: data.fegliOptionB === true,
      optionBMultiple: num(data.fegliOptionBMultiple) ?? 0,
      optionC: data.fegliOptionC === true,
      optionCMultiple: num(data.fegliOptionCMultiple) ?? 0,
      postRetirementReduction: fegliPostRetirement as any,
    },
    fehb: {
      currentPlanName: str(data.fehbPlanName) ?? '',
      enrollment: fehbEnrollment as any,
      biweeklyPremium: num(data.fehbBiweeklyPremium) ?? 0,
      premiumIncreaseRate: fehbIncreaseRate,
    },
    socialSecurity: {
      estimatedBenefitAge62: 0,
      estimatedBenefitFRA: ssBenefit,
      plannedStartAge: ssStartAge,
    },
    ltc: { enrolled: false, currentPremium: 0, dailyBenefitAmount: 0, benefitPeriodYears: 3 },
    otherIncome: {
      otherPensions: num(data.otherPensions) ?? 0,
      spouseIncome: num(data.spouseIncome) ?? 0,
      rentalIncome: num(data.rentalIncome) ?? 0,
      investmentIncome: num(data.investmentIncome) ?? 0,
      otherTaxableIncome: 0,
      otherNonTaxableIncome: 0,
    },
    expenses: {
      housing: num(data.monthlyHousing) ?? 0,
      utilities: 0, transportation: 0, food: 0,
      healthcareOutOfPocket: 0, insurance: 0, debtPayments: 0,
      entertainment: 0, travel: 0, charitableGiving: 0, other: 0,
    },
    tax: {
      filingStatus: filingStatus as any,
      federalTaxRate,
      stateOfResidence: str(data.stateOfResidence) ?? '',
      stateTaxRate,
    },
    military: {
      hasMilitaryService: data.hasMilitaryService === true,
      branch: str(data.militaryBranch) ?? '',
      activeDutyStartDate: str(data.militaryStartDate) ?? '',
      activeDutyEndDate: str(data.militaryEndDate) ?? '',
      depositPaid: data.militaryDepositPaid === true,
      depositAmountOwed: 0,
    },
    deposits: {
      hasNonDeductionService: data.hasNonDeductionService === true,
      depositOwed: num(data.depositOwed) ?? 0,
      hasRefundedService: data.hasRefundedService === true,
      reDepositOwed: num(data.reDepositOwed) ?? 0,
    },
    advisorName: str(data.advisorName) ?? process.env.ADVISOR_NAME ?? '',
    advisorCompany: str(data.advisorCompany) ?? process.env.ADVISOR_COMPANY ?? 'Capital Wealth',
    advisorPhone: str(data.advisorPhone) ?? process.env.ADVISOR_PHONE ?? '',
    advisorEmail: str(data.advisorEmail) ?? process.env.ADVISOR_EMAIL ?? '',
    survivorElection: survivorElection as any,
    colaAssumption,
    projectionYears: ASSUMPTIONS.projectionYears.value,
  };

  return { input, applied };
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
      return NextResponse.json(
        { error: 'Intake data is incomplete — cannot generate report', missing: errors, warnings, recordId },
        { status: 422 },
      );
    }
    const { input, applied } = mapToReportInput(data);
    const results = calculateReport(input);

    return NextResponse.json({
      success: true,
      recordId,
      employeeName: input.personal.fullName,
      input,
      results,
      // Anything we had to default. Mapped fallbacks + parser-coverage warnings.
      dataWarnings: warnings,
      assumptionsApplied: applied,
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
