// ============================================================
// Document Extraction — Main Extraction Engine
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import type { DocumentType, ExtractionResult, FieldExtraction } from './types';
import { EXTRACTION_PROMPTS } from './prompts';

function makeField<T>(value: T, confidence: number, source: DocumentType): FieldExtraction<T> {
  return { value, confidence: Math.max(0, Math.min(1, confidence)), source };
}

function parseAIResponse(raw: string): { fields: Record<string, unknown>; confidence: Record<string, number> } {
  // Extract JSON from markdown code blocks if present
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
  const jsonStr = (jsonMatch[1] || raw).trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Try to find any JSON object in the response
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objMatch) {
      return JSON.parse(objMatch[0]);
    }
    throw new Error('Failed to parse AI extraction response as JSON');
  }
}

function mapSF50(fields: Record<string, unknown>, conf: Record<string, number>, docType: DocumentType): ExtractionResult {
  const result: ExtractionResult = {};
  if (fields.fullName) result.fullName = makeField(String(fields.fullName), conf.fullName ?? 0.5, docType);
  if (fields.dateOfBirth) result.dateOfBirth = makeField(String(fields.dateOfBirth), conf.dateOfBirth ?? 0.5, docType);
  if (fields.serviceComputationDate) result.serviceComputationDate = makeField(String(fields.serviceComputationDate), conf.serviceComputationDate ?? 0.5, docType);
  if (fields.retirementSystem) result.retirementSystem = makeField(String(fields.retirementSystem), conf.retirementSystem ?? 0.5, docType);
  if (fields.employeeType) result.employeeType = makeField(String(fields.employeeType), conf.employeeType ?? 0.5, docType);
  if (fields.payGrade) result.payGrade = makeField(String(fields.payGrade), conf.payGrade ?? 0.5, docType);
  if (fields.annualSalary != null) result.annualSalary = makeField(Number(fields.annualSalary), conf.annualSalary ?? 0.5, docType);
  if (fields.dutyStation) result.dutyStation = makeField(String(fields.dutyStation), conf.dutyStation ?? 0.5, docType);
  if (fields.agency) result.agency = makeField(String(fields.agency), conf.agency ?? 0.5, docType);
  if (fields.appointmentType) result.appointmentType = makeField(String(fields.appointmentType), conf.appointmentType ?? 0.5, docType);
  return result;
}

function mapLES(fields: Record<string, unknown>, conf: Record<string, number>, docType: DocumentType): ExtractionResult {
  const result: ExtractionResult = {};
  if (fields.tspTraditionalContribution != null) result.tspTraditionalContribution = makeField(Number(fields.tspTraditionalContribution), conf.tspTraditionalContribution ?? 0.5, docType);
  if (fields.tspRothContribution != null) result.tspRothContribution = makeField(Number(fields.tspRothContribution), conf.tspRothContribution ?? 0.5, docType);
  if (fields.fegliBasic != null) result.fegliBasic = makeField(Boolean(fields.fegliBasic), conf.fegliBasic ?? 0.5, docType);
  if (fields.fegliOptionA != null) result.fegliOptionA = makeField(Boolean(fields.fegliOptionA), conf.fegliOptionA ?? 0.5, docType);
  if (fields.fegliOptionB != null) result.fegliOptionB = makeField(Boolean(fields.fegliOptionB), conf.fegliOptionB ?? 0.5, docType);
  if (fields.fegliOptionBMultiple != null) result.fegliOptionBMultiple = makeField(Number(fields.fegliOptionBMultiple), conf.fegliOptionBMultiple ?? 0.5, docType);
  if (fields.fegliOptionC != null) result.fegliOptionC = makeField(Boolean(fields.fegliOptionC), conf.fegliOptionC ?? 0.5, docType);
  if (fields.fegliOptionCMultiple != null) result.fegliOptionCMultiple = makeField(Number(fields.fegliOptionCMultiple), conf.fegliOptionCMultiple ?? 0.5, docType);
  if (fields.fehbPlanName) result.fehbPlanName = makeField(String(fields.fehbPlanName), conf.fehbPlanName ?? 0.5, docType);
  if (fields.fehbEnrollment) result.fehbEnrollment = makeField(String(fields.fehbEnrollment), conf.fehbEnrollment ?? 0.5, docType);
  if (fields.fehbBiweeklyPremium != null) result.fehbBiweeklyPremium = makeField(Number(fields.fehbBiweeklyPremium), conf.fehbBiweeklyPremium ?? 0.5, docType);
  if (fields.federalTaxWithholding != null) result.federalTaxWithholding = makeField(Number(fields.federalTaxWithholding), conf.federalTaxWithholding ?? 0.5, docType);
  if (fields.stateTaxWithholding != null) result.stateTaxWithholding = makeField(Number(fields.stateTaxWithholding), conf.stateTaxWithholding ?? 0.5, docType);
  if (fields.retirementDeductionRate != null) result.retirementDeductionRate = makeField(Number(fields.retirementDeductionRate), conf.retirementDeductionRate ?? 0.5, docType);
  if (fields.sickLeaveHours != null) result.sickLeaveHours = makeField(Number(fields.sickLeaveHours), conf.sickLeaveHours ?? 0.5, docType);
  if (fields.annualSalary != null) result.annualSalary = makeField(Number(fields.annualSalary), conf.annualSalary ?? 0.5, docType);
  return result;
}

function mapTSP(fields: Record<string, unknown>, conf: Record<string, number>, docType: DocumentType): ExtractionResult {
  const result: ExtractionResult = {};
  if (fields.traditionalBalances) result.tspTraditionalBalances = makeField(fields.traditionalBalances as Record<string, number>, conf.traditionalBalances ?? 0.5, docType);
  if (fields.rothBalances) result.tspRothBalances = makeField(fields.rothBalances as Record<string, number>, conf.rothBalances ?? 0.5, docType);
  if (fields.totalBalance != null) result.tspTotalBalance = makeField(Number(fields.totalBalance), conf.totalBalance ?? 0.5, docType);
  if (fields.contributions != null) result.tspContributions = makeField(Number(fields.contributions), conf.contributions ?? 0.5, docType);
  if (fields.governmentMatch != null) result.tspGovernmentMatch = makeField(Number(fields.governmentMatch), conf.governmentMatch ?? 0.5, docType);
  return result;
}

function mapSocialSecurity(fields: Record<string, unknown>, conf: Record<string, number>, docType: DocumentType): ExtractionResult {
  const result: ExtractionResult = {};
  if (fields.benefitAge62 != null) result.ssaBenefitAge62 = makeField(Number(fields.benefitAge62), conf.benefitAge62 ?? 0.5, docType);
  if (fields.benefitFRA != null) result.ssaBenefitFRA = makeField(Number(fields.benefitFRA), conf.benefitFRA ?? 0.5, docType);
  if (fields.benefitAge70 != null) result.ssaBenefitAge70 = makeField(Number(fields.benefitAge70), conf.benefitAge70 ?? 0.5, docType);
  return result;
}

function mapDD214(fields: Record<string, unknown>, conf: Record<string, number>, docType: DocumentType): ExtractionResult {
  const result: ExtractionResult = {};
  if (fields.branch) result.militaryBranch = makeField(String(fields.branch), conf.branch ?? 0.5, docType);
  if (fields.activeDutyStartDate) result.activeDutyStartDate = makeField(String(fields.activeDutyStartDate), conf.activeDutyStartDate ?? 0.5, docType);
  if (fields.activeDutyEndDate) result.activeDutyEndDate = makeField(String(fields.activeDutyEndDate), conf.activeDutyEndDate ?? 0.5, docType);
  if (fields.dischargeCharacter) result.dischargeCharacter = makeField(String(fields.dischargeCharacter), conf.dischargeCharacter ?? 0.5, docType);
  return result;
}

const DOC_TYPE_MAPPERS: Record<DocumentType, (fields: Record<string, unknown>, conf: Record<string, number>, dt: DocumentType) => ExtractionResult> = {
  SF50: mapSF50,
  LES: mapLES,
  TSP_STATEMENT: mapTSP,
  SOCIAL_SECURITY: mapSocialSecurity,
  DD214: mapDD214,
};

export async function extractDocument(
  base64Data: string,
  mimeType: string,
  documentType: DocumentType,
  apiKey: string,
): Promise<ExtractionResult> {
  const client = new Anthropic({ apiKey });
  const prompt = EXTRACTION_PROMPTS[documentType];

  // Build the content block based on file type
  const isPdf = mimeType === 'application/pdf';
  const imageMediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

  const contentBlocks: Anthropic.MessageCreateParams['messages'][0]['content'] = isPdf
    ? [
        {
          type: 'document' as const,
          source: {
            type: 'base64' as const,
            media_type: 'application/pdf' as const,
            data: base64Data,
          },
        },
        { type: 'text' as const, text: prompt },
      ]
    : [
        {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: imageMediaType,
            data: base64Data,
          },
        },
        { type: 'text' as const, text: prompt },
      ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: contentBlocks as any,
      },
    ],
  });

  // Extract text from response
  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from AI extraction');
  }

  const parsed = parseAIResponse(textBlock.text);
  const mapper = DOC_TYPE_MAPPERS[documentType];
  return mapper(parsed.fields, parsed.confidence || {}, documentType);
}
