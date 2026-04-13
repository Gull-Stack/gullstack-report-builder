/**
 * Salesforce Integration — Generate Report from SF Record
 * 
 * POST /api/salesforce/generate
 * Body: { recordId: string }
 * 
 * Flow:
 * 1. Authenticate with SF via OAuth2 client credentials
 * 2. Fetch the federal employee record
 * 3. Map SF fields to ReportInput schema
 * 4. Run calculation engine
 * 5. Return PDF (or attach to SF record)
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateReport } from '@/lib/calculations';
import type { ReportInput } from '@/lib/types';

// SF credentials from environment
const SF_CLIENT_ID = process.env.SF_CLIENT_ID!;
const SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET!;
const SF_INSTANCE_URL = process.env.SF_INSTANCE_URL!; // e.g. https://capitalwealth.my.salesforce.com
const SF_OBJECT = process.env.SF_OBJECT || 'Contact'; // default to Contact

/**
 * Authenticate with Salesforce using OAuth2 Client Credentials flow.
 */
async function getSalesforceToken(): Promise<string> {
  const tokenUrl = `${SF_INSTANCE_URL}/services/oauth2/token`;
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SF_CLIENT_ID,
      client_secret: SF_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SF auth failed: ${response.status} — ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetch a record from Salesforce by ID.
 */
async function fetchSalesforceRecord(
  token: string,
  recordId: string
): Promise<Record<string, any>> {
  const url = `${SF_INSTANCE_URL}/services/data/v60.0/sobjects/${SF_OBJECT}/${recordId}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SF fetch failed: ${response.status} — ${error}`);
  }

  return response.json();
}

/**
 * Map Salesforce fields to our ReportInput schema.
 * 
 * THIS IS THE FIELD MAPPING — customize based on actual SF field names.
 * Uses sensible defaults for any missing fields.
 */
function mapSalesforceToReportInput(record: Record<string, any>): ReportInput {
  // Helper: safely get a value with a default
  const get = (field: string, defaultValue: any = '') => record[field] ?? defaultValue;
  const getNum = (field: string, defaultValue: number = 0) => {
    const val = record[field];
    return val != null ? Number(val) : defaultValue;
  };
  const getDate = (field: string, defaultValue: string = '2000-01-01') => {
    const val = record[field];
    if (!val) return defaultValue;
    // SF dates come as YYYY-MM-DD
    return String(val).substring(0, 10);
  };

  // Map retirement system string to our enum
  const mapRetirementSystem = (val: string) => {
    const upper = (val || 'FERS').toUpperCase();
    if (upper.includes('CSRS') && upper.includes('OFFSET')) return 'CSRS_OFFSET' as const;
    if (upper.includes('TRANSFER')) return 'FERS_TRANSFER' as const;
    if (upper.includes('CSRS')) return 'CSRS' as const;
    return 'FERS' as const;
  };

  // Map employee type
  const mapEmployeeType = (val: string) => {
    const upper = (val || 'REGULAR').toUpperCase();
    if (upper.includes('LEO') || upper.includes('LAW')) return 'LEO' as const;
    if (upper.includes('FIRE')) return 'FIREFIGHTER' as const;
    if (upper.includes('ATC') || upper.includes('AIR TRAFFIC')) return 'ATC' as const;
    if (upper.includes('POSTAL')) return 'POSTAL' as const;
    if (upper.includes('CONGRESS')) return 'CONGRESSIONAL' as const;
    return 'REGULAR' as const;
  };

  return {
    personal: {
      fullName: `${get('FirstName', '')} ${get('LastName', '')}`.trim() || get('Name', 'Unknown'),
      dateOfBirth: getDate('Date_of_Birth__c', getDate('Birthdate', '1970-01-01')),
      address: [get('MailingStreet', ''), get('MailingCity', ''), get('MailingState', ''), get('MailingPostalCode', '')].filter(Boolean).join(', ') || get('Address__c', ''),
      maritalStatus: (get('Marital_Status__c', 'SINGLE') || 'SINGLE').toUpperCase() as any,
      spouseDateOfBirth: getDate('Spouse_Date_of_Birth__c', ''),
    },

    employment: {
      serviceComputationDate: getDate('Service_Computation_Date__c', getDate('SCD__c', '2000-01-01')),
      retirementSystem: mapRetirementSystem(get('Retirement_System__c', 'FERS')),
      employeeType: mapEmployeeType(get('Employee_Type__c', 'REGULAR')),
      currentAnnualSalary: getNum('Annual_Salary__c', getNum('Salary__c', 75000)),
      annualSalaryIncreaseRate: getNum('Salary_Increase_Rate__c', 0.02),
      creditableServiceYears: getNum('Creditable_Service_Years__c', 0),
      creditableServiceMonths: getNum('Creditable_Service_Months__c', 0),
      sickLeaveHours: getNum('Sick_Leave_Hours__c', 0),
      plannedRetirementDate: getDate('Planned_Retirement_Date__c', getDate('Retirement_Date__c', '2030-01-01')),
      csrsServiceYears: getNum('CSRS_Service_Years__c', 0),
      csrsServiceMonths: getNum('CSRS_Service_Months__c', 0),
      fersServiceYears: getNum('FERS_Service_Years__c', 0),
      fersServiceMonths: getNum('FERS_Service_Months__c', 0),
    },

    tsp: {
      traditionalBalances: [
        { fund: 'G' as const, balance: getNum('TSP_G_Fund__c', 0), returnRate: 0.025 },
        { fund: 'F' as const, balance: getNum('TSP_F_Fund__c', 0), returnRate: 0.04 },
        { fund: 'C' as const, balance: getNum('TSP_C_Fund__c', 0), returnRate: 0.10 },
        { fund: 'S' as const, balance: getNum('TSP_S_Fund__c', 0), returnRate: 0.09 },
        { fund: 'I' as const, balance: getNum('TSP_I_Fund__c', 0), returnRate: 0.07 },
        { fund: 'L' as const, balance: getNum('TSP_L_Fund__c', 0), returnRate: 0.07 },
      ],
      rothBalances: [
        { fund: 'G' as const, balance: getNum('TSP_Roth_G_Fund__c', 0), returnRate: 0.025 },
        { fund: 'F' as const, balance: getNum('TSP_Roth_F_Fund__c', 0), returnRate: 0.04 },
        { fund: 'C' as const, balance: getNum('TSP_Roth_C_Fund__c', 0), returnRate: 0.10 },
        { fund: 'S' as const, balance: getNum('TSP_Roth_S_Fund__c', 0), returnRate: 0.09 },
        { fund: 'I' as const, balance: getNum('TSP_Roth_I_Fund__c', 0), returnRate: 0.07 },
        { fund: 'L' as const, balance: getNum('TSP_Roth_L_Fund__c', 0), returnRate: 0.07 },
      ],
      annualContributionTraditional: getNum('TSP_Annual_Contribution__c', getNum('TSP_Contribution__c', 0)),
      annualContributionRoth: getNum('TSP_Roth_Contribution__c', 0),
      governmentMatchPercent: 5,
      catchUpContribution: getNum('TSP_Catch_Up__c', 0),
      expectedReturnRate: getNum('TSP_Expected_Return__c', 0.07),
      plannedWithdrawalAge: getNum('TSP_Withdrawal_Age__c', 62),
      withdrawalMethod: (get('TSP_Withdrawal_Method__c', 'MONTHLY_PAYMENTS') || 'MONTHLY_PAYMENTS').toUpperCase().replace(/ /g, '_') as any,
      monthlyWithdrawalAmount: getNum('TSP_Monthly_Withdrawal__c', undefined),
    },

    fegli: {
      basicCoverage: get('FEGLI_Basic__c', true) !== false,
      optionA: get('FEGLI_Option_A__c', false) === true,
      optionB: get('FEGLI_Option_B__c', false) === true,
      optionBMultiple: getNum('FEGLI_Option_B_Multiple__c', 1),
      optionC: get('FEGLI_Option_C__c', false) === true,
      optionCMultiple: getNum('FEGLI_Option_C_Multiple__c', 1),
      postRetirementReduction: (get('FEGLI_Post_Retirement__c', '75_PERCENT') || '75_PERCENT') as any,
    },

    fehb: {
      currentPlanName: get('FEHB_Plan__c', get('Health_Plan__c', 'BCBS Standard')),
      enrollment: (get('FEHB_Enrollment__c', 'SELF_ONLY') || 'SELF_ONLY').toUpperCase().replace(/ /g, '_').replace('&', 'AND') as any,
      biweeklyPremium: getNum('FEHB_Premium__c', getNum('Health_Premium__c', 200)),
      premiumIncreaseRate: getNum('FEHB_Increase_Rate__c', 0.05),
    },

    socialSecurity: {
      estimatedBenefitAge62: getNum('SS_Benefit_Age_62__c', getNum('Social_Security_62__c', 1500)),
      estimatedBenefitFRA: getNum('SS_Benefit_FRA__c', getNum('Social_Security_FRA__c', 2200)),
      plannedStartAge: getNum('SS_Start_Age__c', 62),
    },

    ltc: {
      enrolled: get('LTC_Enrolled__c', false) === true,
      currentPremium: getNum('LTC_Premium__c', 0),
      dailyBenefitAmount: getNum('LTC_Daily_Benefit__c', 0),
      benefitPeriodYears: getNum('LTC_Benefit_Period__c', 3),
    },

    otherIncome: {
      otherPensions: getNum('Other_Pensions__c', 0),
      spouseIncome: getNum('Spouse_Income__c', 0),
      rentalIncome: getNum('Rental_Income__c', 0),
      investmentIncome: getNum('Investment_Income__c', 0),
      otherTaxableIncome: getNum('Other_Taxable_Income__c', 0),
      otherNonTaxableIncome: getNum('Other_NonTaxable_Income__c', 0),
    },

    expenses: {
      housing: getNum('Expense_Housing__c', getNum('Monthly_Housing__c', 0)),
      utilities: getNum('Expense_Utilities__c', 0),
      transportation: getNum('Expense_Transportation__c', 0),
      food: getNum('Expense_Food__c', 0),
      healthcareOutOfPocket: getNum('Expense_Healthcare__c', 0),
      insurance: getNum('Expense_Insurance__c', 0),
      debtPayments: getNum('Expense_Debt__c', 0),
      entertainment: getNum('Expense_Entertainment__c', 0),
      travel: getNum('Expense_Travel__c', 0),
      charitableGiving: getNum('Expense_Charitable__c', 0),
      other: getNum('Expense_Other__c', 0),
    },

    tax: {
      filingStatus: (get('Filing_Status__c', 'SINGLE') || 'SINGLE').toUpperCase().replace(/ /g, '_') as any,
      federalTaxRate: getNum('Federal_Tax_Rate__c', 0.22),
      stateOfResidence: get('MailingState', get('State__c', 'VA')),
      stateTaxRate: getNum('State_Tax_Rate__c', 0.05),
    },

    military: {
      hasMilitaryService: get('Military_Service__c', false) === true,
      branch: get('Military_Branch__c', ''),
      activeDutyStartDate: getDate('Military_Start__c', ''),
      activeDutyEndDate: getDate('Military_End__c', ''),
      depositPaid: get('Military_Deposit_Paid__c', false) === true,
      depositAmountOwed: getNum('Military_Deposit_Owed__c', 0),
    },

    deposits: {
      hasNonDeductionService: get('Non_Deduction_Service__c', false) === true,
      depositOwed: getNum('Deposit_Owed__c', 0),
      hasRefundedService: get('Refunded_Service__c', false) === true,
      reDepositOwed: getNum('ReDeposit_Owed__c', 0),
    },

    // Advisor branding from environment or SF record
    advisorName: get('Advisor_Name__c', process.env.ADVISOR_NAME || ''),
    advisorCompany: get('Advisor_Company__c', process.env.ADVISOR_COMPANY || 'CapitalWealth'),
    advisorPhone: get('Advisor_Phone__c', process.env.ADVISOR_PHONE || ''),
    advisorEmail: get('Advisor_Email__c', process.env.ADVISOR_EMAIL || ''),
    survivorElection: (get('Survivor_Election__c', '50_PERCENT') || '50_PERCENT') as any,
    colaAssumption: getNum('COLA_Assumption__c', 0.02),
    projectionYears: 30,
  };
}

/**
 * Optionally attach the PDF back to the Salesforce record.
 */
async function attachPdfToSalesforce(
  token: string,
  recordId: string,
  pdfBase64: string,
  fileName: string
): Promise<string> {
  // Create ContentVersion (SF File)
  const url = `${SF_INSTANCE_URL}/services/data/v60.0/sobjects/ContentVersion`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Title: fileName,
      PathOnClient: `${fileName}.pdf`,
      VersionData: pdfBase64,
      FirstPublishLocationId: recordId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SF file upload failed: ${response.status} — ${error}`);
  }

  const data = await response.json();
  return data.id;
}

// ---- API Route Handler ----

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId, attachToRecord = true } = body;

    if (!recordId) {
      return NextResponse.json(
        { error: 'recordId is required' },
        { status: 400 }
      );
    }

    if (!SF_CLIENT_ID || !SF_CLIENT_SECRET || !SF_INSTANCE_URL) {
      return NextResponse.json(
        { error: 'Salesforce credentials not configured. Set SF_CLIENT_ID, SF_CLIENT_SECRET, and SF_INSTANCE_URL environment variables.' },
        { status: 500 }
      );
    }

    // 1. Authenticate with Salesforce
    const token = await getSalesforceToken();

    // 2. Fetch the record
    const record = await fetchSalesforceRecord(token, recordId);

    // 3. Map to our schema
    const reportInput = mapSalesforceToReportInput(record);

    // 4. Run all calculations
    const results = calculateReport(reportInput);

    // 5. Return results (PDF generation happens client-side or via /api/report/pdf)
    return NextResponse.json({
      success: true,
      recordId,
      employeeName: reportInput.personal.fullName,
      input: reportInput,
      results,
    });

  } catch (error: any) {
    console.error('Salesforce generate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report from Salesforce' },
      { status: 500 }
    );
  }
}
