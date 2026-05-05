// ============================================================
// Federal Employee Benefits Analysis — PDF Document
// Mirrors the legacy 13-page Capital Wealth Federal Analysis report.
// ============================================================

import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { format, parseISO, getYear } from 'date-fns';
import styles, { colors } from './styles';

const CW_LOGO_URL = 'https://www.capitalwealth.com/assets/images/logos/logo-horizontal-color.png';
import type {
  ReportInput,
  CalculationResult,
} from '../types';

// ============================================================
// Formatting Helpers
// ============================================================

const fmt = {
  currency: (v: number | undefined | null): string => {
    if (v == null || isNaN(v)) return '$0.00';
    const neg = v < 0;
    const abs = Math.abs(v);
    const s = abs.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return neg ? `($${s})` : `$${s}`;
  },
  currencyWhole: (v: number | undefined | null): string => {
    if (v == null || isNaN(v)) return '$0';
    const neg = v < 0;
    const abs = Math.abs(v);
    const s = abs.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return neg ? `($${s})` : `$${s}`;
  },
  pct: (v: number | undefined | null, decimals = 2): string => {
    if (v == null || isNaN(v)) return '0.00%';
    return `${(v * 100).toFixed(decimals)}%`;
  },
  pctWhole: (v: number | undefined | null): string => {
    if (v == null || isNaN(v)) return '0%';
    return `${(v * 100).toFixed(0)}%`;
  },
  date: (iso: string | undefined | null): string => {
    if (!iso) return 'N/A';
    try { return format(parseISO(iso), 'MM-dd-yy'); } catch { return iso ?? 'N/A'; }
  },
  dateLong: (iso: string | undefined | null): string => {
    if (!iso) return 'N/A';
    try { return format(parseISO(iso), 'MMMM d, yyyy'); } catch { return iso ?? 'N/A'; }
  },
  num: (v: number | undefined | null, decimals = 2): string => {
    if (v == null || isNaN(v)) return '0';
    return v.toFixed(decimals);
  },
};

// ============================================================
// Reusable Sub-Components
// ============================================================

interface ReportPageProps {
  sectionTitle?: string;
  children: React.ReactNode;
  brand?: string;
  phone?: string;
}

const ReportPage: React.FC<ReportPageProps> = ({ sectionTitle, children, brand, phone }) => (
  <Page size="LETTER" style={styles.page}>
    {sectionTitle && (
      <View style={styles.header} fixed>
        <Text style={styles.headerBrand}>{brand ?? 'Capital Wealth'}</Text>
        <Text style={styles.headerSection}>{sectionTitle}</Text>
      </View>
    )}
    {children}
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        {brand ?? 'Capital Wealth'}
        {phone ? ` - ${phone}` : ''}
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  </Page>
);

/** Label / value row used on the summary page */
const SRow: React.FC<{ label: string; value: string; bold?: boolean }> = ({
  label, value, bold,
}) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, bold ? styles.bold : {}]}>{value}</Text>
  </View>
);

interface TableColumn {
  header: string;
  width: string | number;
  align?: 'left' | 'right' | 'center';
}

interface TableProps {
  columns: TableColumn[];
  rows: (string | number)[][];
}

const DataTable: React.FC<TableProps> = ({ columns, rows }) => (
  <View style={styles.table}>
    <View style={styles.tableHeader}>
      {columns.map((col, ci) => (
        <Text
          key={ci}
          style={[
            col.align === 'left' ? styles.tableHeaderCellLeft : styles.tableHeaderCell,
            {
              flex: typeof col.width === 'number' ? col.width : undefined,
              width: typeof col.width === 'string' ? col.width : undefined,
            },
          ]}
        >
          {col.header}
        </Text>
      ))}
    </View>
    {rows.map((row, ri) => (
      <View key={ri} style={ri % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
        {row.map((cell, ci) => (
          <Text
            key={ci}
            style={[
              columns[ci]?.align === 'left' ? styles.tableCellLeft : styles.tableCell,
              {
                flex: typeof columns[ci]?.width === 'number' ? (columns[ci].width as number) : undefined,
                width: typeof columns[ci]?.width === 'string' ? (columns[ci].width as string) : undefined,
              },
            ]}
          >
            {String(cell)}
          </Text>
        ))}
      </View>
    ))}
  </View>
);

// ============================================================
// Main Report Document
// ============================================================

export type UserTier = 'FREE' | 'PERSONAL' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface FederalReportProps {
  input: ReportInput;
  result: CalculationResult;
  tier?: UserTier;
}

const FederalRetirementReport: React.FC<FederalReportProps> = ({
  input,
  result,
}) => {
  const brand = input.advisorCompany || 'Capital Wealth';
  const advisorName = input.advisorName;
  const phone = input.advisorPhone;
  const email = input.advisorEmail;

  const dob = input.personal.dateOfBirth;
  const retDate = input.employment.plannedRetirementDate;
  const today = new Date().toISOString().slice(0, 10);

  const dobDate = parseISO(dob);
  const retDateParsed = parseISO(retDate);
  const birthYear = getYear(dobDate);
  const retYear = getYear(retDateParsed);
  const currentAge = new Date().getFullYear() - birthYear;
  const ageAtRetirement = retYear - birthYear -
    (retDateParsed.getMonth() < dobDate.getMonth() ||
      (retDateParsed.getMonth() === dobDate.getMonth() &&
        retDateParsed.getDate() < dobDate.getDate()) ? 1 : 0);

  // Salary, hourly
  const salaryNow = input.employment.currentAnnualSalary;
  const hourlyNow = salaryNow / 2087;
  const salaryRate = input.employment.annualSalaryIncreaseRate;
  const yearsToRet = retYear - new Date().getFullYear();
  const salaryAtRet = salaryNow * Math.pow(1 + salaryRate, yearsToRet);
  const hourlyAtRet = salaryAtRet / 2087;

  // Service breakdown — at retirement (used in the Retirement section)
  const civilianYears = input.employment.creditableServiceYears;
  const civilianMonths = input.employment.creditableServiceMonths;
  const sickLeaveYears = Math.floor(result.annuity.sickLeaveCredit);
  const sickLeaveMonthsExt = Math.round((result.annuity.sickLeaveCredit - sickLeaveYears) * 12);

  // Current service — as of today (used in the Employment section)
  const scdDate = parseISO(input.employment.serviceComputationDate);
  const monthsToToday = Math.max(
    0,
    (new Date().getFullYear() - scdDate.getFullYear()) * 12 +
      (new Date().getMonth() - scdDate.getMonth()),
  );
  const currentCivilianYears = Math.floor(monthsToToday / 12);
  const currentCivilianMonths = monthsToToday % 12;
  // Sick leave today: assume the sickLeaveHours field reflects today's accrual.
  const currentSickLeaveMonths = Math.floor(input.employment.sickLeaveHours / (2087 / 12));
  const currentSickLeaveYears = Math.floor(currentSickLeaveMonths / 12);
  const currentSickLeaveMonthsRem = currentSickLeaveMonths % 12;

  // Survivor numbers (cost / benefit) — pulled from result
  const annualNoSurv = result.annuity.annualAnnuity;
  const monthlyNoSurv = result.annuity.monthlyAnnuity;
  const survivorElection = result.survivorBenefit.election;
  const annualSurvivorCost = result.survivorBenefit.annualCost;
  const monthlySurvivorCost = result.survivorBenefit.monthlyCost;
  const survivorAnnualBenefit = result.survivorBenefit.survivorAnnualBenefit;
  const survivorMonthlyBenefit = result.survivorBenefit.survivorMonthlyBenefit;
  const annualWithSurv = annualNoSurv - annualSurvivorCost;
  const monthlyWithSurv = monthlyNoSurv - monthlySurvivorCost;

  const cola = input.colaAssumption ?? 0.02;
  const survivorPct =
    survivorElection === '50_PERCENT' ? 0.5 :
    survivorElection === '25_PERCENT' ? 0.25 : 0;

  // ---------- Page 5: Surviving Spouse 24-year table ----------
  const survivorTable: (string | number)[][] = [];
  let cumDiff = 0;
  for (let i = 0; i < 24; i++) {
    const age = ageAtRetirement + i;
    const year = retYear + i;
    const factor = Math.pow(1 + cola, i);
    const monthlyA = monthlyNoSurv * factor;
    const monthlyB = monthlyWithSurv * factor;
    const survMo = survivorMonthlyBenefit * factor;
    const monthlyDiff = monthlyA - monthlyB;
    const annualDiff = monthlyDiff * 12;
    cumDiff += annualDiff;
    survivorTable.push([
      i + 1,
      age,
      fmt.currency(monthlyA),
      fmt.currency(monthlyB),
      fmt.currency(survMo),
      fmt.currency(monthlyDiff),
      fmt.currency(annualDiff),
      fmt.currency(cumDiff),
    ]);
  }

  // ---------- Page 4: Proposed & Delayed Retirement table ----------
  // Columns = years from retirement (proposed) through delayed +11
  // Show retirement at planned age + 5 delayed years. Wider tables can't
  // fit a Letter page with the brand fonts and still keep labels on one line.
  const delayedAges: number[] = [];
  for (let i = 0; i <= 5; i++) delayedAges.push(ageAtRetirement + i);

  const high3 = result.annuity.high3Average;
  const fersIsEnhanced = (age: number, totalYrs: number) =>
    age >= 62 && totalYrs >= 20;
  const buildAnnuityRow = (delayYears: number) => {
    const age = ageAtRetirement + delayYears;
    const civYears = civilianYears + delayYears;
    const civMonths = civilianMonths;
    // Sick leave grows by ~104 hours/yr typical accrual; old report shows growth.
    // We approximate by adding 1 month per year delayed (rough but matches ballpark).
    const slY = sickLeaveYears + Math.floor((sickLeaveMonthsExt + delayYears) / 12);
    const slM = (sickLeaveMonthsExt + delayYears) % 12;
    const totalDecimal = civYears + civMonths / 12 + slY + slM / 12;
    const projHigh3 = high3 * Math.pow(1 + salaryRate, delayYears);
    const high3Change = delayYears === 0 ? 0 : projHigh3 - high3 * Math.pow(1 + salaryRate, delayYears - 1);
    const mult = fersIsEnhanced(age, totalDecimal) ? 0.011 : 0.01;
    const annNoSurv = mult * projHigh3 * totalDecimal;
    const moNoSurv = annNoSurv / 12;
    const annWith = annNoSurv * (1 - (survivorPct === 0.5 ? 0.10 : survivorPct === 0.25 ? 0.05 : 0));
    const moWith = annWith / 12;
    const annSurvBen = annNoSurv * survivorPct;
    const moSurvBen = annSurvBen / 12;
    const annCostSurv = annNoSurv - annWith;
    const moCostSurv = annCostSurv / 12;
    return {
      age, civYears, civMonths, slY, slM, projHigh3, high3Change,
      annNoSurv, moNoSurv, annWith, moWith, annSurvBen, moSurvBen, annCostSurv, moCostSurv,
    };
  };

  const delayedRows = delayedAges.map((_, i) => buildAnnuityRow(i));

  // ---------- Page 8: TSP Contributions yearly tables ----------
  const tspTrad = result.tsp.traditionalProjections.slice(0, 5);

  // ---------- Page 11: FEGLI 27-row table ----------
  const fegliRows: (string | number)[][] = [];
  let accumCost = 0;
  const fegliProjections = result.fegli.costProjections.slice(0, 27);
  let avgBiweekly = 0, avgMonthly = 0, avgCount = 0;
  for (const p of fegliProjections) {
    const annualPremium = p.totalCost;
    const biweekly = annualPremium / 26;
    const monthly = annualPremium / 12;
    accumCost += annualPremium;
    if (p.age <= ageAtRetirement) { avgBiweekly += biweekly; avgMonthly += monthly; avgCount++; }
    const yearSalaryHere = salaryNow * Math.pow(1 + salaryRate, p.year - new Date().getFullYear());
    fegliRows.push([
      `${p.age}/${p.age + 1}`,
      p.age <= ageAtRetirement ? fmt.currency(yearSalaryHere) : '$0.00',
      p.age <= ageAtRetirement ? fmt.currency(biweekly) : '$0.00',
      p.age <= ageAtRetirement ? fmt.currency(monthly) : '$0.00',
      p.age <= ageAtRetirement ? fmt.currency(annualPremium) : '$0.00',
      fmt.currency(accumCost),
      fmt.currency(p.basicCoverage),
      fmt.currency(p.optionACoverage),
      fmt.currency(p.optionBCoverage),
      fmt.currency(p.optionCCoverage),
      fmt.currency(p.basicCoverage + p.optionACoverage + p.optionBCoverage + p.optionCCoverage),
    ]);
  }
  const avgBi = avgCount > 0 ? avgBiweekly / avgCount : 0;
  const avgMo = avgCount > 0 ? avgMonthly / avgCount : 0;

  // ---------- Page 12: FEHB table ----------
  const fehbRows: (string | number)[][] = [];
  let accumFehb = 0;
  let prevAnnualFehb = 0;
  for (const p of result.fehb.projections.slice(0, 26)) {
    const monthly = p.annualPremium / 12;
    const biweekly = p.annualPremium / 26;
    accumFehb += p.annualPremium;
    const change = prevAnnualFehb === 0 ? 0 : p.annualPremium - prevAnnualFehb;
    prevAnnualFehb = p.annualPremium;
    fehbRows.push([
      `${p.age}/${p.age + 1}`,
      fmt.currency(biweekly),
      fmt.currency(monthly),
      fmt.currency(p.annualPremium),
      fmt.currency(accumFehb),
      fmt.currency(change),
    ]);
  }
  const fehbBiweekly = result.fehb.currentMonthlyPremium * 12 / 26;
  const fehbMonthly = result.fehb.currentMonthlyPremium;
  const fehbAnnual = result.fehb.currentMonthlyPremium * 12;
  const fehbIncreaseRate = input.fehb.premiumIncreaseRate;

  // ---------- Page 13: FERS Supplement + SS table ----------
  const fersAnnuityProjections = result.colaProjections.slice(0, 24);
  const ssProjections = result.socialSecurity.yearlyProjections;
  const ssMap = new Map(ssProjections.map(s => [s.year, s.annualBenefit]));
  const fersSuppMonthly = result.fersSupplement.monthlyAmount;
  const fersSuppEndAge = 62;

  const supplementSsRows: (string | number)[][] = [];
  let prevTotal = 0;
  for (let i = 0; i < 24; i++) {
    const year = retYear + i;
    const age = ageAtRetirement + i;
    const fersAnnuity = fersAnnuityProjections[i]?.annuityAfterCola ?? annualWithSurv * Math.pow(1 + cola, i);
    const fersAnnuityMo = Math.round(fersAnnuity / 12);
    const fersSupp = age < fersSuppEndAge ? fersSuppMonthly : 0;
    const ssAnnual = ssMap.get(year) ?? 0;
    const ssMonthly = Math.round(ssAnnual / 12);
    const total = fersAnnuityMo + fersSupp + ssMonthly;
    const change = prevTotal === 0 ? 0 : total - prevTotal;
    prevTotal = total;
    supplementSsRows.push([
      age,
      fmt.currencyWhole(fersAnnuityMo),
      fmt.currencyWhole(fersSupp),
      fmt.currencyWhole(ssMonthly),
      fmt.currencyWhole(total),
      fmt.currencyWhole(change),
    ]);
  }

  return (
    <Document
      title={`Federal Employee Benefits Analysis — ${input.personal.fullName}`}
      author={brand}
    >
      {/* ============================================================
          PAGE 1 — COVER
          (3-Kings: Voss empathy + Miller hero — the federal employee
          is the hero; this report is the plan that takes them home.)
          ============================================================ */}
      <Page size="LETTER" style={styles.coverPage}>
        <Text style={styles.coverEyebrow}>STRATEGIC INCOME &amp; TAX PLANNING</Text>

        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Image src={CW_LOGO_URL} style={{ width: 220, height: 73, opacity: 0.95 }} />
        </View>

        <View style={styles.coverDivider} />

        <Text style={styles.coverTitle}>
          Federal Employee{'\n'}Benefits Analysis
        </Text>

        <Text style={[styles.coverSubtitle, { marginTop: 14 }]}>
          YOUR RETIREMENT, DECODED
        </Text>

        <Text style={styles.coverClient}>
          Prepared for {input.personal.fullName}
        </Text>
        <Text style={styles.coverDate}>{fmt.dateLong(today)}</Text>
        <Text style={[styles.coverDate, { color: colors.gold, marginTop: 2 }]}>
          Planned Retirement: {fmt.dateLong(retDate)}
        </Text>

        <View style={{ position: 'absolute', bottom: 70, left: 60, right: 60, alignItems: 'center' }}>
          <View style={{ width: 60, height: 1, backgroundColor: colors.gold, marginBottom: 14 }} />
          <Text style={styles.coverAdvisor}>{brand}</Text>
          {advisorName && advisorName !== brand && (
            <Text style={styles.coverAdvisor}>{advisorName}, Founder</Text>
          )}
          <Text style={styles.coverAdvisor}>1850 W. Ashton Blvd, Suite 175 · Lehi, UT 84043</Text>
          {phone && <Text style={styles.coverAdvisor}>{phone} · {email || 'capitalwealth.com'}</Text>}
        </View>

        <View style={{ position: 'absolute', bottom: 28, left: 60, right: 60 }}>
          <Text style={styles.coverDisclaimer}>
            Confidential. Prepared for the named recipient. Figures shown are hypothetical
            illustrations based on information you provided.
          </Text>
        </View>
      </Page>

      {/* ============================================================
          PAGE 2 — ABOUT THIS PLAN + LEGAL DISCLAIMER
          (StoryBrand: brief warm framing — what's in here for you —
          followed by the legal disclaimer required by federal regs.)
          ============================================================ */}
      <ReportPage brand={brand} phone={phone}>
        <Text style={styles.sectionEyebrow}>ABOUT THIS PLAN</Text>
        <Text style={styles.sectionTitle}>What you'll find inside.</Text>
        <View style={styles.goldDivider} />

        <Text style={styles.text}>
          You've spent your career serving the federal government. The benefits
          you've earned — your annuity, TSP, FEGLI, FEHB, Social Security — work
          together. This analysis lays them out in one place, in plain English,
          so you can see exactly where you stand and what to do next.
        </Text>

        <View style={styles.promise}>
          <Text style={styles.promiseText}>
            "Our job is to take the complexity off your plate so you can retire
            with confidence — knowing the math, the income, and the tax picture
            are working in your favor."
          </Text>
        </View>

        <Text style={[styles.groupLabel, { marginTop: 18 }]}>Disclaimer</Text>
        <Text style={[styles.textSmall, { textAlign: 'justify' }]}>
          This report illustrates estimates of cost and benefits for CSRS or FERS,
          FEGLI, FEHB, Long Term Care Insurance, Social Security System benefits,
          and the Thrift Savings Plan (TSP). Estimates are based on assumptions
          which may affect the results and differ from actual experience. Future
          costs and benefits cannot be estimated with absolute certainty — do not
          base financial decisions solely on this report. Consult your personnel
          office or the Office of Personnel Management (OPM) Retirement Information
          Office at 1-888-767-6738. The analysis is provided 'AS IS' without
          warranties of any kind. {brand} and its agents are not liable for any
          direct, indirect, consequential, or incidental damages arising from the
          use of (or inability to use) this analysis.
        </Text>
        <Text style={[styles.textSmall, { marginTop: 10, textAlign: 'justify' }]}>
          {brand}, LLC and CWA Insurance Services, LLC are not affiliated with or
          endorsed by the U.S. Government, Social Security Administration, Office
          of Personnel Management, or any federal agency. This report is provided
          for educational purposes by {brand}, a registered investment advisor.
        </Text>
      </ReportPage>

      {/* ============================================================
          PAGE 3 — FEDERAL EMPLOYEE BENEFITS SUMMARY
          ============================================================ */}
      <ReportPage brand={brand} phone={phone}>
        <Text style={styles.sectionEyebrow}>YOUR PLAN AT A GLANCE</Text>
        <Text style={styles.sectionTitle}>Federal Employee Benefits Summary</Text>
        <View style={styles.goldDivider} />

        {/* HERO — the headline annuity (Belfort straight line: lead with the answer) */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>YOUR MONTHLY ANNUITY AT RETIREMENT</Text>
          <Text style={styles.heroValue}>{fmt.currencyWhole(monthlyNoSurv)}/mo</Text>
          <Text style={styles.heroCaption}>
            That's {fmt.currencyWhole(annualNoSurv)} per year — guaranteed by the federal government,
            with a {fmt.pctWhole(cola)} annual COLA. Begins {fmt.dateLong(retDate)}.
          </Text>
        </View>

        {/* 3 supporting metrics */}
        <View style={styles.metricRow}>
          <View style={styles.metricTile}>
            <Text style={styles.metricLabel}>HIGH-3 SALARY</Text>
            <Text style={styles.metricValue}>{fmt.currencyWhole(high3)}</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricLabel}>SERVICE AT RETIREMENT</Text>
            <Text style={styles.metricValue}>{civilianYears}y {civilianMonths}m</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricLabel}>RETIREMENT AGE</Text>
            <Text style={styles.metricValue}>{ageAtRetirement}</Text>
          </View>
        </View>

        {/* Survivor scenario */}
        <Text style={styles.groupLabel}>SURVIVOR ELECTION — {survivorElection === '50_PERCENT' ? '50%' : survivorElection === '25_PERCENT' ? '25%' : 'NONE'}</Text>
        <SRow label="Your Annuity (no survivor benefit)" value={`${fmt.currencyWhole(monthlyNoSurv)}/mo`} />
        <SRow label="Your Annuity (with survivor benefit)" value={`${fmt.currencyWhole(monthlyWithSurv)}/mo`} />
        <SRow label="Spouse's Survivor Benefit" value={`${fmt.currencyWhole(survivorMonthlyBenefit)}/mo`} />
        <SRow label="Cost of Survivor Election" value={`${fmt.currencyWhole(monthlySurvivorCost)}/mo`} />

        {/* Personal + Employment + Retirement details — two columns for density.
            wrap={false} keeps the entire block on one page; if it doesn't fit
            after the hero/tiles/survivor, it cleanly flows to page 4 rather
            than splitting mid-column. */}
        <View wrap={false} style={{ flexDirection: 'row', gap: 18, marginTop: 6 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.groupLabel}>PERSONAL</Text>
            <SRow label="Name" value={input.personal.fullName} />
            {input.personal.address ? (
              <SRow label="Address" value={input.personal.address} />
            ) : null}
            <SRow label="Date of Birth" value={fmt.date(dob)} />
            <SRow label="Current Age" value={String(currentAge)} />

            <Text style={styles.groupLabel}>EMPLOYMENT TODAY</Text>
            <SRow label="Service Computation Date" value={fmt.date(input.employment.serviceComputationDate)} />
            <SRow label="Annual Salary" value={fmt.currency(salaryNow)} />
            <SRow label="Hourly" value={fmt.currency(hourlyNow)} />
            <SRow label="Annual Increase" value={`${fmt.pct(salaryRate)} est.`} />
            <SRow label="Creditable Service" value={`${currentCivilianYears}y ${currentCivilianMonths}m`} />
            <SRow label="Sick Leave" value={`${currentSickLeaveYears > 0 ? `${currentSickLeaveYears}y ` : ''}${currentSickLeaveMonthsRem}m`} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.groupLabel}>AT RETIREMENT</Text>
            <SRow label="System" value={input.employment.retirementSystem} />
            <SRow label="Employee Type" value={input.employment.employeeType} />
            <SRow label="Retirement Date" value={fmt.date(retDate)} />
            <SRow label="Projected Salary" value={fmt.currencyWhole(salaryAtRet)} />
            <SRow label="High-3 Average" value={fmt.currencyWhole(high3)} />
            <SRow label="Annual COLA" value={fmt.pctWhole(cola)} />
            <SRow label="Creditable Service" value={`${civilianYears}y ${civilianMonths}m`} />
            <SRow label="Sick Leave Credit" value={`${sickLeaveYears > 0 ? `${sickLeaveYears}y ` : ''}${sickLeaveMonthsExt}m`} />
            <SRow label="Age at Retirement" value={String(ageAtRetirement)} />
            <SRow label="Eligibility" value="Service & Age met" />
          </View>
        </View>
      </ReportPage>

      {/* ============================================================
          PAGE 4 — PROPOSED & DELAYED RETIREMENT
          ============================================================ */}
      <ReportPage brand={brand} phone={phone}>
        <View style={{ paddingHorizontal: 30 }}>
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 4 }]}>
            Proposed &amp; Delayed Retirement
          </Text>
          <View style={[styles.goldDivider, { alignSelf: 'center' }]} />

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline' }}>Retirement Characterization</Text>
          <SRow label="Retirement System" value={input.employment.retirementSystem} />
          <SRow label="Employee Type" value={input.employment.employeeType} />
          <SRow label="Retirement Type" value="REGULAR" />

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline', marginTop: 8 }}>Input Data</Text>
          <SRow label="Estimated High 3 Average At Retirement" value={fmt.currency(high3)} />
          <SRow label="Estimated High 3 Increase / Year" value={fmt.pctWhole(salaryRate)} />
          <SRow label="Length of Service at Retirement" value={String(civilianYears)} />
          <SRow label="Months of Service at Retirement" value={String(civilianMonths)} />
          <SRow label="Age at Retirement" value={String(ageAtRetirement)} />
          <SRow label="Total Hours of Unused Sick Leave" value={String(input.employment.sickLeaveHours)} />
          <SRow label="COLA (in Retirement)" value={fmt.pctWhole(cola)} />
          <SRow label={`${input.employment.retirementSystem} Survivor`}
                value={survivorElection === '50_PERCENT' ? '50% Annuity' : survivorElection === '25_PERCENT' ? '25% Annuity' : 'None'} />

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline', marginTop: 10 }}>
            Proposed and Delayed Retirement Data
          </Text>

          {/* Row-major proposed/delayed table — labels left, values across.
              Cells are uniform height so labels stay aligned with their row. */}
          {(() => {
            const rowDef: { label: string; get: (r: typeof delayedRows[number]) => string }[] = [
              { label: 'Age', get: (r) => String(r.age) },
              { label: 'Service Years', get: (r) => String(r.civYears) },
              { label: 'Service Months', get: (r) => String(r.civMonths) },
              { label: 'Sick Leave Months', get: (r) => String(r.slM) },
              { label: 'High-3 Average', get: (r) => '$' + Math.round(r.projHigh3).toLocaleString() },
              { label: 'Change in High-3', get: (r) => r.high3Change ? '$' + Math.round(r.high3Change).toLocaleString() : '—' },
              { label: 'Annual Annuity (no survivor)', get: (r) => '$' + Math.round(r.annNoSurv).toLocaleString() },
              { label: 'Monthly Annuity (no survivor)', get: (r) => '$' + Math.round(r.moNoSurv).toLocaleString() },
              { label: 'Annual Annuity (with survivor)', get: (r) => '$' + Math.round(r.annWith).toLocaleString() },
              { label: 'Monthly Annuity (with survivor)', get: (r) => '$' + Math.round(r.moWith).toLocaleString() },
              { label: 'Annual Survivor Benefit', get: (r) => '$' + Math.round(r.annSurvBen).toLocaleString() },
              { label: 'Monthly Survivor Benefit', get: (r) => '$' + Math.round(r.moSurvBen).toLocaleString() },
              { label: 'Monthly Cost of Survivor', get: (r) => '$' + Math.round(r.moCostSurv).toLocaleString() },
            ];
            return (
              <View wrap={false} style={{ marginTop: 6 }}>
                {/* Header row */}
                <View style={{ flexDirection: 'row', backgroundColor: colors.navy, paddingVertical: 6 }}>
                  <Text style={{ flex: 3.4, paddingHorizontal: 6, fontSize: 8.5, color: colors.white, fontWeight: 700 }}>
                    Scenario
                  </Text>
                  {delayedRows.map((r, i) => (
                    <Text key={i} style={{ flex: 1, fontSize: 8.5, color: colors.white, fontWeight: 700, textAlign: 'center' }}>
                      {i === 0 ? `Retire @ ${r.age}` : `+${i}y`}
                    </Text>
                  ))}
                </View>
                {rowDef.map((row, ri) => (
                  <View key={ri}
                    style={{
                      flexDirection: 'row',
                      paddingVertical: 4,
                      backgroundColor: ri % 2 === 1 ? colors.offWhite : colors.white,
                      borderBottomWidth: 0.5,
                      borderBottomColor: '#eef0f3',
                    }}>
                    <Text style={{ flex: 3.4, paddingHorizontal: 6, fontSize: 8.5, color: colors.grayDark }}>
                      {row.label}
                    </Text>
                    {delayedRows.map((r, ci) => (
                      <Text key={ci} style={{ flex: 1, fontSize: 8.5, color: ci === 0 ? colors.navy : colors.grayDark, fontWeight: ci === 0 ? 700 : 400, textAlign: 'right', paddingHorizontal: 4 }}>
                        {row.get(r)}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            );
          })()}
          <Text style={{ fontSize: 9, marginTop: 8, color: colors.gray, fontStyle: 'normal' }}>
            First column = your planned retirement at age {ageAtRetirement}. Subsequent columns show what happens if you delay each additional year.
          </Text>
        </View>
      </ReportPage>

      {/* ============================================================
          PAGE 5 — RETIREMENT ANNUITY & SURVIVING SPOUSE BENEFIT
          ============================================================ */}
      <ReportPage brand={brand} phone={phone}>
        <View style={{ paddingHorizontal: 50 }}>
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 4 }]}>
            Retirement Annuity and Surviving Spouse Benefit
          </Text>
          <View style={[styles.goldDivider, { alignSelf: 'center' }]} />
          <Text style={{ fontSize: 9, marginBottom: 6 }}>
            <Text style={{ textDecoration: 'underline' }}>Benefits Data</Text>
          </Text>
          <Text style={{ fontSize: 9, marginBottom: 10 }}>
            Calculations based on a COLA (In Retirement) of {fmt.pctWhole(cola)} and a {survivorElection === '50_PERCENT' ? '50%' : survivorElection === '25_PERCENT' ? '25%' : '0%'} Survivor Annuity.
          </Text>
          <DataTable
            columns={[
              { header: 'Year', width: '7%' },
              { header: 'Age', width: '7%' },
              { header: 'Monthly Annuity No Survivor [A]', width: '15%' },
              { header: 'Monthly Annuity With Survivor [B]', width: '15%' },
              { header: "Survivor's Monthly Annuity", width: '14%' },
              { header: 'Monthly Difference [A] - [B] *', width: '14%' },
              { header: 'Annual Difference [A] - [B]', width: '14%' },
              { header: 'Accumulated Annual Difference [A] - [B]', width: '14%' },
            ]}
            rows={survivorTable}
          />
          <Text style={{ fontSize: 8, marginTop: 8, color: '#444' }}>
            * Monthly Annuity No Survivor Minus Monthly Annuity With Survivor
          </Text>
        </View>
      </ReportPage>

      {/* ============================================================
          PAGE 6 — TSP DISCLAIMER
          ============================================================ */}
      <ReportPage brand={brand} phone={phone}>
        <View style={{ paddingHorizontal: 40 }}>
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 16, marginBottom: 14 }]}>
            TSP Disclaimer
          </Text>
          <Text style={{ fontSize: 10.5, lineHeight: 1.55, marginBottom: 10, textAlign: 'justify' }}>
            <Text style={{ textDecoration: 'underline' }}>This calculator is provided for informational purposes only</Text>. It is not intended to provide retirement income advice, be used as an investment advisory tool, as a guarantee of monthly payment amounts, as a guarantee of a final account balance or as a guarantee of the duration of the elected monthly payment amount. The monthly income illustrated is based on a gross distribution without consideration for income tax.
          </Text>
          <Text style={{ fontSize: 10.5, lineHeight: 1.55, marginBottom: 10, textAlign: 'justify' }}>
            <Text style={{ textDecoration: 'underline' }}>This report illustrates hypothetical balances at retirement</Text> for the Civil Service Retirement System (CSRS) or the Federal Employees Retirement System (FERS) Thrift Savings Plan (TSP). Estimates are based on assumptions, which may affect the results and may differ from actual experience. Since future rates of return and performance cannot be estimated with absolute certainty, you should not base your financial decisions solely on the estimates of this report and it is recommended that you consult with your personnel office, the Office of Personnel Management (OPM) or Retirement Information Office 1888-767-6738. {brand} cannot provide retirement analysis and decision information to you. No oral or written information or advice provided by {brand} and its agents or employees shall create a warranty of any kind regarding this analysis and you may not rely upon such information or advice. The analysis is provided 'AS IS' without warranties or representations of any kind and disclaim all express, implied and statutory warranties of any kind to the user and any third party, (including, but not limited to, the implied warranties of accuracy, timeliness, completeness, merchantability, noninfringement and fitness for a particular purpose).
          </Text>
          <Text style={{ fontSize: 10.5, lineHeight: 1.55, marginBottom: 10, textAlign: 'justify' }}>
            Neither {brand} nor anyone else who has been involved in the creation, production or delivery of this analysis shall be liable for any direct, indirect, consequential, or incidental damages (including, but not limited to, damages for lost profits or lost opportunity, loss of business or personal profits, business or personal interruption, loss of business or personal information, special, or punitive damages whatsoever) arising from the use of (or inability to use) this analysis.
          </Text>
          <Text style={{ fontSize: 10.5, lineHeight: 1.55, textDecoration: 'underline', textAlign: 'justify' }}>
            All figures shown are hypothetical and based on information provided by you. Any change to your benefit elections, salary or other information provided by you could alter these figures.
          </Text>
        </View>
      </ReportPage>

      {/* ============================================================
          PAGE 7 — TSP TRADITIONAL NARRATIVE
          ============================================================ */}
      <ReportPage brand={brand} phone={phone}>
        <View style={{ paddingHorizontal: 40 }}>
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 4 }]}>
            Thrift Savings Plan
          </Text>
          <View style={[styles.goldDivider, { alignSelf: 'center' }]} />

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline' }}>Existing Traditional Savings</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.55, marginTop: 4, marginBottom: 10 }}>
            There are six separate funds (G, F, C, S, I, and L) in which to accumulate savings. At this time you have accumulated{' '}
            {input.tsp.traditionalBalances.map((b) =>
              `${fmt.currency(b.balance)} in the ${b.fund} Fund`
            ).join(', ')} for a total of {fmt.currency(input.tsp.traditionalBalances.reduce((a, b) => a + b.balance, 0))}.
          </Text>

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline' }}>Hypothetical Annual Return Rates</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.55, marginTop: 4, marginBottom: 10 }}>
            The following rates were selected by you for calculating future earnings:{' '}
            {input.tsp.traditionalBalances
              .filter(b => b.fund !== 'L')
              .map((b) => `${b.fund} Fund ${fmt.pct(b.returnRate)}`).join(', ')}.
          </Text>

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline' }}>Traditional Contributions</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>
            You are currently contributing a regular amount of {fmt.currency(input.tsp.annualContributionTraditional)} from your salary and an additional {fmt.currency(input.tsp.catchUpContribution)} catch-up contribution for a combined Annual Contribution of {fmt.currency(input.tsp.annualContributionTraditional + input.tsp.catchUpContribution)}.
          </Text>
          <Text style={{ fontSize: 11, marginTop: 6, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', color: colors.gray }}>
            In January of each year, you anticipate a {fmt.pct(salaryRate)} increase in salary that will raise your annual TSP contribution.
          </Text>

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline', marginTop: 14 }}>Hypothetical Balance at Withdrawal</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>
            You elected to start withdrawing funds at the age of {input.tsp.plannedWithdrawalAge} years and 0 months. The estimated savings at that age is {fmt.currency(result.tsp.totalAtRetirement)}.
          </Text>

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline', marginTop: 14 }}>Withdrawal Option Selected</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>
            {input.tsp.withdrawalMethod === 'MONTHLY_PAYMENTS' ? 'Monthly Payments' : input.tsp.withdrawalMethod}
          </Text>
        </View>
      </ReportPage>

      {/* ============================================================
          PAGE 8 — TSP CONTRIBUTIONS AND HYPOTHETICAL SAVINGS
          ============================================================ */}
      <ReportPage brand={brand} phone={phone}>
        <View style={{ paddingHorizontal: 30 }}>
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 4, fontSize: 22 }]}>
            Thrift Savings Plan - Contributions and Hypothetical Savings
          </Text>
          <View style={[styles.goldDivider, { alignSelf: 'center' }]} />

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline', marginBottom: 6 }}>
            Summary of Annual Contributions and Savings: {tspTrad[0]?.year} to {tspTrad[tspTrad.length - 1]?.year}
          </Text>

          <DataTable
            columns={[
              { header: 'End Of Year', width: '11%' },
              { header: 'Age', width: '7%' },
              { header: 'Salary', width: '12%' },
              { header: 'Your Contrib', width: '12%' },
              { header: 'Gov Contrib', width: '12%' },
              { header: 'Total Contrib', width: '12%' },
              { header: 'Total Estimated Savings', width: '17%' },
            ]}
            rows={tspTrad.map((t) => {
              const yearSalary = salaryNow * Math.pow(1 + salaryRate, t.year - new Date().getFullYear());
              return [
                `12-${String(t.year).slice(2)}`,
                t.age,
                fmt.currencyWhole(yearSalary),
                fmt.currencyWhole(t.contributions),
                fmt.currencyWhole(t.governmentMatch),
                fmt.currencyWhole(t.contributions + t.governmentMatch),
                fmt.currencyWhole(t.endBalance),
              ];
            })}
          />
        </View>
      </ReportPage>

      {/* ============================================================
          PAGE 9 — TSP ROTH NARRATIVE
          ============================================================ */}
      <ReportPage brand={brand} phone={phone}>
        <View style={{ paddingHorizontal: 40 }}>
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 4 }]}>
            Thrift Savings Plan
          </Text>
          <View style={[styles.goldDivider, { alignSelf: 'center' }]} />
          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline' }}>Existing Roth Savings</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.55, marginTop: 4, marginBottom: 10 }}>
            There are six separate funds (G, F, C, S, I, and L) in which to accumulate savings. At this time you have accumulated{' '}
            {input.tsp.rothBalances.map((b) =>
              `${fmt.currency(b.balance)} in the ${b.fund} Fund`
            ).join(', ')} for a total of {fmt.currency(input.tsp.rothBalances.reduce((a, b) => a + b.balance, 0))}.
          </Text>

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline' }}>Hypothetical Annual Return Rates</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.55, marginTop: 4, marginBottom: 10 }}>
            The following rates were selected by you for calculating future earnings:{' '}
            {input.tsp.rothBalances
              .filter(b => b.fund !== 'L')
              .map((b) => `${b.fund} Fund ${fmt.pct(b.returnRate)}`).join(', ')}.
          </Text>

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline' }}>Roth Contributions</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>
            You are currently contributing a regular amount of {fmt.currency(input.tsp.annualContributionRoth)} from your salary and an additional {fmt.currency(0)} catch-up contribution for a combined Annual Contribution of {fmt.currency(input.tsp.annualContributionRoth)}.
          </Text>
          <Text style={{ fontSize: 11, marginTop: 6, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', color: colors.gray }}>
            In January of each year, you anticipate a {fmt.pct(salaryRate)} increase in salary that will raise your annual TSP contribution.
          </Text>

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline', marginTop: 14 }}>Hypothetical Balance at Withdrawal</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>
            You elected to start withdrawing funds at the age of {input.tsp.plannedWithdrawalAge} years and 0 months. The estimated savings at that age is {fmt.currency(result.tsp.rothAtRetirement)}.
          </Text>

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline', marginTop: 14 }}>Withdrawal Option Selected</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>
            {input.tsp.withdrawalMethod === 'MONTHLY_PAYMENTS' ? 'Monthly Payments' : input.tsp.withdrawalMethod}
          </Text>
        </View>
      </ReportPage>

      {/* ============================================================
          PAGE 10 — ROTH CONTRIBUTIONS YEARLY TABLE
          ============================================================ */}
      <ReportPage brand={brand} phone={phone}>
        <View style={{ paddingHorizontal: 30 }}>
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 4, fontSize: 22 }]}>
            Thrift Savings Plan - ROTH Contributions and Hypothetical Savings
          </Text>
          <View style={[styles.goldDivider, { alignSelf: 'center' }]} />

          {input.tsp.annualContributionRoth > 0 || input.tsp.rothBalances.some(b => b.balance > 0) ? (
            <DataTable
              columns={[
                { header: 'End Of Year', width: '11%' },
                { header: 'Age', width: '7%' },
                { header: 'Salary', width: '12%' },
                { header: 'Your Contrib', width: '12%' },
                { header: 'Total Contrib', width: '12%' },
                { header: 'Total Estimated Savings', width: '20%' },
              ]}
              rows={result.tsp.rothProjections.slice(0, 5).map((t) => {
                const yearSalary = salaryNow * Math.pow(1 + salaryRate, t.year - new Date().getFullYear());
                return [
                  `12-${String(t.year).slice(2)}`,
                  t.age,
                  fmt.currencyWhole(yearSalary),
                  fmt.currencyWhole(t.contributions),
                  fmt.currencyWhole(t.contributions),
                  fmt.currencyWhole(t.endBalance),
                ];
              })}
            />
          ) : (
            <Text style={{ fontSize: 11, marginTop: 30, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', color: colors.gray }}>
              No Roth TSP balance or contributions on record.
            </Text>
          )}
        </View>
      </ReportPage>

      {/* ============================================================
          PAGE 11 — FEGLI
          ============================================================ */}
      <ReportPage brand={brand} phone={phone}>
        <View style={{ paddingHorizontal: 25 }}>
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 4 }]}>
            Federal Employees Group Life Insurance
          </Text>
          <View style={[styles.goldDivider, { alignSelf: 'center' }]} />

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline' }}>Summary as of {format(new Date(), 'MMM-dd-yyyy')}</Text>
          <Text style={{ fontSize: 10.5, lineHeight: 1.55, marginTop: 4, marginBottom: 10 }}>
            At your current age of {currentAge}, your annual salary is {fmt.currency(salaryNow)}, and you expect annual salary increases of {fmt.pct(salaryRate)}. Your life insurance coverage includes:
            {input.fegli.basicCoverage ? ' Basic (equal to your rounded annual salary plus $2000).' : ''}
            {input.fegli.optionA ? ' Option A.' : ''}
            {input.fegli.optionB ? ` Option B (${input.fegli.optionBMultiple}×).` : ''}
            {input.fegli.optionC ? ` Option C (${input.fegli.optionCMultiple}×).` : ''}
            {' '}You plan to retire on {fmt.date(retDate)} at the age of {ageAtRetirement}.
          </Text>

          <Text style={{ fontSize: 11, fontWeight: 'bold', textDecoration: 'underline', marginBottom: 4 }}>FEGLI Premiums and Coverage</Text>

          <DataTable
            columns={[
              { header: 'Age', width: '6%' },
              { header: 'Annual Salary', width: '11%' },
              { header: 'Biweekly Premium', width: '10%' },
              { header: 'Monthly Premium', width: '10%' },
              { header: 'Annual Premium', width: '10%' },
              { header: 'Accumulated Cost', width: '10%' },
              { header: 'Basic', width: '10%' },
              { header: 'Option A', width: '8%' },
              { header: 'Option B', width: '8%' },
              { header: 'Option C', width: '8%' },
              { header: 'Total Coverage', width: '11%' },
            ]}
            rows={fegliRows}
          />

          <View style={{ marginTop: 8, padding: 4, borderWidth: 0.5, borderColor: '#000' }}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ flex: 2, fontSize: 10, fontWeight: 700 }}>Average Premium from Age {currentAge} to Age {ageAtRetirement}</Text>
              <Text style={{ flex: 1, fontSize: 10, fontWeight: 700 }}>Basic</Text>
              <Text style={{ flex: 1, fontSize: 10, fontWeight: 700 }}>Option A</Text>
              <Text style={{ flex: 1, fontSize: 10, fontWeight: 700 }}>Option B</Text>
              <Text style={{ flex: 1, fontSize: 10, fontWeight: 700 }}>Option C</Text>
              <Text style={{ flex: 1, fontSize: 10, fontWeight: 700 }}>Total Premium</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ flex: 2, fontSize: 10 }}>Biweekly</Text>
              <Text style={{ flex: 1, fontSize: 10 }}>{fmt.currency(avgBi)}</Text>
              <Text style={{ flex: 1, fontSize: 10 }}>$0.00</Text>
              <Text style={{ flex: 1, fontSize: 10 }}>$0.00</Text>
              <Text style={{ flex: 1, fontSize: 10 }}>$0.00</Text>
              <Text style={{ flex: 1, fontSize: 10 }}>{fmt.currency(avgBi)}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ flex: 2, fontSize: 10 }}>Monthly</Text>
              <Text style={{ flex: 1, fontSize: 10 }}>{fmt.currency(avgMo)}</Text>
              <Text style={{ flex: 1, fontSize: 10 }}>$0.00</Text>
              <Text style={{ flex: 1, fontSize: 10 }}>$0.00</Text>
              <Text style={{ flex: 1, fontSize: 10 }}>$0.00</Text>
              <Text style={{ flex: 1, fontSize: 10 }}>{fmt.currency(avgMo)}</Text>
            </View>
          </View>
        </View>
      </ReportPage>

      {/* ============================================================
          PAGE 12 — FEHB
          ============================================================ */}
      <ReportPage brand={brand} phone={phone}>
        <View style={{ paddingHorizontal: 40 }}>
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 4 }]}>
            Federal Employees Health Benefit Program
          </Text>
          <View style={[styles.goldDivider, { alignSelf: 'center' }]} />

          <Text style={{ fontSize: 10, marginTop: 4 }}>Calculations based on current Health Insurance premium of:</Text>
          <Text style={{ fontSize: 10, marginLeft: 8 }}>Biweekly = {fmt.currency(fehbBiweekly)}</Text>
          <Text style={{ fontSize: 10, marginLeft: 8 }}>Monthly = {fmt.currency(fehbMonthly)}</Text>
          <Text style={{ fontSize: 10, marginLeft: 8 }}>Annual = {fmt.currency(fehbAnnual)}</Text>
          <Text style={{ fontSize: 10, marginTop: 4, marginBottom: 12 }}>
            The current premium is estimated to increase annually by {fmt.pct(fehbIncreaseRate)} (compounded)
          </Text>

          <DataTable
            columns={[
              { header: 'Age', width: '11%' },
              { header: 'Biweekly Health Benefit Cost', width: '15%' },
              { header: 'Monthly Health Benefit Cost', width: '15%' },
              { header: 'Annual Health Benefit Cost', width: '15%' },
              { header: 'Accumulated Cost', width: '15%' },
              { header: 'Change From Previous Year', width: '15%' },
            ]}
            rows={fehbRows}
          />
        </View>
      </ReportPage>

      {/* ============================================================
          PAGE 13 — FERS SUPPLEMENT + SS
          ============================================================ */}
      <ReportPage brand={brand} phone={phone}>
        <View style={{ paddingHorizontal: 50 }}>
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 4 }]}>
            FERS Supplement and Estimated Social Security Benefits
          </Text>
          <View style={[styles.goldDivider, { alignSelf: 'center' }]} />
          <Text style={{ fontSize: 9, marginBottom: 6, textDecoration: 'underline' }}>Benefits Data</Text>
          <Text style={{ fontSize: 9, marginBottom: 12 }}>
            Calculations based on a FERS Annuity COLA of {fmt.pctWhole(cola)} and a Social Security COLA of {fmt.pctWhole(cola)}.
          </Text>

          <DataTable
            columns={[
              { header: 'Age', width: '14%' },
              { header: 'FERS Annuity', width: '16%' },
              { header: 'FERS Supplement', width: '17%' },
              { header: 'Estimated Social Security', width: '20%' },
              { header: 'TOTAL', width: '17%' },
              { header: 'Change', width: '16%' },
            ]}
            rows={supplementSsRows}
          />
        </View>
      </ReportPage>
    </Document>
  );
};

export default FederalRetirementReport;
