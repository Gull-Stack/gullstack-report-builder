// ============================================================
// Document Extraction — Merge Multiple Extraction Results
// ============================================================

import type { ExtractionResult, FieldExtraction } from './types';
import type { ReportInput } from '../types';
import { defaultReportInput } from '../defaults';

/**
 * Merge multiple extraction results — highest confidence wins per field.
 */
export function mergeExtractions(results: ExtractionResult[]): ExtractionResult {
  const merged: ExtractionResult = {};

  for (const result of results) {
    for (const [key, field] of Object.entries(result)) {
      if (!field) continue;
      const typedKey = key as keyof ExtractionResult;
      const existing = merged[typedKey] as FieldExtraction | undefined;
      const incoming = field as FieldExtraction;

      if (!existing || incoming.confidence > existing.confidence) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (merged as any)[typedKey] = incoming;
      }
    }
  }

  return merged;
}

/**
 * Map retirement system string to valid enum value
 */
function mapRetirementSystem(raw: string): ReportInput['employment']['retirementSystem'] {
  const normalized = raw.toUpperCase().replace(/[\s-]/g, '_');
  const valid = ['FERS', 'CSRS', 'CSRS_OFFSET', 'FERS_TRANSFER'] as const;
  for (const v of valid) {
    if (normalized.includes(v)) return v;
  }
  // Common aliases
  if (normalized.includes('OFFSET')) return 'CSRS_OFFSET';
  if (normalized.includes('TRANSFER')) return 'FERS_TRANSFER';
  return 'FERS';
}

/**
 * Map employee type string to valid enum value
 */
function mapEmployeeType(raw: string): ReportInput['employment']['employeeType'] {
  const normalized = raw.toUpperCase();
  if (normalized.includes('LEO') || normalized.includes('LAW ENFORCEMENT')) return 'LEO';
  if (normalized.includes('FIRE')) return 'FIREFIGHTER';
  if (normalized.includes('ATC') || normalized.includes('AIR TRAFFIC')) return 'ATC';
  if (normalized.includes('POSTAL')) return 'POSTAL';
  if (normalized.includes('CONGRESS')) return 'CONGRESSIONAL';
  return 'REGULAR';
}

/**
 * Map FEHB enrollment string to valid enum value
 */
function mapFehbEnrollment(raw: string): ReportInput['fehb']['enrollment'] {
  const normalized = raw.toUpperCase().replace(/[\s-]/g, '_');
  if (normalized.includes('FAMILY')) return 'SELF_AND_FAMILY';
  if (normalized.includes('PLUS_ONE') || normalized.includes('+1') || normalized.includes('PLUS ONE')) return 'SELF_PLUS_ONE';
  return 'SELF_ONLY';
}

/**
 * Convert merged extraction into a partial ReportInput with defaults filled in.
 * Returns the input and a map of which fields were AI-extracted vs default.
 */
export function extractionToReportInput(extraction: ExtractionResult): {
  input: ReportInput;
  extractedFields: Set<string>;
} {
  const input: ReportInput = JSON.parse(JSON.stringify(defaultReportInput));
  const extractedFields = new Set<string>();

  // Personal
  if (extraction.fullName) {
    input.personal.fullName = extraction.fullName.value;
    extractedFields.add('personal.fullName');
  }
  if (extraction.dateOfBirth) {
    input.personal.dateOfBirth = extraction.dateOfBirth.value;
    extractedFields.add('personal.dateOfBirth');
  }

  // Employment
  if (extraction.serviceComputationDate) {
    input.employment.serviceComputationDate = extraction.serviceComputationDate.value;
    extractedFields.add('employment.serviceComputationDate');
  }
  if (extraction.retirementSystem) {
    input.employment.retirementSystem = mapRetirementSystem(extraction.retirementSystem.value);
    extractedFields.add('employment.retirementSystem');
  }
  if (extraction.employeeType) {
    input.employment.employeeType = mapEmployeeType(extraction.employeeType.value);
    extractedFields.add('employment.employeeType');
  }
  if (extraction.annualSalary) {
    input.employment.currentAnnualSalary = extraction.annualSalary.value;
    extractedFields.add('employment.currentAnnualSalary');
  }
  if (extraction.sickLeaveHours) {
    input.employment.sickLeaveHours = extraction.sickLeaveHours.value;
    extractedFields.add('employment.sickLeaveHours');
  }

  // TSP
  if (extraction.tspTraditionalContribution) {
    // Convert biweekly to annual (26 pay periods)
    input.tsp.annualContributionTraditional = extraction.tspTraditionalContribution.value * 26;
    extractedFields.add('tsp.annualContributionTraditional');
  }
  if (extraction.tspRothContribution) {
    input.tsp.annualContributionRoth = extraction.tspRothContribution.value * 26;
    extractedFields.add('tsp.annualContributionRoth');
  }
  if (extraction.tspTraditionalBalances) {
    const balances = extraction.tspTraditionalBalances.value;
    for (const fund of input.tsp.traditionalBalances) {
      if (balances[fund.fund] != null) {
        fund.balance = balances[fund.fund];
      }
    }
    extractedFields.add('tsp.traditionalBalances');
  }
  if (extraction.tspRothBalances) {
    const balances = extraction.tspRothBalances.value;
    for (const fund of input.tsp.rothBalances) {
      if (balances[fund.fund] != null) {
        fund.balance = balances[fund.fund];
      }
    }
    extractedFields.add('tsp.rothBalances');
  }

  // FEGLI
  if (extraction.fegliBasic != null) {
    input.fegli.basicCoverage = extraction.fegliBasic.value;
    extractedFields.add('fegli.basicCoverage');
  }
  if (extraction.fegliOptionA != null) {
    input.fegli.optionA = extraction.fegliOptionA.value;
    extractedFields.add('fegli.optionA');
  }
  if (extraction.fegliOptionB != null) {
    input.fegli.optionB = extraction.fegliOptionB.value;
    extractedFields.add('fegli.optionB');
  }
  if (extraction.fegliOptionBMultiple) {
    input.fegli.optionBMultiple = extraction.fegliOptionBMultiple.value;
    extractedFields.add('fegli.optionBMultiple');
  }
  if (extraction.fegliOptionC != null) {
    input.fegli.optionC = extraction.fegliOptionC.value;
    extractedFields.add('fegli.optionC');
  }
  if (extraction.fegliOptionCMultiple) {
    input.fegli.optionCMultiple = extraction.fegliOptionCMultiple.value;
    extractedFields.add('fegli.optionCMultiple');
  }

  // FEHB
  if (extraction.fehbPlanName) {
    input.fehb.currentPlanName = extraction.fehbPlanName.value;
    extractedFields.add('fehb.currentPlanName');
  }
  if (extraction.fehbEnrollment) {
    input.fehb.enrollment = mapFehbEnrollment(extraction.fehbEnrollment.value);
    extractedFields.add('fehb.enrollment');
  }
  if (extraction.fehbBiweeklyPremium) {
    input.fehb.biweeklyPremium = extraction.fehbBiweeklyPremium.value;
    extractedFields.add('fehb.biweeklyPremium');
  }

  // Social Security
  if (extraction.ssaBenefitAge62) {
    input.socialSecurity.estimatedBenefitAge62 = extraction.ssaBenefitAge62.value;
    extractedFields.add('socialSecurity.estimatedBenefitAge62');
  }
  if (extraction.ssaBenefitFRA) {
    input.socialSecurity.estimatedBenefitFRA = extraction.ssaBenefitFRA.value;
    extractedFields.add('socialSecurity.estimatedBenefitFRA');
  }

  // Military
  if (extraction.militaryBranch) {
    input.military.hasMilitaryService = true;
    input.military.branch = extraction.militaryBranch.value;
    extractedFields.add('military.branch');
  }
  if (extraction.activeDutyStartDate) {
    input.military.activeDutyStartDate = extraction.activeDutyStartDate.value;
    extractedFields.add('military.activeDutyStartDate');
  }
  if (extraction.activeDutyEndDate) {
    input.military.activeDutyEndDate = extraction.activeDutyEndDate.value;
    extractedFields.add('military.activeDutyEndDate');
  }

  return { input, extractedFields };
}
