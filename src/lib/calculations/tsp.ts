/**
 * TSP (Thrift Savings Plan) Calculations
 *
 * - Per-fund growth projections (G/F/C/S/I/L)
 * - Traditional + Roth balances tracked separately
 * - Government match (FERS: automatic 1% + match up to 5% of salary)
 * - Year-by-year: start balance, contributions, match, growth, end balance
 * - Withdrawal calculations: lump sum, monthly payments, life annuity
 */

import { parseISO, getYear, differenceInYears } from 'date-fns';
import type {
  TspInfo,
  TspFundBalance,
  TspResult,
  TspProjectionYear,
  EmploymentInfo,
  RetirementSystem,
} from '@/lib/types';

/**
 * TSP Life Annuity Factor Table
 *
 * Approximate MetLife annuity factors: monthly payment per $1,000 of balance.
 * Source: TSP annuity rate tables (approximate).
 */
const TSP_ANNUITY_FACTORS: [number, number][] = [
  [55, 4.72], [56, 4.82], [57, 4.93], [58, 5.04], [59, 5.16],
  [60, 5.29], [61, 5.42], [62, 5.57], [63, 5.72], [64, 5.88],
  [65, 6.05], [66, 6.24], [67, 6.44], [68, 6.65], [69, 6.88],
  [70, 7.13], [71, 7.40], [72, 7.69], [73, 8.01], [74, 8.36],
  [75, 8.74], [76, 9.16], [77, 9.62], [78, 10.12], [79, 10.68],
  [80, 11.30],
];

/**
 * Look up or interpolate the TSP life annuity factor for a given age.
 * For ages below 55, uses 55's factor. Above 80, uses 80's factor.
 */
function getTspAnnuityFactor(age: number): number {
  if (age <= 55) return TSP_ANNUITY_FACTORS[0][1];
  if (age >= 80) return TSP_ANNUITY_FACTORS[TSP_ANNUITY_FACTORS.length - 1][1];

  // Find surrounding entries for interpolation
  for (let i = 0; i < TSP_ANNUITY_FACTORS.length - 1; i++) {
    const [ageLow, factorLow] = TSP_ANNUITY_FACTORS[i];
    const [ageHigh, factorHigh] = TSP_ANNUITY_FACTORS[i + 1];
    if (age >= ageLow && age <= ageHigh) {
      // Linear interpolation
      const fraction = (age - ageLow) / (ageHigh - ageLow);
      return factorLow + fraction * (factorHigh - factorLow);
    }
  }

  // Fallback (shouldn't reach here)
  return 6.05;
}

/**
 * Calculate aggregate balance and blended return rate across funds.
 */
function aggregateFunds(
  funds: TspFundBalance[]
): { totalBalance: number; blendedRate: number } {
  const totalBalance = funds.reduce((sum, f) => sum + f.balance, 0);
  if (totalBalance === 0) return { totalBalance: 0, blendedRate: 0 };

  // Weighted average return rate
  const weightedRate = funds.reduce(
    (sum, f) => sum + f.returnRate * (f.balance / totalBalance),
    0
  );

  return { totalBalance, blendedRate: weightedRate };
}

/**
 * Calculate the FERS government match.
 *
 * FERS matching:
 *   - Automatic 1% of salary (regardless of employee contribution)
 *   - Dollar-for-dollar match on first 3% of salary contributed
 *   - 50 cents per dollar on next 2% of salary contributed
 *   - Maximum match = 1% auto + 3% + 1% = 5% of salary
 *
 * @param annualSalary - Current annual salary
 * @param employeeContribution - Employee's annual TSP contribution
 * @param retirementSystem - Only FERS/FERS_TRANSFER get the match
 * @returns Annual government match amount
 */
export function calculateGovernmentMatch(
  annualSalary: number,
  employeeContribution: number,
  retirementSystem: RetirementSystem
): number {
  // Only FERS and FERS Transfer get the government match
  if (retirementSystem !== 'FERS' && retirementSystem !== 'FERS_TRANSFER') {
    return 0;
  }

  // Automatic 1%
  const auto1 = annualSalary * 0.01;

  // Employee contribution as percent of salary
  const employeePercent =
    annualSalary > 0 ? employeeContribution / annualSalary : 0;

  // Dollar-for-dollar match on first 3%
  const matchFirst3 = Math.min(employeePercent, 0.03) * annualSalary;

  // 50-cent match on next 2% (3% to 5%)
  const matchNext2 =
    Math.min(Math.max(employeePercent - 0.03, 0), 0.02) * annualSalary * 0.5;

  return Math.round((auto1 + matchFirst3 + matchNext2) * 100) / 100;
}

/**
 * Project TSP balances year-by-year from now to retirement and optionally beyond.
 *
 * @param startBalance - Starting balance
 * @param annualContribution - Annual employee contribution
 * @param annualMatch - Annual government match
 * @param returnRate - Annual return rate (blended or per-fund)
 * @param startYear - Current year
 * @param startAge - Current age
 * @param retirementYear - Year of retirement
 * @param projectionEndYear - Last year to project
 * @returns Array of TspProjectionYear
 */
function projectBalances(
  startBalance: number,
  annualContribution: number,
  annualMatch: number,
  returnRate: number,
  startYear: number,
  startAge: number,
  retirementYear: number,
  projectionEndYear: number,
  salaryIncreaseRate: number = 0
): TspProjectionYear[] {
  const projections: TspProjectionYear[] = [];
  let balance = startBalance;

  for (let year = startYear; year <= projectionEndYear; year++) {
    const age = startAge + (year - startYear);
    const isPreRetirement = year < retirementYear;

    // Contribution escalates with salary growth pre-retirement.
    const escalator = Math.pow(1 + salaryIncreaseRate, year - startYear);
    const contributions = isPreRetirement ? annualContribution * escalator : 0;
    const match = isPreRetirement ? annualMatch * escalator : 0;

    // Growth applies to start balance + half of year's contributions (mid-year assumption)
    const growthBase = balance + (contributions + match) / 2;
    const growth = Math.round(growthBase * returnRate * 100) / 100;

    const endBalance =
      Math.round((balance + contributions + match + growth) * 100) / 100;

    projections.push({
      year,
      age,
      startBalance: Math.round(balance * 100) / 100,
      contributions: Math.round(contributions * 100) / 100,
      governmentMatch: Math.round(match * 100) / 100,
      growth,
      endBalance,
    });

    balance = endBalance;
  }

  return projections;
}

/**
 * Calculate monthly withdrawal based on method.
 *
 * - LUMP_SUM: entire balance withdrawn at retirement
 * - MONTHLY_PAYMENTS: fixed monthly amount
 * - LIFE_ANNUITY: balance / expected months remaining (simplified)
 * - COMBINATION: user-specified monthly amount
 */
export function calculateWithdrawal(
  totalBalance: number,
  method: string,
  monthlyAmount: number | undefined,
  ageAtRetirement: number
): { monthly: number; annual: number } {
  switch (method) {
    case 'LUMP_SUM':
      return { monthly: totalBalance, annual: totalBalance };

    case 'MONTHLY_PAYMENTS':
      if (monthlyAmount && monthlyAmount > 0) {
        return {
          monthly: monthlyAmount,
          annual: Math.round(monthlyAmount * 12 * 100) / 100,
        };
      }
      // Default: spread over expected remaining life (IRS life expectancy ~85)
      const remainingMonths = Math.max((85 - ageAtRetirement) * 12, 12);
      const defaultMonthly =
        Math.round((totalBalance / remainingMonths) * 100) / 100;
      return {
        monthly: defaultMonthly,
        annual: Math.round(defaultMonthly * 12 * 100) / 100,
      };

    case 'LIFE_ANNUITY': {
      // TSP life annuity using real MetLife factor table
      // Factor = monthly payment per $1,000 of balance
      const factor = getTspAnnuityFactor(ageAtRetirement);
      const monthly = Math.round((totalBalance * factor) / 1000 * 100) / 100;
      return { monthly, annual: Math.round(monthly * 12 * 100) / 100 };
    }

    case 'COMBINATION':
      if (monthlyAmount && monthlyAmount > 0) {
        return {
          monthly: monthlyAmount,
          annual: Math.round(monthlyAmount * 12 * 100) / 100,
        };
      }
      return { monthly: 0, annual: 0 };

    default:
      return { monthly: 0, annual: 0 };
  }
}

/**
 * Main TSP calculator.
 *
 * Projects Traditional and Roth balances separately through retirement,
 * calculates government match, and determines withdrawal amounts.
 */
export function calculateTsp(
  tsp: TspInfo,
  employment: EmploymentInfo,
  dateOfBirth: string,
  projectionYears: number = 30
): TspResult {
  const dob = parseISO(dateOfBirth);
  const retirementDate = parseISO(employment.plannedRetirementDate);
  const currentYear = new Date().getFullYear();
  const retirementYear = getYear(retirementDate);
  const currentAge = differenceInYears(new Date(), dob);
  const ageAtRetirement = differenceInYears(retirementDate, dob);
  const projectionEndYear = retirementYear + projectionYears;

  // Aggregate fund balances
  const traditional = aggregateFunds(tsp.traditionalBalances);
  const roth = aggregateFunds(tsp.rothBalances);

  // Use blended rate or overall expected return
  const tradRate =
    traditional.blendedRate > 0
      ? traditional.blendedRate
      : tsp.expectedReturnRate;
  const rothRate =
    roth.blendedRate > 0 ? roth.blendedRate : tsp.expectedReturnRate;

  // Government match based on total employee contributions
  const totalEmployeeContribution =
    tsp.annualContributionTraditional +
    tsp.annualContributionRoth +
    tsp.catchUpContribution;

  const annualMatch = calculateGovernmentMatch(
    employment.currentAnnualSalary,
    totalEmployeeContribution,
    employment.retirementSystem
  );

  // Split match proportionally between Traditional and Roth
  // Government match always goes to Traditional
  const matchToTraditional = annualMatch;

  // Project Traditional
  const traditionalProjections = projectBalances(
    traditional.totalBalance,
    tsp.annualContributionTraditional + tsp.catchUpContribution,
    matchToTraditional,
    tradRate,
    currentYear,
    currentAge,
    retirementYear,
    projectionEndYear,
    employment.annualSalaryIncreaseRate
  );

  // Project Roth (no government match — match always goes to Traditional)
  const rothProjections = projectBalances(
    roth.totalBalance,
    tsp.annualContributionRoth,
    0,
    rothRate,
    currentYear,
    currentAge,
    retirementYear,
    projectionEndYear,
    employment.annualSalaryIncreaseRate
  );

  // Balances at retirement
  const retirementIndex = retirementYear - currentYear;
  const tradAtRetirement =
    retirementIndex >= 0 && retirementIndex < traditionalProjections.length
      ? traditionalProjections[retirementIndex].endBalance
      : traditional.totalBalance;
  const rothAtRetirement =
    retirementIndex >= 0 && retirementIndex < rothProjections.length
      ? rothProjections[retirementIndex].endBalance
      : roth.totalBalance;
  const totalAtRetirement = tradAtRetirement + rothAtRetirement;

  // Withdrawal calculation
  const withdrawal = calculateWithdrawal(
    totalAtRetirement,
    tsp.withdrawalMethod,
    tsp.monthlyWithdrawalAmount,
    ageAtRetirement
  );

  return {
    traditionalProjections,
    rothProjections,
    totalAtRetirement: Math.round(totalAtRetirement * 100) / 100,
    traditionalAtRetirement: Math.round(tradAtRetirement * 100) / 100,
    rothAtRetirement: Math.round(rothAtRetirement * 100) / 100,
    monthlyWithdrawal: withdrawal.monthly,
    annualWithdrawal: withdrawal.annual,
  };
}
