/**
 * FEGLI (Federal Employees' Group Life Insurance) Calculations
 *
 * Coverage amounts:
 *   - Basic: Salary rounded up to nearest $1,000 + $2,000
 *   - Option A (Standard): $10,000 flat
 *   - Option B (Additional): 1x to 5x salary (rounded up to nearest $1,000)
 *   - Option C (Family): $5,000 per multiple on spouse, $2,500 per multiple on child
 *
 * Biweekly rates are age-banded per OPM published rate tables.
 *
 * Post-65 reduction options for Basic:
 *   - No Reduction: keep full coverage, pay full cost
 *   - 75% Reduction: reduces to 25% at no cost after 65
 *   - 50% Reduction: reduces to 50%, small cost after 65
 *   - Additional reduction to 0%: eventually no coverage
 */

import { parseISO, differenceInYears, getYear } from 'date-fns';
import type {
  FegliInfo,
  FegliResult,
  FegliCostYear,
  FegliReduction,
} from '@/lib/types';

/**
 * Calculate Basic FEGLI coverage amount.
 * Salary rounded up to nearest $1,000 + $2,000 extra coverage.
 */
export function calculateBasicCoverage(annualSalary: number): number {
  const roundedUp = Math.ceil(annualSalary / 1000) * 1000;
  return roundedUp + 2000;
}

/**
 * Calculate Option B coverage (1-5 multiples of salary, rounded up).
 */
export function calculateOptionBCoverage(
  annualSalary: number,
  multiple: number
): number {
  const roundedUp = Math.ceil(annualSalary / 1000) * 1000;
  return roundedUp * Math.min(Math.max(multiple, 1), 5);
}

/**
 * Calculate Option C coverage per multiple.
 * Each multiple = $5,000 spouse + $2,500 per eligible child.
 * For cost projection purposes, we use per-multiple values.
 */
export function calculateOptionCCoverage(multiple: number): number {
  // Each multiple provides $5,000 spouse coverage + $2,500 child coverage
  // Total face value per multiple for cost purposes
  return 5000 * Math.min(Math.max(multiple, 1), 5);
}

// ---- OPM Published Biweekly Rate Tables (per $1,000 of coverage) ----
// These are the 2024 OPM-published biweekly premium rates.

/**
 * Basic FEGLI biweekly rate per $1,000 of coverage.
 * The rate is $0.15 per $1,000 biweekly for all ages (employee pays 2/3, government pays 1/3).
 * Effective employee cost = $0.15 per $1,000 biweekly (post-retirement: full $0.3250).
 */
const BASIC_BIWEEKLY_RATE_PER_1000_ACTIVE = 0.15; // Employee share while active
const BASIC_BIWEEKLY_RATE_PER_1000_RETIRED = 0.3250; // Full cost in retirement (before 65)

/**
 * Option A (Standard $10,000) biweekly rates by age band.
 * These are per pay period, not per $1,000.
 */
const OPTION_A_BIWEEKLY_RATES: Record<string, number> = {
  'under35': 0.43,
  '35-39': 0.52,
  '40-44': 0.65,
  '45-49': 1.00,
  '50-54': 1.53,
  '55-59': 2.90,
  '60-64': 5.55,
  '65-69': 7.20,
  '70-74': 10.60,
  '75-79': 15.60,
  '80+': 23.40,
};

/**
 * Option B biweekly rates per $1,000 of salary (per multiple) by age band.
 */
const OPTION_B_BIWEEKLY_RATES_PER_1000: Record<string, number> = {
  'under35': 0.02,
  '35-39': 0.03,
  '40-44': 0.04,
  '45-49': 0.07,
  '50-54': 0.10,
  '55-59': 0.20,
  '60-64': 0.40,
  '65-69': 0.70,
  '70-74': 1.09,
  '75-79': 1.76,
  '80+': 2.64,
};

/**
 * Option C biweekly rates per $1,000 of benefit (per multiple) by age band.
 * Rate is per multiple of coverage.
 */
const OPTION_C_BIWEEKLY_RATES: Record<string, number> = {
  'under35': 0.27,
  '35-39': 0.32,
  '40-44': 0.42,
  '45-49': 0.65,
  '50-54': 0.95,
  '55-59': 1.75,
  '60-64': 3.30,
  '65-69': 4.35,
  '70-74': 6.40,
  '75-79': 9.40,
  '80+': 14.10,
};

/**
 * Get the age band key for rate lookup.
 */
function getAgeBand(age: number): string {
  if (age < 35) return 'under35';
  if (age <= 39) return '35-39';
  if (age <= 44) return '40-44';
  if (age <= 49) return '45-49';
  if (age <= 54) return '50-54';
  if (age <= 59) return '55-59';
  if (age <= 64) return '60-64';
  if (age <= 69) return '65-69';
  if (age <= 74) return '70-74';
  if (age <= 79) return '75-79';
  return '80+';
}

/**
 * Calculate biweekly cost for Basic FEGLI.
 */
function basicBiweeklyCost(
  coverage: number,
  age: number,
  isRetired: boolean
): number {
  const rate = isRetired
    ? BASIC_BIWEEKLY_RATE_PER_1000_RETIRED
    : BASIC_BIWEEKLY_RATE_PER_1000_ACTIVE;
  return (coverage / 1000) * rate;
}

/**
 * Calculate biweekly cost for Option A.
 */
function optionABiweeklyCost(age: number): number {
  const band = getAgeBand(age);
  return OPTION_A_BIWEEKLY_RATES[band] ?? 0;
}

/**
 * Calculate biweekly cost for Option B.
 */
function optionBBiweeklyCost(
  annualSalary: number,
  multiple: number,
  age: number
): number {
  const band = getAgeBand(age);
  const ratePer1000 = OPTION_B_BIWEEKLY_RATES_PER_1000[band] ?? 0;
  const roundedSalary = Math.ceil(annualSalary / 1000) * 1000;
  return (roundedSalary / 1000) * ratePer1000 * multiple;
}

/**
 * Calculate biweekly cost for Option C.
 */
function optionCBiweeklyCost(multiple: number, age: number): number {
  const band = getAgeBand(age);
  const rate = OPTION_C_BIWEEKLY_RATES[band] ?? 0;
  return rate * multiple;
}

/**
 * Apply post-65 Basic coverage reduction.
 *
 * After age 65 (or retirement if later), Basic coverage reduces:
 * - 75% Reduction: reduces 2% per month to 25% of pre-retirement amount (free)
 * - 50% Reduction: reduces 1% per month to 50% (small cost)
 * - No Reduction: keeps full coverage (continues paying)
 * - ZERO: eventually reduces to nothing
 *
 * For simplicity, we model the final reduction amount by year.
 */
function postRetirementBasicCoverage(
  fullCoverage: number,
  age: number,
  retirementAge: number,
  reduction: FegliReduction
): { coverage: number; biweeklyCost: number } {
  const reductionStartAge = Math.max(65, retirementAge);

  if (age < reductionStartAge) {
    return {
      coverage: fullCoverage,
      biweeklyCost: basicBiweeklyCost(fullCoverage, age, age >= retirementAge),
    };
  }

  const monthsSinceStart = (age - reductionStartAge) * 12;

  switch (reduction) {
    case 'NO_REDUCTION':
      // Full coverage, continues paying full cost
      return {
        coverage: fullCoverage,
        biweeklyCost: basicBiweeklyCost(fullCoverage, age, true),
      };

    case '75_PERCENT': {
      // Reduces 2% per month until 25% remaining. Free after full reduction.
      const reductionPercent = Math.min(monthsSinceStart * 0.02, 0.75);
      const coverage = fullCoverage * (1 - reductionPercent);
      // Free once reduction completes
      const biweeklyCost =
        reductionPercent >= 0.75 ? 0 : basicBiweeklyCost(coverage, age, true);
      return { coverage: Math.round(coverage), biweeklyCost };
    }

    case '50_PERCENT': {
      // Reduces 1% per month until 50% remaining. Reduced cost continues.
      const reductionPercent = Math.min(monthsSinceStart * 0.01, 0.50);
      const coverage = fullCoverage * (1 - reductionPercent);
      // After full reduction, extra premium cost for keeping 50%
      const extraBiweekly = reductionPercent >= 0.50 ? (coverage / 1000) * 0.60 : 0;
      const biweeklyCost =
        reductionPercent >= 0.50
          ? extraBiweekly
          : basicBiweeklyCost(coverage, age, true);
      return { coverage: Math.round(coverage), biweeklyCost };
    }

    case '25_PERCENT': {
      // Reduces 2% per month until 25%, then continues to reduce
      // to a final amount based on additional coverage purchased
      const reductionPercent = Math.min(monthsSinceStart * 0.02, 0.75);
      const coverage = fullCoverage * (1 - reductionPercent);
      const biweeklyCost =
        reductionPercent >= 0.75 ? 0 : basicBiweeklyCost(coverage, age, true);
      return { coverage: Math.round(coverage), biweeklyCost };
    }

    case 'ZERO': {
      // Reduces 2% per month until nothing
      const reductionPercent = Math.min(monthsSinceStart * 0.02, 1.0);
      const coverage = fullCoverage * (1 - reductionPercent);
      const biweeklyCost =
        reductionPercent >= 1.0 ? 0 : basicBiweeklyCost(coverage, age, true);
      return { coverage: Math.round(coverage), biweeklyCost };
    }

    default:
      return {
        coverage: fullCoverage,
        biweeklyCost: basicBiweeklyCost(fullCoverage, age, true),
      };
  }
}

/**
 * Main FEGLI calculator.
 *
 * Computes current coverage amounts, current costs, and year-by-year
 * cost projections from current age through projection period.
 */
export function calculateFegli(
  fegli: FegliInfo,
  annualSalary: number,
  dateOfBirth: string,
  retirementDate: string,
  projectionYears: number = 30,
  annualSalaryIncreaseRate: number = 0.02
): FegliResult {
  const dob = parseISO(dateOfBirth);
  const retirement = parseISO(retirementDate);
  const currentAge = differenceInYears(new Date(), dob);
  const retirementAge = differenceInYears(retirement, dob);
  const retirementYear = getYear(retirement);
  const currentYear = new Date().getFullYear();

  // Helper: projected salary at year offset i (i=0 is currentYear)
  const salaryAt = (i: number) =>
    annualSalary * Math.pow(1 + annualSalaryIncreaseRate, i);

  // Current coverage amounts
  const basicCov = fegli.basicCoverage ? calculateBasicCoverage(annualSalary) : 0;
  const optionACov = fegli.optionA ? 10000 : 0;
  const optionBCov = fegli.optionB
    ? calculateOptionBCoverage(annualSalary, fegli.optionBMultiple)
    : 0;
  const optionCCov = fegli.optionC
    ? calculateOptionCCoverage(fegli.optionCMultiple)
    : 0;
  const totalCov = basicCov + optionACov + optionBCov + optionCCov;

  // Current biweekly costs
  const currentBasicBiweekly = fegli.basicCoverage
    ? basicBiweeklyCost(basicCov, currentAge, false)
    : 0;
  const currentOptionABiweekly = fegli.optionA
    ? optionABiweeklyCost(currentAge)
    : 0;
  const currentOptionBBiweekly = fegli.optionB
    ? optionBBiweeklyCost(annualSalary, fegli.optionBMultiple, currentAge)
    : 0;
  const currentOptionCBiweekly = fegli.optionC
    ? optionCBiweeklyCost(fegli.optionCMultiple, currentAge)
    : 0;

  // 26 pay periods per year, divide by 2 for monthly (~ 2.167 pay periods/month)
  const biweeklyToMonthly = 26 / 12;
  const currentMonthlyCost =
    Math.round(
      (currentBasicBiweekly +
        currentOptionABiweekly +
        currentOptionBBiweekly +
        currentOptionCBiweekly) *
        biweeklyToMonthly *
        100
    ) / 100;

  // Year-by-year cost projections.
  // Pre-retirement: Basic coverage = ceil(projected salary / 1000) × 1000 + $2,000.
  // Post-retirement: coverage freezes at the at-retirement amount and the
  // elected reduction kicks in starting at max(65, retirementAge).
  const costProjections: FegliCostYear[] = [];

  // Pre-compute the at-retirement basic coverage from the projected salary.
  const yearsToRetirement = retirementYear - currentYear;
  const retirementSalary = salaryAt(yearsToRetirement);
  const basicCovAtRetirement = fegli.basicCoverage
    ? calculateBasicCoverage(retirementSalary)
    : 0;

  for (let i = 0; i <= projectionYears; i++) {
    const year = currentYear + i;
    const age = currentAge + i;
    const isRetired = year >= retirementYear;

    // Basic coverage
    let basicInfo: { coverage: number; biweeklyCost: number };
    if (fegli.basicCoverage) {
      if (isRetired) {
        basicInfo = postRetirementBasicCoverage(
          basicCovAtRetirement,
          age,
          retirementAge,
          fegli.postRetirementReduction
        );
      } else {
        const yearSalary = salaryAt(i);
        const yearCoverage = calculateBasicCoverage(yearSalary);
        basicInfo = {
          coverage: yearCoverage,
          biweeklyCost: basicBiweeklyCost(yearCoverage, age, false),
        };
      }
    } else {
      basicInfo = { coverage: 0, biweeklyCost: 0 };
    }

    // Option A: terminates at 80 for post-65 unless keeping coverage
    const optACov = fegli.optionA && age < 80 ? optionACov : fegli.optionA ? optionACov : 0;
    const optABiweekly = fegli.optionA ? optionABiweeklyCost(age) : 0;

    // Option B: coverage reduces 2% per month after 65 (unless elected otherwise)
    // Standard reduction: to 0 over time; most retirees lose Option B after 65
    let optBCov = 0;
    let optBBiweekly = 0;
    if (fegli.optionB) {
      if (age < 65) {
        optBCov = optionBCov;
        optBBiweekly = optionBBiweeklyCost(
          annualSalary,
          fegli.optionBMultiple,
          age
        );
      } else {
        // Option B reduces after 65: standard is full reduction over ~4 years
        const monthsPast65 = (age - 65) * 12;
        const reductionFactor = Math.max(1 - monthsPast65 * 0.02, 0);
        optBCov = Math.round(optionBCov * reductionFactor);
        optBBiweekly = optBCov > 0
          ? optionBBiweeklyCost(annualSalary, fegli.optionBMultiple, age) * reductionFactor
          : 0;
      }
    }

    // Option C: terminates at 65 (no post-retirement Option C)
    let optCCov = 0;
    let optCBiweekly = 0;
    if (fegli.optionC && age < 65) {
      optCCov = optionCCov;
      optCBiweekly = optionCBiweeklyCost(fegli.optionCMultiple, age);
    }

    // Convert biweekly to annual (26 pay periods)
    const annualBasic = Math.round(basicInfo.biweeklyCost * 26 * 100) / 100;
    const annualOptA = Math.round(optABiweekly * 26 * 100) / 100;
    const annualOptB = Math.round(optBBiweekly * 26 * 100) / 100;
    const annualOptC = Math.round(optCBiweekly * 26 * 100) / 100;
    const totalAnnual =
      Math.round((annualBasic + annualOptA + annualOptB + annualOptC) * 100) /
      100;

    costProjections.push({
      age,
      year,
      basicCost: annualBasic,
      optionACost: annualOptA,
      optionBCost: annualOptB,
      optionCCost: annualOptC,
      totalCost: totalAnnual,
      basicCoverage: basicInfo.coverage,
      optionACoverage: optACov,
      optionBCoverage: optBCov,
      optionCCoverage: optCCov,
    });
  }

  return {
    currentCoverage: {
      basic: basicCov,
      optionA: optionACov,
      optionB: optionBCov,
      optionC: optionCCov,
      total: totalCov,
    },
    currentMonthlyCost,
    costProjections,
  };
}
