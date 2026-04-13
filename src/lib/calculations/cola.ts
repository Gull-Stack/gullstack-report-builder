/**
 * COLA (Cost-of-Living Adjustment) Calculations
 *
 * FERS COLA rules:
 *   - If CPI increase <= 2%: COLA = CPI
 *   - If CPI increase > 2% and <= 3%: COLA = 2%
 *   - If CPI increase > 3%: COLA = CPI - 1%
 *
 * CSRS COLA rules:
 *   - Full CPI increase (no cap)
 *
 * FERS Special Provisions (LEO/FF/ATC) and FERS Transfer:
 *   - Same FERS COLA rules apply
 *
 * CSRS Offset:
 *   - Same as CSRS (full CPI) for the annuity portion
 *
 * Note: COLA is first applied in the December after retirement (payable January).
 * Retirees who have been retired less than 1 year receive a prorated COLA.
 */

import type {
  RetirementSystem,
  ColaProjection,
} from '@/lib/types';

/**
 * Calculate the effective COLA rate for FERS based on CPI increase.
 *
 * @param cpiIncrease - Annual CPI-W increase (e.g., 0.03 for 3%)
 * @returns Effective COLA rate
 */
export function fersColaRate(cpiIncrease: number): number {
  if (cpiIncrease <= 0) return 0;
  if (cpiIncrease <= 0.02) return cpiIncrease;
  if (cpiIncrease <= 0.03) return 0.02;
  return cpiIncrease - 0.01;
}

/**
 * Calculate the effective COLA rate for CSRS based on CPI increase.
 * CSRS retirees get the full CPI adjustment.
 *
 * @param cpiIncrease - Annual CPI-W increase
 * @returns Effective COLA rate (same as CPI)
 */
export function csrsColaRate(cpiIncrease: number): number {
  return Math.max(cpiIncrease, 0);
}

/**
 * Get the COLA rate based on retirement system and CPI assumption.
 */
export function getColaRate(
  retirementSystem: RetirementSystem,
  cpiIncrease: number
): number {
  switch (retirementSystem) {
    case 'FERS':
    case 'FERS_TRANSFER':
      return fersColaRate(cpiIncrease);
    case 'CSRS':
    case 'CSRS_OFFSET':
      return csrsColaRate(cpiIncrease);
    default:
      return fersColaRate(cpiIncrease);
  }
}

/**
 * Generate year-by-year COLA projections for the annuity.
 *
 * @param startingAnnualAnnuity - Annual annuity at retirement (after survivor reduction)
 * @param retirementSystem - Determines COLA formula
 * @param cpiAssumption - Assumed annual CPI increase
 * @param retirementYear - Year of retirement
 * @param projectionYears - Number of years to project (default 30)
 * @returns Array of ColaProjection
 */
export function calculateColaProjections(
  startingAnnualAnnuity: number,
  retirementSystem: RetirementSystem,
  cpiAssumption: number,
  retirementYear: number,
  projectionYears: number = 30
): ColaProjection[] {
  const projections: ColaProjection[] = [];
  let currentAnnuity = startingAnnualAnnuity;

  for (let i = 0; i < projectionYears; i++) {
    const year = retirementYear + i;

    if (i === 0) {
      // First year: no COLA (retirement year)
      projections.push({
        year,
        colaRate: 0,
        annuityAfterCola: Math.round(currentAnnuity * 100) / 100,
      });
    } else {
      const cola = getColaRate(retirementSystem, cpiAssumption);
      currentAnnuity = currentAnnuity * (1 + cola);
      projections.push({
        year,
        colaRate: Math.round(cola * 10000) / 10000,
        annuityAfterCola: Math.round(currentAnnuity * 100) / 100,
      });
    }
  }

  return projections;
}
