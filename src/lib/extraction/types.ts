// ============================================================
// Document Extraction — Type Definitions
// ============================================================

export type DocumentType = 'SF50' | 'LES' | 'TSP_STATEMENT' | 'SOCIAL_SECURITY' | 'DD214';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  SF50: 'SF-50 (Personnel Action)',
  LES: 'Leave & Earnings Statement',
  TSP_STATEMENT: 'TSP Statement',
  SOCIAL_SECURITY: 'Social Security Statement',
  DD214: 'Military DD-214',
};

export interface FieldExtraction<T = unknown> {
  value: T;
  confidence: number; // 0-1
  source: DocumentType;
}

// Partial extraction result — every field is optional with confidence
export interface ExtractionResult {
  // Personal
  fullName?: FieldExtraction<string>;
  dateOfBirth?: FieldExtraction<string>;

  // Employment (SF-50)
  serviceComputationDate?: FieldExtraction<string>;
  retirementSystem?: FieldExtraction<string>;
  employeeType?: FieldExtraction<string>;
  payGrade?: FieldExtraction<string>;
  annualSalary?: FieldExtraction<number>;
  dutyStation?: FieldExtraction<string>;
  agency?: FieldExtraction<string>;
  appointmentType?: FieldExtraction<string>;

  // LES fields
  tspTraditionalContribution?: FieldExtraction<number>;
  tspRothContribution?: FieldExtraction<number>;
  fegliBasic?: FieldExtraction<boolean>;
  fegliOptionA?: FieldExtraction<boolean>;
  fegliOptionB?: FieldExtraction<boolean>;
  fegliOptionBMultiple?: FieldExtraction<number>;
  fegliOptionC?: FieldExtraction<boolean>;
  fegliOptionCMultiple?: FieldExtraction<number>;
  fehbPlanName?: FieldExtraction<string>;
  fehbEnrollment?: FieldExtraction<string>;
  fehbBiweeklyPremium?: FieldExtraction<number>;
  federalTaxWithholding?: FieldExtraction<number>;
  stateTaxWithholding?: FieldExtraction<number>;
  retirementDeductionRate?: FieldExtraction<number>;
  sickLeaveHours?: FieldExtraction<number>;

  // TSP Statement
  tspTraditionalBalances?: FieldExtraction<Record<string, number>>;
  tspRothBalances?: FieldExtraction<Record<string, number>>;
  tspTotalBalance?: FieldExtraction<number>;
  tspContributions?: FieldExtraction<number>;
  tspGovernmentMatch?: FieldExtraction<number>;

  // Social Security
  ssaBenefitAge62?: FieldExtraction<number>;
  ssaBenefitFRA?: FieldExtraction<number>;
  ssaBenefitAge70?: FieldExtraction<number>;

  // DD-214
  militaryBranch?: FieldExtraction<string>;
  activeDutyStartDate?: FieldExtraction<string>;
  activeDutyEndDate?: FieldExtraction<string>;
  dischargeCharacter?: FieldExtraction<string>;
}

export interface UploadedDocument {
  file: File;
  type: DocumentType;
  base64: string;
  mimeType: string;
}

export interface ExtractionResponse {
  extraction: ExtractionResult;
  errors: string[];
  documentsProcessed: number;
}
