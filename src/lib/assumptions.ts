/**
 * Single source of truth for every assumption that's NOT a federal regulatory
 * constant. Federal rates (deposit %, FEHB cost-share, FERS multipliers, etc.)
 * live in src/lib/calculations/* and reflect law — they are not "assumptions."
 *
 * Anything in this file is a soft default that's applied when the FBI record
 * doesn't carry the value. Each entry has a `label` so the mapper can emit a
 * human-readable warning whenever the default is used, and the report cover
 * can list every assumption that affected the numbers.
 *
 * Override at deploy time via `process.env.<NAME>` if needed — values stay in
 * one place, never inlined into the mapper.
 */
const env = (key: string, fallback: number) => {
  const raw = process.env[key];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

export interface Assumption<T = number> {
  value: T;
  label: string;
}

export const ASSUMPTIONS = {
  annualSalaryIncreaseRate: {
    value: env('ASSUMPTION_SALARY_INCREASE', 0.02),
    label: 'Annual salary increase 2.0% (federal GS step + locality long-term avg)',
  } as Assumption,
  fehbIncreaseRate: {
    value: env('ASSUMPTION_FEHB_INCREASE', 0.05),
    label: 'FEHB premium increase 5.0%/yr (10-yr OPM avg)',
  } as Assumption,
  colaRate: {
    value: env('ASSUMPTION_COLA', 0.02),
    label: 'FERS COLA 2.0%/yr (long-term CPI assumption)',
  } as Assumption,
  tspExpectedReturn: {
    value: env('ASSUMPTION_TSP_BLENDED', 0.07),
    label: 'TSP blended return 7.0%/yr',
  } as Assumption,
  tspFundReturns: {
    G: { value: env('ASSUMPTION_TSP_G', 0.025), label: 'TSP G Fund 2.5%/yr (long-term avg)' },
    F: { value: env('ASSUMPTION_TSP_F', 0.04),  label: 'TSP F Fund 4.0%/yr (long-term avg)' },
    C: { value: env('ASSUMPTION_TSP_C', 0.10),  label: 'TSP C Fund 10.0%/yr (S&P 500 long-term avg)' },
    S: { value: env('ASSUMPTION_TSP_S', 0.09),  label: 'TSP S Fund 9.0%/yr (long-term avg)' },
    I: { value: env('ASSUMPTION_TSP_I', 0.07),  label: 'TSP I Fund 7.0%/yr (long-term avg)' },
    L: { value: env('ASSUMPTION_TSP_L', 0.07),  label: 'TSP L Fund 7.0%/yr (long-term avg)' },
  } satisfies Record<string, Assumption>,
  federalTaxRate: {
    value: env('ASSUMPTION_FED_TAX', 0.22),
    label: 'Federal effective tax 22% (single-filer assumption)',
  } as Assumption,
  stateTaxRate: {
    value: env('ASSUMPTION_STATE_TAX', 0.05),
    label: 'State effective tax 5% (no state-specific data on file)',
  } as Assumption,
  filingStatus: { value: 'SINGLE' as const, label: 'Filing status SINGLE (not on record)' },
  maritalStatus: { value: 'SINGLE' as const, label: 'Marital status SINGLE (not on record)' },
  fehbEnrollment: { value: 'SELF_ONLY' as const, label: 'FEHB enrollment Self-Only (not on record)' },
  fegliPostRetirement: { value: '75_PERCENT' as const, label: 'FEGLI post-65 reduction 75% (most-common election)' },
  survivorElection: { value: '50_PERCENT' as const, label: 'Survivor benefit 50% (most-common election)' },
  ssDefaultStartAge: {
    value: 67,
    label: 'Social Security claim age 67 (Full Retirement Age default)',
  } as Assumption,
  governmentMatchPercent: {
    value: 5,
    label: 'TSP government match 5% (federal regulatory max)',
  } as Assumption,
  projectionYears: {
    value: env('ASSUMPTION_PROJECTION_YEARS', 30),
    label: 'Projection horizon 30 years',
  } as Assumption,
} as const;

/**
 * A label string that the mapper appends to `dataWarnings` whenever it had to
 * substitute one of the values above for a missing field.
 */
export type AssumptionLabel = string;
