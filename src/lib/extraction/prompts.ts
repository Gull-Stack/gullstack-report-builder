// ============================================================
// Document Extraction — AI Prompts per Document Type
// ============================================================

import type { DocumentType } from './types';

const SF50_PROMPT = `You are extracting data from a U.S. Federal Government SF-50 (Notification of Personnel Action) form.

Extract the following fields as precisely as possible. Return a JSON object with these keys:

{
  "fullName": "Employee's full name (Last, First Middle)",
  "dateOfBirth": "Date of birth in YYYY-MM-DD format",
  "serviceComputationDate": "Service Computation Date (SCD) for retirement in YYYY-MM-DD format",
  "retirementSystem": "One of: FERS, CSRS, CSRS_OFFSET, FERS_TRANSFER",
  "employeeType": "One of: REGULAR, LEO, FIREFIGHTER, ATC, POSTAL, CONGRESSIONAL",
  "payGrade": "Pay grade and step (e.g., GS-13/Step 5)",
  "annualSalary": "Annual base salary as a number (no $ or commas)",
  "dutyStation": "Duty station location",
  "agency": "Agency/department name",
  "appointmentType": "Type of appointment (Career, Career-Conditional, etc.)"
}

For each field, also provide a confidence score from 0 to 1 indicating how certain you are of the extraction. Return the response as:
{
  "fields": { ...extracted fields... },
  "confidence": { "fullName": 0.95, "dateOfBirth": 0.8, ... }
}

If a field is not visible or cannot be determined, omit it from "fields" and set its confidence to 0.`;

const LES_PROMPT = `You are extracting data from a U.S. Federal Government Leave and Earnings Statement (LES).

Extract the following fields. Return a JSON object:

{
  "tspTraditionalContribution": "Biweekly TSP Traditional contribution amount (number)",
  "tspRothContribution": "Biweekly TSP Roth contribution amount (number)",
  "fegliBasic": "Whether FEGLI Basic is elected (true/false)",
  "fegliOptionA": "Whether FEGLI Option A is elected (true/false)",
  "fegliOptionB": "Whether FEGLI Option B is elected (true/false)",
  "fegliOptionBMultiple": "FEGLI Option B multiple (1-5, number)",
  "fegliOptionC": "Whether FEGLI Option C is elected (true/false)",
  "fegliOptionCMultiple": "FEGLI Option C multiple (1-5, number)",
  "fehbPlanName": "FEHB plan name",
  "fehbEnrollment": "One of: SELF_ONLY, SELF_PLUS_ONE, SELF_AND_FAMILY",
  "fehbBiweeklyPremium": "FEHB biweekly premium (number)",
  "federalTaxWithholding": "Federal tax withholding per pay period (number)",
  "stateTaxWithholding": "State tax withholding per pay period (number)",
  "retirementDeductionRate": "Retirement deduction percentage as decimal (e.g., 0.044 for FERS 4.4%)",
  "sickLeaveHours": "Sick leave balance in hours (number)",
  "annualSalary": "Annual base salary if shown (number)"
}

For each field, also provide a confidence score from 0 to 1. Return as:
{
  "fields": { ...extracted fields... },
  "confidence": { "tspTraditionalContribution": 0.9, ... }
}

If a field is not visible, omit it from "fields" and set its confidence to 0.`;

const TSP_PROMPT = `You are extracting data from a Thrift Savings Plan (TSP) account statement.

Extract the following fields. Return a JSON object:

{
  "traditionalBalances": {
    "G": 0, "F": 0, "C": 0, "S": 0, "I": 0, "L": 0
  },
  "rothBalances": {
    "G": 0, "F": 0, "C": 0, "S": 0, "I": 0, "L": 0
  },
  "totalBalance": "Total account balance (number)",
  "contributions": "Total employee contributions for the period (number)",
  "governmentMatch": "Government matching contributions for the period (number)"
}

Notes:
- Fund balances should be numbers (no $ or commas)
- Include both Traditional and Roth balances separately if shown
- L funds include all Lifecycle funds (L 2025, L 2030, etc.) — sum them into "L"
- If only total balances are shown (not split by fund), put the total in the most likely fund

For each top-level field, provide confidence scores. Return as:
{
  "fields": { ...extracted fields... },
  "confidence": { "traditionalBalances": 0.85, "rothBalances": 0.7, "totalBalance": 0.95, ... }
}`;

const SOCIAL_SECURITY_PROMPT = `You are extracting data from a Social Security Statement.

Extract the following fields. Return a JSON object:

{
  "benefitAge62": "Estimated monthly benefit at age 62 (number)",
  "benefitFRA": "Estimated monthly benefit at Full Retirement Age (number)",
  "benefitAge70": "Estimated monthly benefit at age 70 (number)"
}

Notes:
- All amounts should be numbers (no $ or commas)
- These are monthly benefit amounts
- Full Retirement Age (FRA) varies by birth year — extract whatever the statement shows

For each field, provide confidence scores. Return as:
{
  "fields": { ...extracted fields... },
  "confidence": { "benefitAge62": 0.9, "benefitFRA": 0.95, "benefitAge70": 0.9 }
}`;

const DD214_PROMPT = `You are extracting data from a U.S. Military DD-214 (Certificate of Release or Discharge from Active Duty).

Extract the following fields. Return a JSON object:

{
  "branch": "Branch of service (Army, Navy, Air Force, Marines, Coast Guard, Space Force)",
  "activeDutyStartDate": "Date entered active duty in YYYY-MM-DD format",
  "activeDutyEndDate": "Separation/discharge date in YYYY-MM-DD format",
  "dischargeCharacter": "Character of discharge (Honorable, General, Other Than Honorable, etc.)"
}

For each field, provide confidence scores. Return as:
{
  "fields": { ...extracted fields... },
  "confidence": { "branch": 0.95, "activeDutyStartDate": 0.9, ... }
}`;

export const EXTRACTION_PROMPTS: Record<DocumentType, string> = {
  SF50: SF50_PROMPT,
  LES: LES_PROMPT,
  TSP_STATEMENT: TSP_PROMPT,
  SOCIAL_SECURITY: SOCIAL_SECURITY_PROMPT,
  DD214: DD214_PROMPT,
};
