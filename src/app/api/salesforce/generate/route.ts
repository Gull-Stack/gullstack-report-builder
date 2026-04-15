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
import { calculateReport } from '@/lib/calculations';
import type { ReportInput } from '@/lib/types';

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
      creditableServiceYears: 0,
      creditableServiceMonths: 0,
      sickLeaveHours: getNum('sickLeaveHours', 0),
      plannedRetirementDate: get('plannedRetirementDate', '2030-01-01'),
      csrsServiceYears: 0, csrsServiceMonths: 0,
      fersServiceYears: 0, fersServiceMonths: 0,
    },
    tsp: {
      traditionalBalances: [
        { fund: 'G' as const, balance: getNum('tspTraditionalG', 0), returnRate: 0.025 },
        { fund: 'F' as const, balance: getNum('tspTraditionalF', 0), returnRate: 0.04 },
        { fund: 'C' as const, balance: getNum('tspTraditionalC', 0), returnRate: 0.10 },
        { fund: 'S' as const, balance: getNum('tspTraditionalS', 0), returnRate: 0.09 },
        { fund: 'I' as const, balance: getNum('tspTraditionalI', 0), returnRate: 0.07 },
        { fund: 'L' as const, balance: getNum('tspTraditionalL', 0), returnRate: 0.07 },
      ],
      rothBalances: [
        { fund: 'G' as const, balance: getNum('tspRothG', 0), returnRate: 0.025 },
        { fund: 'F' as const, balance: getNum('tspRothF', 0), returnRate: 0.04 },
        { fund: 'C' as const, balance: getNum('tspRothC', 0), returnRate: 0.10 },
        { fund: 'S' as const, balance: getNum('tspRothS', 0), returnRate: 0.09 },
        { fund: 'I' as const, balance: getNum('tspRothI', 0), returnRate: 0.07 },
        { fund: 'L' as const, balance: getNum('tspRothL', 0), returnRate: 0.07 },
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
    socialSecurity: {
      estimatedBenefitAge62: getNum('ssBenefitAge62', 1500),
      estimatedBenefitFRA: getNum('ssBenefitAge62', 1500) * 1.4,
      plannedStartAge: getNum('ssStartAge', 62),
    },
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
    colaAssumption: 0.02,
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
    const reportInput = mapToReportInput(data);
    const results = calculateReport(reportInput);

    return NextResponse.json({
      success: true,
      recordId,
      employeeName: reportInput.personal.fullName,
      input: reportInput,
      results,
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
