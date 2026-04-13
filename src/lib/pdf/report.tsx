// ============================================================
// Federal Retirement Report — PDF Document (react-pdf/renderer)
// ============================================================

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
} from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';
import styles, { colors } from './styles';
import type {
  ReportInput,
  CalculationResult,
  YearlyProjection,
  TspProjectionYear,
  FegliCostYear,
  FehbProjectionYear,
  High3Detail,
  EligibilityDate,
  ColaProjection,
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
  pct: (v: number | undefined | null): string => {
    if (v == null || isNaN(v)) return '0.00%';
    return `${(v * 100).toFixed(2)}%`;
  },
  pctWhole: (v: number | undefined | null): string => {
    if (v == null || isNaN(v)) return '0%';
    return `${(v * 100).toFixed(0)}%`;
  },
  date: (iso: string | undefined | null): string => {
    if (!iso) return 'N/A';
    try {
      return format(parseISO(iso), 'MM/dd/yyyy');
    } catch {
      return iso;
    }
  },
  dateLong: (iso: string | undefined | null): string => {
    if (!iso) return 'N/A';
    try {
      return format(parseISO(iso), 'MMMM d, yyyy');
    } catch {
      return iso;
    }
  },
  num: (v: number | undefined | null, decimals = 2): string => {
    if (v == null || isNaN(v)) return '0';
    return v.toFixed(decimals);
  },
  yrsmos: (y: number, m: number): string => `${y} yrs, ${m} mos`,
};

// ============================================================
// Reusable Sub-Components
// ============================================================

interface ReportPageProps {
  sectionTitle: string;
  children: React.ReactNode;
}

interface ReportPageInternalProps extends ReportPageProps {
  showWatermark?: boolean;
}

/** Standard report page with header + footer */
const ReportPageInternal: React.FC<ReportPageInternalProps> = ({ sectionTitle, children, showWatermark }) => (
  <Page size="LETTER" style={styles.page}>
    {showWatermark && <Watermark />}
    {/* Header */}
    <View style={styles.header} fixed>
      <Text style={styles.headerBrand}>CapitalWealth.com</Text>
      <Text style={styles.headerSection}>{sectionTitle}</Text>
    </View>
    {/* Body */}
    {children}
    {/* Footer */}
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        Confidential — Prepared by CapitalWealth.com
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  </Page>
);

// Default export used below — will be replaced by the component that injects watermark
const ReportPage: React.FC<ReportPageProps> = (props) => (
  <ReportPageInternal {...props} />
);

/** Summary row (label: value) */
const SRow: React.FC<{ label: string; value: string; bold?: boolean }> = ({
  label,
  value,
  bold,
}) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, bold ? styles.bold : {}]}>{value}</Text>
  </View>
);

/** Generic table */
interface TableColumn {
  header: string;
  width: string | number; // flex or fixed
  align?: 'left' | 'right';
}

interface TableProps {
  columns: TableColumn[];
  rows: string[][];
}

const DataTable: React.FC<TableProps> = ({ columns, rows }) => (
  <View style={styles.table}>
    {/* Header */}
    <View style={styles.tableHeader}>
      {columns.map((col, ci) => (
        <Text
          key={ci}
          style={[
            col.align === 'left'
              ? styles.tableHeaderCellLeft
              : styles.tableHeaderCell,
            { flex: typeof col.width === 'number' ? col.width : undefined, width: typeof col.width === 'string' ? col.width : undefined },
          ]}
        >
          {col.header}
        </Text>
      ))}
    </View>
    {/* Rows */}
    {rows.map((row, ri) => (
      <View key={ri} style={ri % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
        {row.map((cell, ci) => (
          <Text
            key={ci}
            style={[
              columns[ci]?.align === 'left'
                ? styles.tableCellLeft
                : styles.tableCell,
              {
                flex:
                  typeof columns[ci]?.width === 'number'
                    ? (columns[ci].width as number)
                    : undefined,
                width:
                  typeof columns[ci]?.width === 'string'
                    ? (columns[ci].width as string)
                    : undefined,
              },
            ]}
          >
            {cell}
          </Text>
        ))}
      </View>
    ))}
  </View>
);

/** Highlight metric box */
const MetricBox: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.highlightBox}>
    <Text style={styles.highlightLabel}>{label}</Text>
    <Text style={styles.highlightValue}>{value}</Text>
  </View>
);

// ============================================================
// Helper: split projections into gov vs other
// ============================================================

function govIncome(p: YearlyProjection) {
  return p.annuity + p.fersSupplement;
}
function otherIncome(p: YearlyProjection) {
  return p.socialSecurity + p.tspWithdrawal + p.otherIncome;
}
function govExpenses(p: YearlyProjection) {
  return (
    p.fegliCost +
    p.fehbCost +
    p.survivorBenefitCost +
    p.federalTax +
    p.stateTax +
    p.ltcPremium
  );
}
function otherExpenses(p: YearlyProjection) {
  return p.livingExpenses;
}

// ============================================================
// Main Report Document
// ============================================================

export type UserTier = 'FREE' | 'PERSONAL' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface FederalReportProps {
  input: ReportInput;
  result: CalculationResult;
  tier?: UserTier;
}

/** Watermark overlay for FREE tier pages */
const Watermark: React.FC = () => (
  <View
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    }}
    fixed
  >
    <Text
      style={{
        fontSize: 60,
        color: 'rgba(200, 200, 200, 0.25)',
        transform: 'rotate(-45deg)',
        fontWeight: 'bold',
        letterSpacing: 8,
      }}
    >
      SAMPLE REPORT
    </Text>
  </View>
);

const FederalRetirementReport: React.FC<FederalReportProps> = ({
  input,
  result,
  tier = 'FREE',
}) => {
  const isFree = tier === 'FREE';
  const isProfessional = tier === 'PROFESSIONAL' || tier === 'ENTERPRISE';
  const projectionYears = input.projectionYears ?? 30;
  const cola = input.colaAssumption ?? 0.02;
  const projections = result.yearlyProjections.slice(0, projectionYears);

  // TSP combined projections
  const tspCombined: TspProjectionYear[] = result.tsp.traditionalProjections.map(
    (t, i) => {
      const r = result.tsp.rothProjections[i];
      return {
        year: t.year,
        age: t.age,
        startBalance: t.startBalance + (r?.startBalance ?? 0),
        contributions: t.contributions + (r?.contributions ?? 0),
        governmentMatch: t.governmentMatch + (r?.governmentMatch ?? 0),
        growth: t.growth + (r?.growth ?? 0),
        endBalance: t.endBalance + (r?.endBalance ?? 0),
      };
    },
  );

  const retDate = input.employment.plannedRetirementDate;
  const today = new Date().toISOString().slice(0, 10);

  // FREE tier: max 10 pages, always watermarked
  // PROFESSIONAL/ENTERPRISE: custom branding on cover
  const WPage: React.FC<ReportPageProps> = (props) => (
    <ReportPageInternal {...props} showWatermark={isFree} />
  );

  // Collect all sections as an array for page-limiting
  const sections: React.ReactNode[] = [];
  let sectionIndex = 0;
  const maxPages = isFree ? 10 : Infinity;
  const canAddPage = () => sectionIndex < maxPages;
  const addSection = (node: React.ReactNode) => {
    if (canAddPage()) {
      sections.push(node);
      sectionIndex++;
    }
  };

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <Document
      title={`Federal Retirement Report — ${input.personal.fullName}`}
      author={input.advisorName ?? 'CapitalWealth.com'}
    >
      {/* ============================================================
          A. COVER PAGE
          ============================================================ */}
      <Page size="LETTER" style={styles.coverPage}>
        {isFree && <Watermark />}
        <Text style={styles.coverLogo}>
          {isProfessional && input.advisorCompany ? input.advisorCompany : 'CapitalWealth.com'}
        </Text>
        <Text style={styles.coverSubtitle}>FEDERAL BENEFITS GROUP</Text>
        <View style={styles.coverDivider} />
        <Text style={styles.coverTitle}>
          Federal Retirement Benefits Analysis
        </Text>
        <Text style={styles.coverClientName}>
          Prepared for {input.personal.fullName}
        </Text>
        <View style={styles.spacerLg} />
        <Text style={styles.coverDate}>
          Report Date: {fmt.dateLong(today)}
        </Text>
        <Text style={styles.coverDate}>
          Planned Retirement: {fmt.dateLong(retDate)}
        </Text>
        {input.advisorName && (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={styles.coverAdvisor}>
              Prepared by: {input.advisorName}
            </Text>
            {input.advisorCompany && (
              <Text style={styles.coverAdvisor}>{input.advisorCompany}</Text>
            )}
            {input.advisorPhone && (
              <Text style={styles.coverAdvisor}>{input.advisorPhone}</Text>
            )}
            {input.advisorEmail && (
              <Text style={styles.coverAdvisor}>{input.advisorEmail}</Text>
            )}
          </View>
        )}
        <View style={styles.coverFooterBlock}>
          <Text style={styles.coverDisclaimer}>
            This report is for illustrative purposes only and does not constitute
            financial, tax, or legal advice. Projections are based on assumptions
            provided and may not reflect actual future results. Consult a qualified
            professional before making retirement decisions.
          </Text>
        </View>
      </Page>

      {/* ============================================================
          B. DISCLAIMER PAGE
          ============================================================ */}
      <WPage sectionTitle="Important Disclosures">
        <Text style={styles.sectionTitle}>Important Disclosures</Text>
        <View style={styles.goldDivider} />
        <Text style={styles.text}>
          This Federal Retirement Benefits Analysis has been prepared for{' '}
          {input.personal.fullName} by CapitalWealth.com
          {input.advisorName ? ` and ${input.advisorName}` : ''}.
        </Text>
        <Text style={styles.text}>
          The projections contained in this report are based on data provided by
          the client and assumptions about future rates of return, inflation,
          cost-of-living adjustments, and tax rates. Actual results will vary.
        </Text>
        <Text style={[styles.text, { marginTop: 8 }]}>
          Key assumptions used in this report:
        </Text>
        <View style={styles.summaryBox}>
          <SRow label="COLA Assumption" value={fmt.pct(cola)} />
          <SRow label="Projection Period" value={`${projectionYears} years`} />
          <SRow
            label="Federal Tax Rate (effective)"
            value={fmt.pct(input.tax.federalTaxRate)}
          />
          <SRow
            label="State Tax Rate (effective)"
            value={fmt.pct(input.tax.stateTaxRate)}
          />
          <SRow
            label="Filing Status"
            value={input.tax.filingStatus.replace(/_/g, ' ')}
          />
          <SRow
            label="Salary Increase Assumption"
            value={fmt.pct(input.employment.annualSalaryIncreaseRate)}
          />
          <SRow
            label="TSP Expected Return"
            value={fmt.pct(input.tsp.expectedReturnRate)}
          />
          <SRow
            label="FEHB Premium Increase"
            value={fmt.pct(input.fehb.premiumIncreaseRate)}
          />
        </View>
        <Text style={styles.text}>
          This report does not guarantee any particular outcome. Federal
          retirement benefits are governed by law and regulation, which may
          change. Benefits shown are estimates and should be verified with the
          Office of Personnel Management (OPM).
        </Text>
        <Text style={styles.text}>
          CapitalWealth.com is not affiliated with the U.S. Government,
          OPM, or any federal agency. All trademarks are property of their
          respective owners.
        </Text>
        <Text style={[styles.text, styles.bold, { marginTop: 12 }]}>
          Past performance is not indicative of future results. All investments
          involve risk, including the possible loss of principal.
        </Text>
      </WPage>

      {/* ============================================================
          C. BENEFITS SUMMARY
          ============================================================ */}
      <WPage sectionTitle="Benefits Summary">
        <Text style={styles.sectionTitle}>Benefits Summary</Text>
        <Text style={styles.sectionSubtitle}>
          Overview of your federal retirement benefits at a glance
        </Text>

        <View style={styles.comparisonRow}>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightLabel}>Annual Annuity</Text>
            <Text style={styles.highlightValue}>
              {fmt.currency(result.annuity.annualAnnuity)}
            </Text>
          </View>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightLabel}>Monthly Annuity</Text>
            <Text style={styles.highlightValue}>
              {fmt.currency(result.annuity.monthlyAnnuity)}
            </Text>
          </View>
        </View>

        <View style={styles.summaryBox}>
          <SRow label="Retirement System" value={input.employment.retirementSystem.replace(/_/g, ' ')} />
          <SRow label="Planned Retirement Date" value={fmt.date(retDate)} />
          <SRow label="Retirement Age" value={`${result.proposedRetirement.age}`} />
          <SRow label="High-3 Average Salary" value={fmt.currency(result.annuity.high3Average)} />
          <SRow
            label="Total Creditable Service"
            value={fmt.yrsmos(result.annuity.totalServiceYears, result.annuity.totalServiceMonths)}
          />
          <SRow label="Sick Leave Credit" value={`${fmt.num(result.annuity.sickLeaveCredit, 2)} years`} />
          <SRow label="Multiplier Used" value={fmt.pct(result.annuity.multiplier)} />
        </View>

        <View style={styles.summaryBox}>
          <SRow label="Survivor Benefit Election" value={result.survivorBenefit.election.replace(/_/g, ' ')} />
          <SRow label="Survivor Annual Cost" value={fmt.currency(result.survivorBenefit.annualCost)} />
          <SRow label="Survivor Annual Benefit" value={fmt.currency(result.survivorBenefit.survivorAnnualBenefit)} />
        </View>

        <View style={styles.summaryBox}>
          <SRow
            label="FERS Supplement (monthly)"
            value={result.fersSupplement.eligible ? fmt.currency(result.fersSupplement.monthlyAmount) : 'Not Eligible'}
          />
          <SRow
            label="Social Security (at start age)"
            value={fmt.currency(result.socialSecurity.monthlyBenefitAtStartAge)}
          />
          <SRow label="TSP Balance at Retirement" value={fmt.currencyWhole(result.tsp.totalAtRetirement)} />
          <SRow label="FEGLI Total Coverage" value={fmt.currencyWhole(result.fegli.currentCoverage.total)} />
          <SRow label="FEHB Monthly Premium" value={fmt.currency(result.fehb.currentMonthlyPremium)} />
          <SRow label="Income Replacement Ratio" value={fmt.pct(result.incomeComparison.replacementRatio)} />
        </View>
      </WPage>

      {/* ============================================================
          D. FEDERAL INCOME ANALYSIS — MONTHLY COMPARISON
          ============================================================ */}
      <WPage sectionTitle="Federal Income Analysis">
        <Text style={styles.sectionTitle}>Federal Income Analysis</Text>
        <Text style={styles.sectionSubtitle}>
          Last paycheck vs. first retirement check — monthly comparison
        </Text>

        <View style={styles.comparisonRow}>
          {/* Last Paycheck */}
          <View style={styles.comparisonBox}>
            <Text style={styles.comparisonTitle}>Last Paycheck (Monthly)</Text>
            <SRow label="Gross Monthly Salary" value={fmt.currency(result.incomeComparison.lastPaycheck.grossMonthly)} />
            <SRow label="Retirement Contribution" value={fmt.currency(-result.incomeComparison.lastPaycheck.retirementContribution)} />
            <SRow label="TSP Contribution" value={fmt.currency(-result.incomeComparison.lastPaycheck.tspContribution)} />
            <SRow label="FICA / Medicare" value={fmt.currency(-result.incomeComparison.lastPaycheck.ficaMedicare)} />
            <SRow label="Federal Tax" value={fmt.currency(-result.incomeComparison.lastPaycheck.federalTax)} />
            <SRow label="State Tax" value={fmt.currency(-result.incomeComparison.lastPaycheck.stateTax)} />
            <SRow label="FEGLI Premium" value={fmt.currency(-result.incomeComparison.lastPaycheck.fegliPremium)} />
            <SRow label="FEHB Premium" value={fmt.currency(-result.incomeComparison.lastPaycheck.fehbPremium)} />
            <SRow label="Other Deductions" value={fmt.currency(-result.incomeComparison.lastPaycheck.otherDeductions)} />
            <View style={styles.divider} />
            <SRow label="Net Monthly Pay" value={fmt.currency(result.incomeComparison.lastPaycheck.netMonthly)} bold />
          </View>

          {/* First Retirement Check */}
          <View style={styles.comparisonBox}>
            <Text style={styles.comparisonTitle}>First Retirement Check</Text>
            <SRow label="Gross Annuity" value={fmt.currency(result.incomeComparison.firstRetirementCheck.grossAnnuity)} />
            <SRow label="Survivor Benefit Cost" value={fmt.currency(-result.incomeComparison.firstRetirementCheck.survivorBenefitCost)} />
            <SRow label="Federal Tax" value={fmt.currency(-result.incomeComparison.firstRetirementCheck.federalTax)} />
            <SRow label="State Tax" value={fmt.currency(-result.incomeComparison.firstRetirementCheck.stateTax)} />
            <SRow label="FEGLI Premium" value={fmt.currency(-result.incomeComparison.firstRetirementCheck.fegliPremium)} />
            <SRow label="FEHB Premium" value={fmt.currency(-result.incomeComparison.firstRetirementCheck.fehbPremium)} />
            <SRow label="FERS Supplement" value={fmt.currency(result.incomeComparison.firstRetirementCheck.fersSupplement)} />
            <SRow label="Social Security" value={fmt.currency(result.incomeComparison.firstRetirementCheck.socialSecurity)} />
            <SRow label="TSP Withdrawal" value={fmt.currency(result.incomeComparison.firstRetirementCheck.tspWithdrawal)} />
            <SRow label="Other Income" value={fmt.currency(result.incomeComparison.firstRetirementCheck.otherIncome)} />
            <View style={styles.divider} />
            <SRow label="Net Monthly Income" value={fmt.currency(result.incomeComparison.firstRetirementCheck.netMonthly)} bold />
          </View>
        </View>

        <View style={styles.summaryBox}>
          <SRow
            label="Monthly Difference"
            value={fmt.currency(result.incomeComparison.monthlyDifference)}
            bold
          />
          <SRow
            label="Income Replacement Ratio"
            value={fmt.pct(result.incomeComparison.replacementRatio)}
            bold
          />
        </View>
      </WPage>

      {/* ============================================================
          E. ANNUAL INCOME — GOVERNMENT
          ============================================================ */}
      <WPage sectionTitle="Annual Income — Government">
        <Text style={styles.sectionTitle}>Annual Income — Government Sources</Text>
        <Text style={styles.sectionSubtitle}>
          Annuity and FERS Supplement income projections
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.6, align: 'left' },
            { header: 'Age', width: 0.4 },
            { header: 'Annuity', width: 1 },
            { header: 'FERS Supp.', width: 1 },
            { header: 'Total Gov Income', width: 1.2 },
          ]}
          rows={projections.map((p) => [
            String(p.year),
            String(p.age),
            fmt.currency(p.annuity),
            fmt.currency(p.fersSupplement),
            fmt.currency(govIncome(p)),
          ])}
        />
      </WPage>

      {/* ============================================================
          F. MONTHLY INCOME — GOVERNMENT
          ============================================================ */}
      <WPage sectionTitle="Monthly Income — Government">
        <Text style={styles.sectionTitle}>Monthly Income — Government Sources</Text>
        <Text style={styles.sectionSubtitle}>
          Monthly breakdown of government income
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.6, align: 'left' },
            { header: 'Age', width: 0.4 },
            { header: 'Annuity', width: 1 },
            { header: 'FERS Supp.', width: 1 },
            { header: 'Total Gov/Mo', width: 1.2 },
          ]}
          rows={projections.map((p) => [
            String(p.year),
            String(p.age),
            fmt.currency(p.annuity / 12),
            fmt.currency(p.fersSupplement / 12),
            fmt.currency(govIncome(p) / 12),
          ])}
        />
      </WPage>

      {/* ============================================================
          G. ANNUAL INCOME — OTHER SOURCES
          ============================================================ */}
      <WPage sectionTitle="Annual Income — Other Sources">
        <Text style={styles.sectionTitle}>Annual Income — Other Sources</Text>
        <Text style={styles.sectionSubtitle}>
          Social Security, TSP withdrawals, and other income
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.5, align: 'left' },
            { header: 'Age', width: 0.4 },
            { header: 'Soc. Sec.', width: 1 },
            { header: 'TSP W/D', width: 1 },
            { header: 'Other', width: 0.8 },
            { header: 'Total Other', width: 1.1 },
          ]}
          rows={projections.map((p) => [
            String(p.year),
            String(p.age),
            fmt.currency(p.socialSecurity),
            fmt.currency(p.tspWithdrawal),
            fmt.currency(p.otherIncome),
            fmt.currency(otherIncome(p)),
          ])}
        />
      </WPage>

      {/* ============================================================
          H. MONTHLY INCOME — OTHER SOURCES
          ============================================================ */}
      <WPage sectionTitle="Monthly Income — Other Sources">
        <Text style={styles.sectionTitle}>Monthly Income — Other Sources</Text>
        <Text style={styles.sectionSubtitle}>
          Monthly breakdown of non-government income
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.5, align: 'left' },
            { header: 'Age', width: 0.4 },
            { header: 'Soc. Sec.', width: 1 },
            { header: 'TSP W/D', width: 1 },
            { header: 'Other', width: 0.8 },
            { header: 'Total Other/Mo', width: 1.1 },
          ]}
          rows={projections.map((p) => [
            String(p.year),
            String(p.age),
            fmt.currency(p.socialSecurity / 12),
            fmt.currency(p.tspWithdrawal / 12),
            fmt.currency(p.otherIncome / 12),
            fmt.currency(otherIncome(p) / 12),
          ])}
        />
      </WPage>

      {/* ============================================================
          I. ANNUAL EXPENSES — GOVERNMENT
          ============================================================ */}
      <WPage sectionTitle="Annual Expenses — Government">
        <Text style={styles.sectionTitle}>Annual Expenses — Government</Text>
        <Text style={styles.sectionSubtitle}>
          FEGLI, FEHB, survivor benefit costs, taxes, and LTC premiums
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.5, align: 'left' },
            { header: 'Age', width: 0.35 },
            { header: 'FEGLI', width: 0.8 },
            { header: 'FEHB', width: 0.8 },
            { header: 'Survivor', width: 0.8 },
            { header: 'Fed Tax', width: 0.9 },
            { header: 'State Tax', width: 0.8 },
            { header: 'LTC', width: 0.7 },
            { header: 'Total', width: 1 },
          ]}
          rows={projections.map((p) => [
            String(p.year),
            String(p.age),
            fmt.currency(p.fegliCost),
            fmt.currency(p.fehbCost),
            fmt.currency(p.survivorBenefitCost),
            fmt.currency(p.federalTax),
            fmt.currency(p.stateTax),
            fmt.currency(p.ltcPremium),
            fmt.currency(govExpenses(p)),
          ])}
        />
      </WPage>

      {/* ============================================================
          J. MONTHLY EXPENSES — GOVERNMENT
          ============================================================ */}
      <WPage sectionTitle="Monthly Expenses — Government">
        <Text style={styles.sectionTitle}>Monthly Expenses — Government</Text>
        <Text style={styles.sectionSubtitle}>
          Monthly government-related expense breakdown
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.5, align: 'left' },
            { header: 'Age', width: 0.35 },
            { header: 'FEGLI', width: 0.8 },
            { header: 'FEHB', width: 0.8 },
            { header: 'Survivor', width: 0.8 },
            { header: 'Fed Tax', width: 0.9 },
            { header: 'State Tax', width: 0.8 },
            { header: 'LTC', width: 0.7 },
            { header: 'Total/Mo', width: 1 },
          ]}
          rows={projections.map((p) => [
            String(p.year),
            String(p.age),
            fmt.currency(p.fegliCost / 12),
            fmt.currency(p.fehbCost / 12),
            fmt.currency(p.survivorBenefitCost / 12),
            fmt.currency(p.federalTax / 12),
            fmt.currency(p.stateTax / 12),
            fmt.currency(p.ltcPremium / 12),
            fmt.currency(govExpenses(p) / 12),
          ])}
        />
      </WPage>

      {/* ============================================================
          K. ANNUAL EXPENSES — OTHER SOURCES (Living)
          ============================================================ */}
      <WPage sectionTitle="Annual Expenses — Living">
        <Text style={styles.sectionTitle}>Annual Expenses — Other Sources</Text>
        <Text style={styles.sectionSubtitle}>
          Projected living expenses (housing, food, transportation, etc.)
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.6, align: 'left' },
            { header: 'Age', width: 0.5 },
            { header: 'Living Expenses', width: 1.5 },
          ]}
          rows={projections.map((p) => [
            String(p.year),
            String(p.age),
            fmt.currency(p.livingExpenses),
          ])}
        />
        <View style={styles.summaryBox}>
          <Text style={[styles.textSmall, styles.italic]}>
            Living expenses include: housing, utilities, transportation, food,
            out-of-pocket healthcare, insurance, debt payments, entertainment,
            travel, charitable giving, and other expenses. Adjusted annually for
            inflation at the COLA assumption rate of {fmt.pct(cola)}.
          </Text>
        </View>
      </WPage>

      {/* ============================================================
          L. MONTHLY EXPENSES — OTHER SOURCES (Living)
          ============================================================ */}
      <WPage sectionTitle="Monthly Expenses — Living">
        <Text style={styles.sectionTitle}>Monthly Expenses — Other Sources</Text>
        <Text style={styles.sectionSubtitle}>
          Monthly living expense projections
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.6, align: 'left' },
            { header: 'Age', width: 0.5 },
            { header: 'Living Expenses/Mo', width: 1.5 },
          ]}
          rows={projections.map((p) => [
            String(p.year),
            String(p.age),
            fmt.currency(p.livingExpenses / 12),
          ])}
        />
      </WPage>

      {/* ============================================================
          M. ANNUAL NET — GOVERNMENT
          ============================================================ */}
      <WPage sectionTitle="Annual Net — Government">
        <Text style={styles.sectionTitle}>
          Annual Income/Expense — Government Net
        </Text>
        <Text style={styles.sectionSubtitle}>
          Government income minus government expenses
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.5, align: 'left' },
            { header: 'Age', width: 0.4 },
            { header: 'Gov Income', width: 1 },
            { header: 'Gov Expenses', width: 1 },
            { header: 'Net', width: 1.1 },
          ]}
          rows={projections.map((p) => [
            String(p.year),
            String(p.age),
            fmt.currency(govIncome(p)),
            fmt.currency(govExpenses(p)),
            fmt.currency(govIncome(p) - govExpenses(p)),
          ])}
        />
      </WPage>

      {/* ============================================================
          N. MONTHLY NET — GOVERNMENT
          ============================================================ */}
      <WPage sectionTitle="Monthly Net — Government">
        <Text style={styles.sectionTitle}>
          Monthly Income/Expense — Government Net
        </Text>
        <Text style={styles.sectionSubtitle}>
          Monthly government net income
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.5, align: 'left' },
            { header: 'Age', width: 0.4 },
            { header: 'Gov Income/Mo', width: 1 },
            { header: 'Gov Expense/Mo', width: 1 },
            { header: 'Net/Mo', width: 1.1 },
          ]}
          rows={projections.map((p) => [
            String(p.year),
            String(p.age),
            fmt.currency(govIncome(p) / 12),
            fmt.currency(govExpenses(p) / 12),
            fmt.currency((govIncome(p) - govExpenses(p)) / 12),
          ])}
        />
      </WPage>

      {/* ============================================================
          O. ANNUAL NET — ALL SOURCES COMBINED
          ============================================================ */}
      <WPage sectionTitle="Annual Net — All Sources">
        <Text style={styles.sectionTitle}>
          Annual Income/Expense — All Sources Combined
        </Text>
        <Text style={styles.sectionSubtitle}>
          Complete annual picture: all income minus all expenses
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.5, align: 'left' },
            { header: 'Age', width: 0.35 },
            { header: 'Total Income', width: 1 },
            { header: 'Total Expenses', width: 1 },
            { header: 'Net Income', width: 1.1 },
          ]}
          rows={projections.map((p) => [
            String(p.year),
            String(p.age),
            fmt.currency(p.totalIncome),
            fmt.currency(p.totalExpenses + p.livingExpenses),
            fmt.currency(p.netIncome),
          ])}
        />
      </WPage>

      {/* ============================================================
          P. MONTHLY NET — ALL SOURCES COMBINED
          ============================================================ */}
      <WPage sectionTitle="Monthly Net — All Sources">
        <Text style={styles.sectionTitle}>
          Monthly Income/Expense — All Sources Combined
        </Text>
        <Text style={styles.sectionSubtitle}>
          Complete monthly picture
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.5, align: 'left' },
            { header: 'Age', width: 0.35 },
            { header: 'Total Income/Mo', width: 1 },
            { header: 'Total Expense/Mo', width: 1 },
            { header: 'Net/Mo', width: 1.1 },
          ]}
          rows={projections.map((p) => [
            String(p.year),
            String(p.age),
            fmt.currency(p.totalIncome / 12),
            fmt.currency((p.totalExpenses + p.livingExpenses) / 12),
            fmt.currency(p.netIncome / 12),
          ])}
        />
      </WPage>

      {/* ============================================================
          Q. PROPOSED & DELAYED RETIREMENT COMPARISON
          ============================================================ */}
      <WPage sectionTitle="Retirement Comparison">
        <Text style={styles.sectionTitle}>
          Proposed vs. Delayed Retirement Comparison
        </Text>
        <Text style={styles.sectionSubtitle}>
          Impact of retiring at planned date versus a later date
        </Text>

        <View style={styles.comparisonRow}>
          <View style={styles.comparisonBox}>
            <Text style={styles.comparisonTitle}>Proposed Retirement</Text>
            <SRow label="Date" value={fmt.date(result.proposedRetirement.date)} />
            <SRow label="Age" value={String(result.proposedRetirement.age)} />
            <SRow
              label="Annual Annuity"
              value={fmt.currency(result.proposedRetirement.annualAnnuity)}
              bold
            />
            <SRow
              label="Monthly Annuity"
              value={fmt.currency(result.proposedRetirement.monthlyAnnuity)}
              bold
            />
          </View>
          <View style={styles.comparisonBox}>
            <Text style={styles.comparisonTitle}>Delayed Retirement</Text>
            <SRow label="Date" value={fmt.date(result.delayedRetirement.date)} />
            <SRow label="Age" value={String(result.delayedRetirement.age)} />
            <SRow
              label="Annual Annuity"
              value={fmt.currency(result.delayedRetirement.annualAnnuity)}
              bold
            />
            <SRow
              label="Monthly Annuity"
              value={fmt.currency(result.delayedRetirement.monthlyAnnuity)}
              bold
            />
          </View>
        </View>

        <View style={styles.summaryBox}>
          <SRow
            label="Annual Annuity Difference"
            value={fmt.currency(
              result.delayedRetirement.annualAnnuity -
                result.proposedRetirement.annualAnnuity,
            )}
            bold
          />
          <SRow
            label="Monthly Annuity Difference"
            value={fmt.currency(
              result.delayedRetirement.monthlyAnnuity -
                result.proposedRetirement.monthlyAnnuity,
            )}
            bold
          />
        </View>

        {result.mraPlus10.applies && (
          <View style={styles.summaryBox}>
            <Text style={styles.subtitle}>MRA+10 Early Retirement Penalty</Text>
            <SRow
              label="Penalty Percentage"
              value={fmt.pct(result.mraPlus10.penaltyPercent / 100)}
            />
            <SRow
              label="Months Under Age 62"
              value={String(result.mraPlus10.monthsUnder62)}
            />
            <SRow
              label="Reduced Annual Annuity"
              value={fmt.currency(result.mraPlus10.reducedAnnuity)}
              bold
            />
          </View>
        )}
      </WPage>

      {/* ============================================================
          R. ANNUITY & SURVIVOR BENEFIT DETAIL
          ============================================================ */}
      <WPage sectionTitle="Annuity & Survivor Benefit">
        <Text style={styles.sectionTitle}>Annuity & Survivor Benefit Detail</Text>
        <Text style={styles.sectionSubtitle}>
          Detailed annuity computation and COLA projections
        </Text>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Annuity Computation</Text>
          <SRow label="High-3 Average Salary" value={fmt.currency(result.annuity.high3Average)} />
          <SRow
            label="Creditable Service"
            value={fmt.yrsmos(result.annuity.totalServiceYears, result.annuity.totalServiceMonths)}
          />
          <SRow label="Sick Leave Credit" value={`${fmt.num(result.annuity.sickLeaveCredit)} years`} />
          <SRow label="Effective Multiplier" value={fmt.pct(result.annuity.multiplier)} />
          {result.annuity.csrsComponent != null && (
            <SRow label="CSRS Component" value={fmt.currency(result.annuity.csrsComponent)} />
          )}
          {result.annuity.fersComponent != null && (
            <SRow label="FERS Component" value={fmt.currency(result.annuity.fersComponent)} />
          )}
          <View style={styles.divider} />
          <SRow label="Gross Annual Annuity" value={fmt.currency(result.annuity.annualAnnuity)} bold />
          <SRow label="Gross Monthly Annuity" value={fmt.currency(result.annuity.monthlyAnnuity)} bold />
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Survivor Benefit</Text>
          <SRow label="Election" value={result.survivorBenefit.election.replace(/_/g, ' ')} />
          <SRow label="Annual Cost (reduction)" value={fmt.currency(result.survivorBenefit.annualCost)} />
          <SRow label="Monthly Cost (reduction)" value={fmt.currency(result.survivorBenefit.monthlyCost)} />
          <SRow label="Survivor Annual Benefit" value={fmt.currency(result.survivorBenefit.survivorAnnualBenefit)} bold />
          <SRow label="Survivor Monthly Benefit" value={fmt.currency(result.survivorBenefit.survivorMonthlyBenefit)} bold />
        </View>

        <Text style={styles.subtitle}>COLA Projections</Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.6, align: 'left' },
            { header: 'COLA Rate', width: 1 },
            { header: 'Annuity After COLA', width: 1.4 },
          ]}
          rows={result.colaProjections.slice(0, projectionYears).map((c: ColaProjection) => [
            String(c.year),
            fmt.pct(c.colaRate),
            fmt.currency(c.annuityAfterCola),
          ])}
        />
      </WPage>

      {/* ============================================================
          S. FERS SUPPLEMENT / SOCIAL SECURITY
          ============================================================ */}
      <WPage sectionTitle="FERS Supplement & Social Security">
        <Text style={styles.sectionTitle}>
          FERS Supplement & Social Security Benefits
        </Text>
        <Text style={styles.sectionSubtitle}>
          Bridge income and lifetime Social Security projections
        </Text>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>FERS Supplement (Special Retirement Supplement)</Text>
          <SRow label="Eligible" value={result.fersSupplement.eligible ? 'Yes' : 'No'} />
          {result.fersSupplement.eligible && (
            <>
              <SRow label="Monthly Amount" value={fmt.currency(result.fersSupplement.monthlyAmount)} bold />
              <SRow label="Annual Amount" value={fmt.currency(result.fersSupplement.annualAmount)} bold />
              <SRow label="Start Date" value={fmt.date(result.fersSupplement.startDate)} />
              <SRow label="End Date (age 62)" value={fmt.date(result.fersSupplement.endDate)} />
            </>
          )}
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Social Security</Text>
          <SRow label="Estimated Benefit at Age 62" value={fmt.currency(input.socialSecurity.estimatedBenefitAge62)} />
          <SRow label="Estimated Benefit at FRA" value={fmt.currency(input.socialSecurity.estimatedBenefitFRA)} />
          <SRow label="Planned Start Age" value={String(result.socialSecurity.startAge)} />
          <SRow label="Full Retirement Age" value={String(result.socialSecurity.fullRetirementAge)} />
          <SRow
            label="Monthly Benefit at Start Age"
            value={fmt.currency(result.socialSecurity.monthlyBenefitAtStartAge)}
            bold
          />
          <SRow
            label="Annual Benefit at Start Age"
            value={fmt.currency(result.socialSecurity.annualBenefitAtStartAge)}
            bold
          />
        </View>

        <Text style={styles.subtitle}>Social Security Year-by-Year</Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.6, align: 'left' },
            { header: 'Annual Benefit', width: 1.4 },
          ]}
          rows={result.socialSecurity.yearlyProjections
            .slice(0, projectionYears)
            .map((y) => [String(y.year), fmt.currency(y.annualBenefit)])}
        />
      </WPage>

      {/* ============================================================
          T. TSP OVERVIEW
          ============================================================ */}
      <WPage sectionTitle="TSP Overview">
        <Text style={styles.sectionTitle}>Thrift Savings Plan Overview</Text>
        <Text style={styles.sectionSubtitle}>
          Current allocations and projected retirement balance
        </Text>

        <View style={styles.comparisonRow}>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightLabel}>Total TSP at Retirement</Text>
            <Text style={styles.highlightValue}>
              {fmt.currencyWhole(result.tsp.totalAtRetirement)}
            </Text>
          </View>
          <View style={[styles.highlightBox, { backgroundColor: colors.navyLight }]}>
            <Text style={styles.highlightLabel}>Planned Monthly W/D</Text>
            <Text style={styles.highlightValue}>
              {fmt.currency(result.tsp.monthlyWithdrawal)}
            </Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <View style={styles.summaryBox}>
              <Text style={styles.subtitle}>Traditional TSP</Text>
              {input.tsp.traditionalBalances.map((f, i) => (
                <SRow
                  key={`trad-${i}`}
                  label={`${f.fund} Fund`}
                  value={fmt.currency(f.balance)}
                />
              ))}
              <View style={styles.divider} />
              <SRow
                label="Traditional at Retirement"
                value={fmt.currencyWhole(result.tsp.traditionalAtRetirement)}
                bold
              />
            </View>
          </View>
          <View style={styles.col}>
            <View style={styles.summaryBox}>
              <Text style={styles.subtitle}>Roth TSP</Text>
              {input.tsp.rothBalances.map((f, i) => (
                <SRow
                  key={`roth-${i}`}
                  label={`${f.fund} Fund`}
                  value={fmt.currency(f.balance)}
                />
              ))}
              <View style={styles.divider} />
              <SRow
                label="Roth at Retirement"
                value={fmt.currencyWhole(result.tsp.rothAtRetirement)}
                bold
              />
            </View>
          </View>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Contribution Details</Text>
          <SRow label="Annual Traditional Contribution" value={fmt.currency(input.tsp.annualContributionTraditional)} />
          <SRow label="Annual Roth Contribution" value={fmt.currency(input.tsp.annualContributionRoth)} />
          <SRow label="Government Match" value={fmt.pct(input.tsp.governmentMatchPercent / 100)} />
          <SRow label="Catch-Up Contribution" value={fmt.currency(input.tsp.catchUpContribution)} />
          <SRow label="Expected Blended Return" value={fmt.pct(input.tsp.expectedReturnRate)} />
          <SRow label="Withdrawal Method" value={input.tsp.withdrawalMethod.replace(/_/g, ' ')} />
          {input.tsp.monthlyWithdrawalAmount != null && (
            <SRow label="Requested Monthly W/D" value={fmt.currency(input.tsp.monthlyWithdrawalAmount)} />
          )}
        </View>
      </WPage>

      {/* ============================================================
          U. TSP GROWTH PROJECTIONS
          ============================================================ */}
      <WPage sectionTitle="TSP Growth Projections">
        <Text style={styles.sectionTitle}>TSP Growth Projections</Text>
        <Text style={styles.sectionSubtitle}>
          Year-by-year combined TSP balance growth
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.5, align: 'left' },
            { header: 'Age', width: 0.35 },
            { header: 'Start Bal.', width: 1 },
            { header: 'Contrib.', width: 0.8 },
            { header: 'Match', width: 0.7 },
            { header: 'Growth', width: 0.8 },
            { header: 'End Bal.', width: 1.1 },
          ]}
          rows={tspCombined.map((t: TspProjectionYear) => [
            String(t.year),
            String(t.age),
            fmt.currencyWhole(t.startBalance),
            fmt.currencyWhole(t.contributions),
            fmt.currencyWhole(t.governmentMatch),
            fmt.currencyWhole(t.growth),
            fmt.currencyWhole(t.endBalance),
          ])}
        />
      </WPage>

      {/* ============================================================
          V. TSP WITHDRAWAL OPTIONS
          ============================================================ */}
      <WPage sectionTitle="TSP Withdrawal Options">
        <Text style={styles.sectionTitle}>TSP Withdrawal Options</Text>
        <Text style={styles.sectionSubtitle}>
          Comparison of withdrawal strategies from your TSP balance
        </Text>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Your Selected Method</Text>
          <SRow label="Withdrawal Method" value={input.tsp.withdrawalMethod.replace(/_/g, ' ')} />
          <SRow label="Planned Withdrawal Age" value={String(input.tsp.plannedWithdrawalAge)} />
          <SRow label="Annual Withdrawal" value={fmt.currency(result.tsp.annualWithdrawal)} bold />
          <SRow label="Monthly Withdrawal" value={fmt.currency(result.tsp.monthlyWithdrawal)} bold />
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Balance at Retirement</Text>
          <SRow label="Traditional TSP" value={fmt.currencyWhole(result.tsp.traditionalAtRetirement)} />
          <SRow label="Roth TSP" value={fmt.currencyWhole(result.tsp.rothAtRetirement)} />
          <View style={styles.divider} />
          <SRow label="Total TSP" value={fmt.currencyWhole(result.tsp.totalAtRetirement)} bold />
        </View>

        <Text style={styles.subtitle}>Withdrawal Method Descriptions</Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>Lump Sum:</Text> Withdraw entire balance at once.
          Subject to federal and state income taxes on traditional balance.
          Roth earnings are tax-free if qualified.
        </Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>Monthly Payments:</Text> Receive a fixed or
          calculated monthly amount. Provides regular income stream. Can be
          changed once per year.
        </Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>Life Annuity:</Text> Purchase a life annuity
          through the TSP providing guaranteed lifetime income. Irrevocable once
          purchased.
        </Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>Combination:</Text> Mix of partial lump sum,
          monthly payments, and/or annuity. Provides flexibility to meet
          different needs.
        </Text>
      </WPage>

      {/* ============================================================
          W. FEGLI CURRENT COVERAGE & COSTS
          ============================================================ */}
      <WPage sectionTitle="FEGLI Coverage">
        <Text style={styles.sectionTitle}>
          FEGLI — Current Coverage & Costs
        </Text>
        <Text style={styles.sectionSubtitle}>
          Federal Employees Group Life Insurance coverage and premium detail
        </Text>

        <View style={styles.comparisonRow}>
          <MetricBox
            label="Total Coverage"
            value={fmt.currencyWhole(result.fegli.currentCoverage.total)}
          />
          <MetricBox
            label="Monthly Premium"
            value={fmt.currency(result.fegli.currentMonthlyCost)}
          />
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Coverage Breakdown</Text>
          <SRow label="Basic Insurance (BIA)" value={fmt.currencyWhole(result.fegli.currentCoverage.basic)} />
          <SRow
            label="Option A — Standard ($10,000)"
            value={input.fegli.optionA ? fmt.currencyWhole(result.fegli.currentCoverage.optionA) : 'Not Elected'}
          />
          <SRow
            label={`Option B — ${input.fegli.optionBMultiple}x Salary`}
            value={input.fegli.optionB ? fmt.currencyWhole(result.fegli.currentCoverage.optionB) : 'Not Elected'}
          />
          <SRow
            label={`Option C — ${input.fegli.optionCMultiple}x Family`}
            value={input.fegli.optionC ? fmt.currencyWhole(result.fegli.currentCoverage.optionC) : 'Not Elected'}
          />
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Election Details</Text>
          <SRow label="Basic Coverage" value={input.fegli.basicCoverage ? 'Yes' : 'No'} />
          <SRow label="Option A" value={input.fegli.optionA ? 'Yes' : 'No'} />
          <SRow label="Option B Multiple" value={`${input.fegli.optionBMultiple}x`} />
          <SRow label="Option C Multiple" value={`${input.fegli.optionCMultiple}x`} />
          <SRow label="Post-Retirement Reduction" value={input.fegli.postRetirementReduction.replace(/_/g, ' ')} />
        </View>

        <Text style={styles.disclaimer}>
          Note: Basic insurance coverage reduces by 75% after age 65 unless you
          elect a different reduction schedule. Option B coverage reduces by 2%
          per month starting at age 65 unless continued at your own cost.
          Premiums shown are estimates and subject to change.
        </Text>
      </WPage>

      {/* ============================================================
          X. FEGLI COST OVER TIME
          ============================================================ */}
      <WPage sectionTitle="FEGLI Cost Projections">
        <Text style={styles.sectionTitle}>FEGLI Cost Over Time</Text>
        <Text style={styles.sectionSubtitle}>
          Year-by-year FEGLI premium and coverage projections
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.5, align: 'left' },
            { header: 'Age', width: 0.35 },
            { header: 'Basic', width: 0.7 },
            { header: 'Opt A', width: 0.7 },
            { header: 'Opt B', width: 0.7 },
            { header: 'Opt C', width: 0.7 },
            { header: 'Total Cost', width: 0.9 },
            { header: 'Total Coverage', width: 1 },
          ]}
          rows={result.fegli.costProjections.slice(0, projectionYears).map(
            (f: FegliCostYear) => [
              String(f.year),
              String(f.age),
              fmt.currency(f.basicCost),
              fmt.currency(f.optionACost),
              fmt.currency(f.optionBCost),
              fmt.currency(f.optionCCost),
              fmt.currency(f.totalCost),
              fmt.currencyWhole(
                f.basicCoverage + f.optionACoverage + f.optionBCoverage + f.optionCCoverage,
              ),
            ],
          )}
        />
      </WPage>

      {/* ============================================================
          Y. FEHB HEALTH BENEFITS
          ============================================================ */}
      <WPage sectionTitle="FEHB Health Benefits">
        <Text style={styles.sectionTitle}>
          FEHB — Health Benefits Overview
        </Text>
        <Text style={styles.sectionSubtitle}>
          Federal Employees Health Benefits current plan details
        </Text>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Current Plan</Text>
          <SRow label="Plan Name" value={input.fehb.currentPlanName} />
          <SRow label="Enrollment Type" value={input.fehb.enrollment.replace(/_/g, ' ')} />
          <SRow label="Bi-Weekly Premium" value={fmt.currency(input.fehb.biweeklyPremium)} />
          <SRow label="Monthly Premium (Current)" value={fmt.currency(result.fehb.currentMonthlyPremium)} />
          <SRow
            label="Retirement Monthly Premium"
            value={fmt.currency(result.fehb.retirementMonthlyPremium)}
          />
          <SRow label="Assumed Annual Increase" value={fmt.pct(input.fehb.premiumIncreaseRate)} />
        </View>

        <Text style={styles.text}>
          As a federal retiree, you continue FEHB coverage with the government
          paying the same share as active employees. You must have been enrolled
          (or covered as a family member) for the 5 consecutive years of service
          immediately before retirement to continue FEHB into retirement.
        </Text>
      </WPage>

      {/* ============================================================
          Z. FEHB COST PROJECTIONS
          ============================================================ */}
      <WPage sectionTitle="FEHB Cost Projections">
        <Text style={styles.sectionTitle}>FEHB Cost Projections</Text>
        <Text style={styles.sectionSubtitle}>
          Year-by-year FEHB premium projections
        </Text>
        <DataTable
          columns={[
            { header: 'Year', width: 0.5, align: 'left' },
            { header: 'Age', width: 0.4 },
            { header: 'Annual Prem.', width: 1 },
            { header: 'Monthly Prem.', width: 1 },
            { header: 'Gov Share', width: 1 },
            { header: 'Your Share', width: 1 },
          ]}
          rows={result.fehb.projections.slice(0, projectionYears).map(
            (f: FehbProjectionYear) => [
              String(f.year),
              String(f.age),
              fmt.currency(f.annualPremium),
              fmt.currency(f.monthlyPremium),
              fmt.currency(f.governmentShare),
              fmt.currency(f.employeeShare),
            ],
          )}
        />
      </WPage>

      {/* ============================================================
          AA. LONG TERM CARE INSURANCE
          ============================================================ */}
      <WPage sectionTitle="Long Term Care Insurance">
        <Text style={styles.sectionTitle}>Long Term Care Insurance</Text>
        <Text style={styles.sectionSubtitle}>
          Federal Long Term Care Insurance Program (FLTCIP)
        </Text>

        <View style={styles.summaryBox}>
          <SRow label="Enrolled" value={input.ltc.enrolled ? 'Yes' : 'No'} />
          {input.ltc.enrolled && (
            <>
              <SRow label="Monthly Premium" value={fmt.currency(input.ltc.currentPremium)} />
              <SRow label="Annual Premium" value={fmt.currency(input.ltc.currentPremium * 12)} />
              <SRow label="Daily Benefit Amount" value={fmt.currency(input.ltc.dailyBenefitAmount)} />
              <SRow label="Benefit Period" value={`${input.ltc.benefitPeriodYears} years`} />
              <SRow
                label="Maximum Lifetime Benefit"
                value={fmt.currencyWhole(
                  input.ltc.dailyBenefitAmount * 365 * input.ltc.benefitPeriodYears,
                )}
              />
            </>
          )}
        </View>

        {input.ltc.enrolled && (
          <Text style={styles.text}>
            Long-term care insurance helps cover costs of care when you can no
            longer perform everyday activities on your own. Benefits may be used
            for nursing homes, assisted living, home health aides, and adult day
            care. Premiums are subject to increase by the insurance carrier.
          </Text>
        )}

        {!input.ltc.enrolled && (
          <Text style={styles.text}>
            You have not elected Long Term Care Insurance. Consider evaluating
            coverage options, as long-term care costs can significantly impact
            retirement savings. The average annual cost of a private room in a
            nursing facility exceeds $100,000 in many areas.
          </Text>
        )}
      </WPage>

      {/* ============================================================
          AB. INPUT DATA SUMMARY
          ============================================================ */}
      <WPage sectionTitle="Input Data Summary">
        <Text style={styles.sectionTitle}>Input Data Summary</Text>
        <Text style={styles.sectionSubtitle}>
          All data used to generate this report
        </Text>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Personal Information</Text>
          <SRow label="Full Name" value={input.personal.fullName} />
          <SRow label="Date of Birth" value={fmt.date(input.personal.dateOfBirth)} />
          <SRow label="Address" value={input.personal.address} />
          <SRow label="Marital Status" value={input.personal.maritalStatus} />
          {input.personal.spouseDateOfBirth && (
            <SRow label="Spouse DOB" value={fmt.date(input.personal.spouseDateOfBirth)} />
          )}
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Employment</Text>
          <SRow label="Retirement System" value={input.employment.retirementSystem.replace(/_/g, ' ')} />
          <SRow label="Employee Type" value={input.employment.employeeType} />
          <SRow label="SCD" value={fmt.date(input.employment.serviceComputationDate)} />
          <SRow label="Current Annual Salary" value={fmt.currency(input.employment.currentAnnualSalary)} />
          <SRow label="Annual Salary Increase" value={fmt.pct(input.employment.annualSalaryIncreaseRate)} />
          <SRow
            label="Creditable Service"
            value={fmt.yrsmos(input.employment.creditableServiceYears, input.employment.creditableServiceMonths)}
          />
          <SRow label="Sick Leave Hours" value={String(input.employment.sickLeaveHours)} />
          <SRow label="Planned Retirement" value={fmt.date(input.employment.plannedRetirementDate)} />
          {input.employment.csrsServiceYears != null && (
            <SRow
              label="CSRS Service"
              value={fmt.yrsmos(input.employment.csrsServiceYears, input.employment.csrsServiceMonths ?? 0)}
            />
          )}
          {input.employment.fersServiceYears != null && (
            <SRow
              label="FERS Service"
              value={fmt.yrsmos(input.employment.fersServiceYears, input.employment.fersServiceMonths ?? 0)}
            />
          )}
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Tax Information</Text>
          <SRow label="Filing Status" value={input.tax.filingStatus.replace(/_/g, ' ')} />
          <SRow label="Federal Tax Rate" value={fmt.pct(input.tax.federalTaxRate)} />
          <SRow label="State of Residence" value={input.tax.stateOfResidence} />
          <SRow label="State Tax Rate" value={fmt.pct(input.tax.stateTaxRate)} />
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Other Income Sources (Annual)</Text>
          <SRow label="Other Pensions" value={fmt.currency(input.otherIncome.otherPensions)} />
          <SRow label="Spouse Income" value={fmt.currency(input.otherIncome.spouseIncome)} />
          <SRow label="Rental Income" value={fmt.currency(input.otherIncome.rentalIncome)} />
          <SRow label="Investment Income" value={fmt.currency(input.otherIncome.investmentIncome)} />
          <SRow label="Other Taxable" value={fmt.currency(input.otherIncome.otherTaxableIncome)} />
          <SRow label="Other Non-Taxable" value={fmt.currency(input.otherIncome.otherNonTaxableIncome)} />
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Monthly Expenses</Text>
          <SRow label="Housing" value={fmt.currency(input.expenses.housing)} />
          <SRow label="Utilities" value={fmt.currency(input.expenses.utilities)} />
          <SRow label="Transportation" value={fmt.currency(input.expenses.transportation)} />
          <SRow label="Food" value={fmt.currency(input.expenses.food)} />
          <SRow label="Healthcare (OOP)" value={fmt.currency(input.expenses.healthcareOutOfPocket)} />
          <SRow label="Insurance" value={fmt.currency(input.expenses.insurance)} />
          <SRow label="Debt Payments" value={fmt.currency(input.expenses.debtPayments)} />
          <SRow label="Entertainment" value={fmt.currency(input.expenses.entertainment)} />
          <SRow label="Travel" value={fmt.currency(input.expenses.travel)} />
          <SRow label="Charitable Giving" value={fmt.currency(input.expenses.charitableGiving)} />
          <SRow label="Other" value={fmt.currency(input.expenses.other)} />
          <View style={styles.divider} />
          <SRow
            label="Total Monthly Expenses"
            value={fmt.currency(
              input.expenses.housing +
              input.expenses.utilities +
              input.expenses.transportation +
              input.expenses.food +
              input.expenses.healthcareOutOfPocket +
              input.expenses.insurance +
              input.expenses.debtPayments +
              input.expenses.entertainment +
              input.expenses.travel +
              input.expenses.charitableGiving +
              input.expenses.other,
            )}
            bold
          />
        </View>

        {input.military.hasMilitaryService && (
          <View style={styles.summaryBox}>
            <Text style={styles.subtitle}>Military Service</Text>
            <SRow label="Branch" value={input.military.branch} />
            <SRow label="Active Duty Start" value={fmt.date(input.military.activeDutyStartDate)} />
            <SRow label="Active Duty End" value={fmt.date(input.military.activeDutyEndDate)} />
            <SRow label="Deposit Paid" value={input.military.depositPaid ? 'Yes' : 'No'} />
            {!input.military.depositPaid && (
              <SRow label="Deposit Owed" value={fmt.currency(input.military.depositAmountOwed)} />
            )}
          </View>
        )}

        {(input.deposits.hasNonDeductionService || input.deposits.hasRefundedService) && (
          <View style={styles.summaryBox}>
            <Text style={styles.subtitle}>Service Credit Deposits</Text>
            {input.deposits.hasNonDeductionService && (
              <SRow label="Non-Deduction Service Deposit" value={fmt.currency(input.deposits.depositOwed)} />
            )}
            {input.deposits.hasRefundedService && (
              <SRow label="Refunded Service Re-Deposit" value={fmt.currency(input.deposits.reDepositOwed)} />
            )}
          </View>
        )}
      </WPage>

      {/* ============================================================
          AC. RETIREMENT ELIGIBILITY
          ============================================================ */}
      <WPage sectionTitle="Retirement Eligibility">
        <Text style={styles.sectionTitle}>Retirement Eligibility</Text>
        <Text style={styles.sectionSubtitle}>
          All eligible retirement dates based on your service and age
        </Text>

        <View style={styles.summaryBox}>
          <SRow
            label="Earliest Eligible Date"
            value={fmt.date(result.eligibility.earliestEligibleDate)}
            bold
          />
          <SRow
            label="Minimum Retirement Age (MRA)"
            value={String(result.eligibility.mra)}
          />
        </View>

        <DataTable
          columns={[
            { header: 'Type', width: 1.5, align: 'left' },
            { header: 'Date', width: 0.8 },
            { header: 'Age', width: 0.5 },
            { header: 'Service Yrs', width: 0.7 },
            { header: 'Eligible', width: 0.6 },
          ]}
          rows={result.eligibility.eligibilityDates.map((e: EligibilityDate) => [
            e.description,
            fmt.date(e.date),
            String(e.age),
            String(e.serviceYears),
            e.eligible ? 'YES' : 'No',
          ])}
        />

        {result.mraPlus10.applies && (
          <View style={[styles.summaryBox, { marginTop: 12 }]}>
            <Text style={styles.subtitle}>MRA+10 Early Retirement</Text>
            <Text style={styles.text}>
              You may be eligible for an MRA+10 early retirement. This allows
              retirement at your Minimum Retirement Age with at least 10 years
              of service, but with a reduced annuity.
            </Text>
            <SRow
              label="Penalty"
              value={`${fmt.num(result.mraPlus10.penaltyPercent)}% (5% per year under 62)`}
            />
            <SRow label="Months Under 62" value={String(result.mraPlus10.monthsUnder62)} />
            <SRow
              label="Reduced Annual Annuity"
              value={fmt.currency(result.mraPlus10.reducedAnnuity)}
              bold
            />
          </View>
        )}
      </WPage>

      {/* ============================================================
          AD. CREDITABLE SERVICE DETAIL
          ============================================================ */}
      <WPage sectionTitle="Creditable Service Detail">
        <Text style={styles.sectionTitle}>Creditable Service Detail</Text>
        <Text style={styles.sectionSubtitle}>
          Breakdown of your total creditable civilian and military service
        </Text>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Service Computation</Text>
          <SRow label="Service Computation Date" value={fmt.date(input.employment.serviceComputationDate)} />
          <SRow
            label="Civilian Service"
            value={fmt.yrsmos(input.employment.creditableServiceYears, input.employment.creditableServiceMonths)}
          />
          <SRow
            label="Sick Leave Credit"
            value={`${fmt.num(result.annuity.sickLeaveCredit)} years (${input.employment.sickLeaveHours} hours)`}
          />
          {input.employment.retirementSystem === 'FERS_TRANSFER' && (
            <>
              <SRow
                label="CSRS Service"
                value={fmt.yrsmos(input.employment.csrsServiceYears ?? 0, input.employment.csrsServiceMonths ?? 0)}
              />
              <SRow
                label="FERS Service"
                value={fmt.yrsmos(input.employment.fersServiceYears ?? 0, input.employment.fersServiceMonths ?? 0)}
              />
            </>
          )}
          {input.military.hasMilitaryService && (
            <SRow
              label="Military Service"
              value={`${input.military.branch} (${fmt.date(input.military.activeDutyStartDate)} - ${fmt.date(input.military.activeDutyEndDate)})`}
            />
          )}
          <View style={styles.divider} />
          <SRow
            label="Total Creditable Service"
            value={fmt.yrsmos(result.annuity.totalServiceYears, result.annuity.totalServiceMonths)}
            bold
          />
        </View>

        {(input.deposits.hasNonDeductionService || input.deposits.hasRefundedService) && (
          <View style={styles.summaryBox}>
            <Text style={styles.subtitle}>Deposits & Re-Deposits</Text>
            {input.deposits.hasNonDeductionService && (
              <>
                <SRow label="Non-Deduction Service" value="Yes" />
                <SRow label="Deposit Owed" value={fmt.currency(input.deposits.depositOwed)} />
              </>
            )}
            {input.deposits.hasRefundedService && (
              <>
                <SRow label="Refunded Service" value="Yes" />
                <SRow label="Re-Deposit Owed" value={fmt.currency(input.deposits.reDepositOwed)} />
              </>
            )}
            <Text style={[styles.textSmall, styles.italic, { marginTop: 6 }]}>
              Unpaid deposits may reduce your annuity or cause service to not be
              credited. Contact your human resources office for payment options.
            </Text>
          </View>
        )}

        {input.military.hasMilitaryService && !input.military.depositPaid && (
          <View style={styles.summaryBox}>
            <Text style={styles.subtitle}>Military Service Deposit</Text>
            <Text style={styles.text}>
              You have indicated military service with an unpaid deposit of{' '}
              {fmt.currency(input.military.depositAmountOwed)}. If this deposit
              is not paid, your military service time may not be credited toward
              your civilian retirement annuity, and there may be an impact on
              Social Security benefits.
            </Text>
          </View>
        )}
      </WPage>

      {/* ============================================================
          AE. HIGH-3 AVERAGE SALARY DETAIL
          ============================================================ */}
      <WPage sectionTitle="High-3 Average Salary">
        <Text style={styles.sectionTitle}>High-3 Average Salary Detail</Text>
        <Text style={styles.sectionSubtitle}>
          Your highest three consecutive years of basic pay
        </Text>

        <MetricBox label="High-3 Average" value={fmt.currency(result.annuity.high3Average)} />

        <DataTable
          columns={[
            { header: 'Year', width: 0.6, align: 'left' },
            { header: 'Annual Salary', width: 1.4 },
            { header: 'In High-3', width: 0.8 },
          ]}
          rows={result.high3Detail.map((h: High3Detail) => [
            String(h.year),
            fmt.currency(h.salary),
            h.inHigh3 ? 'YES' : '',
          ])}
        />

        <Text style={styles.text}>
          The High-3 average salary is calculated using the highest three
          consecutive years of basic pay. This typically includes your base pay
          and locality pay, but does not include overtime, bonuses, or other
          premium pay. The years marked &quot;YES&quot; above are the three used in
          your computation.
        </Text>

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Annuity Formula</Text>
          <Text style={styles.text}>
            {input.employment.retirementSystem === 'FERS' || input.employment.retirementSystem === 'FERS_TRANSFER'
              ? 'FERS: 1% (or 1.1% if age 62+ with 20+ years) x High-3 x Years of Service'
              : 'CSRS: 1.5% x first 5 years + 1.75% x next 5 years + 2% x remaining years, applied to High-3'}
          </Text>
          <SRow label="High-3 Average" value={fmt.currency(result.annuity.high3Average)} />
          <SRow
            label="Total Service (incl. sick leave)"
            value={`${fmt.num(result.annuity.totalServiceYears + result.annuity.totalServiceMonths / 12 + result.annuity.sickLeaveCredit)} years`}
          />
          <SRow label="Multiplier" value={fmt.pct(result.annuity.multiplier)} />
          <View style={styles.divider} />
          <SRow label="Computed Annual Annuity" value={fmt.currency(result.annuity.annualAnnuity)} bold />
        </View>
      </WPage>
    </Document>
  );
};

export default FederalRetirementReport;
