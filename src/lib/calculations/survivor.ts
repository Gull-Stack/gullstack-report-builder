/**
 * Survivor Benefit Calculations
 *
 * FERS survivor benefit elections:
 * - 50% election: annuity reduced by 10%, survivor receives 50% of unreduced annuity
 * - 25% election: annuity reduced by 5%, survivor receives 25% of unreduced annuity
 * - None: no cost, no survivor benefit
 *
 * CSRS survivor benefit elections:
 * - 55% election: annuity reduced by ~2.5% of first $3,600 + 10% of remainder
 * - For simplicity we use FERS rules here; CSRS specifics can be extended.
 *
 * The reduction is applied to the UNREDUCED annuity (before survivor election).
 */

import type { SurvivorElection, SurvivorBenefitResult } from '@/lib/types';

/**
 * Calculate survivor benefit cost and payout.
 *
 * @param unreducedAnnualAnnuity - The annual annuity before survivor reduction
 * @param election - The survivor benefit election
 * @param retirementSystem - FERS or CSRS (affects CSRS formula variant)
 * @returns SurvivorBenefitResult with cost and survivor amounts
 */
export function calculateSurvivorBenefit(
  unreducedAnnualAnnuity: number,
  election: SurvivorElection,
  retirementSystem: 'FERS' | 'CSRS' | 'CSRS_OFFSET' | 'FERS_TRANSFER' = 'FERS'
): SurvivorBenefitResult {
  if (election === 'NONE') {
    return {
      election,
      annualCost: 0,
      monthlyCost: 0,
      survivorAnnualBenefit: 0,
      survivorMonthlyBenefit: 0,
    };
  }

  const isCsrsType =
    retirementSystem === 'CSRS' || retirementSystem === 'CSRS_OFFSET';

  let reductionRate: number;
  let survivorRate: number;

  if (election === '50_PERCENT') {
    if (isCsrsType) {
      // CSRS: 2.5% of first $3,600 + 10% of remainder for max survivor
      const first3600Reduction = Math.min(unreducedAnnualAnnuity, 3600) * 0.025;
      const remainderReduction =
        Math.max(unreducedAnnualAnnuity - 3600, 0) * 0.10;
      const annualCost =
        Math.round((first3600Reduction + remainderReduction) * 100) / 100;
      const survivorAnnual =
        Math.round(unreducedAnnualAnnuity * 0.55 * 100) / 100; // CSRS is 55%

      return {
        election,
        annualCost,
        monthlyCost: Math.round((annualCost / 12) * 100) / 100,
        survivorAnnualBenefit: survivorAnnual,
        survivorMonthlyBenefit: Math.round((survivorAnnual / 12) * 100) / 100,
      };
    }
    // FERS: 10% reduction, survivor gets 50%
    reductionRate = 0.10;
    survivorRate = 0.50;
  } else {
    // 25_PERCENT
    if (isCsrsType) {
      // CSRS partial survivor: lesser reduction
      const first3600Reduction =
        Math.min(unreducedAnnualAnnuity, 3600) * 0.025 * 0.5;
      const remainderReduction =
        Math.max(unreducedAnnualAnnuity - 3600, 0) * 0.10 * 0.5;
      const annualCost =
        Math.round((first3600Reduction + remainderReduction) * 100) / 100;
      const survivorAnnual =
        Math.round(unreducedAnnualAnnuity * 0.55 * 0.5 * 100) / 100;

      return {
        election,
        annualCost,
        monthlyCost: Math.round((annualCost / 12) * 100) / 100,
        survivorAnnualBenefit: survivorAnnual,
        survivorMonthlyBenefit: Math.round((survivorAnnual / 12) * 100) / 100,
      };
    }
    // FERS: 5% reduction, survivor gets 25%
    reductionRate = 0.05;
    survivorRate = 0.25;
  }

  const annualCost =
    Math.round(unreducedAnnualAnnuity * reductionRate * 100) / 100;
  const survivorAnnualBenefit =
    Math.round(unreducedAnnualAnnuity * survivorRate * 100) / 100;

  return {
    election,
    annualCost,
    monthlyCost: Math.round((annualCost / 12) * 100) / 100,
    survivorAnnualBenefit,
    survivorMonthlyBenefit:
      Math.round((survivorAnnualBenefit / 12) * 100) / 100,
  };
}
