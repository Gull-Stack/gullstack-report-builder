"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Loader2,
  FileText,
  DollarSign,
  Calendar,
  TrendingUp,
  Shield,
  Heart,
  PiggyBank,
  BarChart3,
} from "lucide-react";
import { loadReport } from "@/lib/store";
import type { SavedReport } from "@/lib/types";
import { Button } from "@/components/ui/button";

// Dynamically import PDF components (they need browser APIs)
const PDFDownloadButton = dynamic(
  () => import("@/components/report/PDFDownloadButton"),
  { ssr: false }
);

function fmt(v: number): string {
  if (v == null || isNaN(v)) return "$0";
  const neg = v < 0;
  const abs = Math.abs(v);
  const s = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return neg ? `($${s})` : `$${s}`;
}

function fmtWhole(v: number): string {
  if (v == null || isNaN(v)) return "$0";
  return `$${Math.round(v).toLocaleString("en-US")}`;
}

function pct(v: number): string {
  if (v == null || isNaN(v)) return "0%";
  return `${(v * 100).toFixed(1)}%`;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

function MetricCard({ icon, label, value, sub }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-[#1E2D45] bg-[#0A1628] p-5">
      <div className="mb-2 flex items-center gap-2 text-[#C9A84C]">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
    </div>
  );
}

export default function ReportViewPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<SavedReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    const loaded = loadReport(id);
    setReport(loaded);
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-slate-400">Report not found.</p>
        <Link href="/">
          <Button variant="outline" className="border-[#1E2D45]">
            <ArrowLeft className="mr-2 size-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const { input, result } = report;
  const r = result;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/"
            className="mb-2 inline-flex items-center text-sm text-slate-400 hover:text-[#C9A84C]"
          >
            <ArrowLeft className="mr-1 size-3.5" /> Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">
            {report.clientName}
          </h1>
          <p className="text-sm text-slate-400">
            {input.employment.retirementSystem.replace(/_/g, " ")} •{" "}
            Retirement:{" "}
            {new Date(input.employment.plannedRetirementDate).toLocaleDateString()}
          </p>
        </div>
        <PDFDownloadButton input={input} result={result} />
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<DollarSign className="size-5" />}
          label="Annual Annuity"
          value={fmt(r.annuity.annualAnnuity)}
          sub={`${fmt(r.annuity.monthlyAnnuity)}/mo`}
        />
        <MetricCard
          icon={<PiggyBank className="size-5" />}
          label="TSP at Retirement"
          value={fmtWhole(r.tsp.totalAtRetirement)}
          sub={`${fmt(r.tsp.monthlyWithdrawal)}/mo withdrawal`}
        />
        <MetricCard
          icon={<TrendingUp className="size-5" />}
          label="Income Replacement"
          value={pct(r.incomeComparison.replacementRatio)}
          sub={`${fmt(r.incomeComparison.monthlyDifference)}/mo difference`}
        />
        <MetricCard
          icon={<Shield className="size-5" />}
          label="FEGLI Coverage"
          value={fmtWhole(r.fegli.currentCoverage.total)}
          sub={`${fmt(r.fegli.currentMonthlyCost)}/mo premium`}
        />
      </div>

      {/* Detail Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Annuity Detail */}
        <Section title="Annuity Computation" icon={<FileText className="size-5" />}>
          <Row label="High-3 Average Salary" value={fmt(r.annuity.high3Average)} />
          <Row
            label="Creditable Service"
            value={`${r.annuity.totalServiceYears} yrs, ${r.annuity.totalServiceMonths} mos`}
          />
          <Row
            label="Sick Leave Credit"
            value={`${r.annuity.sickLeaveCredit.toFixed(2)} years`}
          />
          <Row label="Multiplier" value={pct(r.annuity.multiplier)} />
          {r.annuity.csrsComponent != null && (
            <Row label="CSRS Component" value={fmt(r.annuity.csrsComponent)} />
          )}
          {r.annuity.fersComponent != null && (
            <Row label="FERS Component" value={fmt(r.annuity.fersComponent)} />
          )}
          <Divider />
          <Row label="Annual Annuity" value={fmt(r.annuity.annualAnnuity)} bold />
          <Row label="Monthly Annuity" value={fmt(r.annuity.monthlyAnnuity)} bold />
        </Section>

        {/* Survivor Benefit */}
        <Section title="Survivor Benefit" icon={<Heart className="size-5" />}>
          <Row
            label="Election"
            value={r.survivorBenefit.election.replace(/_/g, " ")}
          />
          <Row label="Annual Cost" value={fmt(r.survivorBenefit.annualCost)} />
          <Row label="Monthly Cost" value={fmt(r.survivorBenefit.monthlyCost)} />
          <Divider />
          <Row
            label="Survivor Annual Benefit"
            value={fmt(r.survivorBenefit.survivorAnnualBenefit)}
            bold
          />
          <Row
            label="Survivor Monthly Benefit"
            value={fmt(r.survivorBenefit.survivorMonthlyBenefit)}
            bold
          />
        </Section>

        {/* FERS Supplement */}
        <Section title="FERS Supplement" icon={<Calendar className="size-5" />}>
          <Row label="Eligible" value={r.fersSupplement.eligible ? "Yes" : "No"} />
          {r.fersSupplement.eligible && (
            <>
              <Row
                label="Monthly Amount"
                value={fmt(r.fersSupplement.monthlyAmount)}
                bold
              />
              <Row
                label="Annual Amount"
                value={fmt(r.fersSupplement.annualAmount)}
              />
              <Row
                label="Start"
                value={new Date(r.fersSupplement.startDate).toLocaleDateString()}
              />
              <Row
                label="End (age 62)"
                value={new Date(r.fersSupplement.endDate).toLocaleDateString()}
              />
            </>
          )}
        </Section>

        {/* Social Security */}
        <Section title="Social Security" icon={<BarChart3 className="size-5" />}>
          <Row label="Start Age" value={String(r.socialSecurity.startAge)} />
          <Row label="Full Retirement Age" value={String(r.socialSecurity.fullRetirementAge)} />
          <Row
            label="Monthly at Start Age"
            value={fmt(r.socialSecurity.monthlyBenefitAtStartAge)}
            bold
          />
          <Row
            label="Annual at Start Age"
            value={fmt(r.socialSecurity.annualBenefitAtStartAge)}
          />
        </Section>

        {/* Income Comparison */}
        <Section title="Last Paycheck" icon={<DollarSign className="size-5" />}>
          <Row
            label="Gross Monthly"
            value={fmt(r.incomeComparison.lastPaycheck.grossMonthly)}
          />
          <Row
            label="Retirement Contrib."
            value={`-${fmt(r.incomeComparison.lastPaycheck.retirementContribution)}`}
          />
          <Row
            label="TSP Contrib."
            value={`-${fmt(r.incomeComparison.lastPaycheck.tspContribution)}`}
          />
          <Row
            label="FICA/Medicare"
            value={`-${fmt(r.incomeComparison.lastPaycheck.ficaMedicare)}`}
          />
          <Row
            label="Federal Tax"
            value={`-${fmt(r.incomeComparison.lastPaycheck.federalTax)}`}
          />
          <Row
            label="State Tax"
            value={`-${fmt(r.incomeComparison.lastPaycheck.stateTax)}`}
          />
          <Divider />
          <Row
            label="Net Monthly Pay"
            value={fmt(r.incomeComparison.lastPaycheck.netMonthly)}
            bold
          />
        </Section>

        <Section
          title="First Retirement Check"
          icon={<TrendingUp className="size-5" />}
        >
          <Row
            label="Gross Annuity (mo)"
            value={fmt(r.incomeComparison.firstRetirementCheck.grossAnnuity)}
          />
          <Row
            label="Survivor Cost"
            value={`-${fmt(r.incomeComparison.firstRetirementCheck.survivorBenefitCost)}`}
          />
          <Row
            label="Federal Tax"
            value={`-${fmt(r.incomeComparison.firstRetirementCheck.federalTax)}`}
          />
          <Row
            label="FERS Supplement"
            value={`+${fmt(r.incomeComparison.firstRetirementCheck.fersSupplement)}`}
          />
          <Row
            label="Social Security"
            value={`+${fmt(r.incomeComparison.firstRetirementCheck.socialSecurity)}`}
          />
          <Row
            label="TSP Withdrawal"
            value={`+${fmt(r.incomeComparison.firstRetirementCheck.tspWithdrawal)}`}
          />
          <Divider />
          <Row
            label="Net Monthly Income"
            value={fmt(r.incomeComparison.firstRetirementCheck.netMonthly)}
            bold
          />
        </Section>

        {/* Retirement Eligibility */}
        <Section
          title="Retirement Eligibility"
          icon={<Calendar className="size-5" />}
        >
          <Row
            label="Earliest Eligible Date"
            value={
              r.eligibility.earliestEligibleDate
                ? new Date(r.eligibility.earliestEligibleDate).toLocaleDateString()
                : "N/A"
            }
            bold
          />
          <Row label="MRA" value={String(r.eligibility.mra)} />
          <Divider />
          {r.eligibility.eligibilityDates.map((e, i) => (
            <Row
              key={i}
              label={e.description}
              value={e.eligible ? `✓ ${new Date(e.date).toLocaleDateString()}` : "Not yet eligible"}
            />
          ))}
        </Section>

        {/* MRA+10 */}
        {r.mraPlus10.applies && (
          <Section title="MRA+10 Penalty" icon={<Shield className="size-5" />}>
            <Row
              label="Penalty"
              value={`${r.mraPlus10.penaltyPercent.toFixed(2)}%`}
            />
            <Row
              label="Months Under 62"
              value={String(r.mraPlus10.monthsUnder62)}
            />
            <Row
              label="Reduced Annual Annuity"
              value={fmt(r.mraPlus10.reducedAnnuity)}
              bold
            />
          </Section>
        )}

        {/* Proposed vs Delayed */}
        <Section title="Proposed vs Delayed" icon={<TrendingUp className="size-5" />}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#C9A84C]">
            Proposed
          </p>
          <Row
            label={`Age ${r.proposedRetirement.age} — ${new Date(r.proposedRetirement.date).toLocaleDateString()}`}
            value={fmt(r.proposedRetirement.annualAnnuity)}
          />
          <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wider text-[#C9A84C]">
            Delayed (+1 Year)
          </p>
          <Row
            label={`Age ${r.delayedRetirement.age} — ${new Date(r.delayedRetirement.date).toLocaleDateString()}`}
            value={fmt(r.delayedRetirement.annualAnnuity)}
          />
          <Divider />
          <Row
            label="Annual Difference"
            value={fmt(
              r.delayedRetirement.annualAnnuity - r.proposedRetirement.annualAnnuity
            )}
            bold
          />
        </Section>
      </div>

      {/* Download reminder */}
      <div className="mt-10 rounded-xl border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-6 text-center">
        <p className="mb-3 text-lg font-semibold text-white">
          Download the full 50+ page PDF report
        </p>
        <p className="mb-4 text-sm text-slate-400">
          Includes year-by-year projections, COLA tables, TSP growth, FEGLI cost
          analysis, FEHB projections, and complete input data summary.
        </p>
        <PDFDownloadButton input={input} result={result} />
      </div>
    </div>
  );
}

// --- Helper sub-components ---

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#1E2D45] bg-[#0A1628] p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[#C9A84C]">{icon}</span>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={bold ? "font-semibold text-white" : "text-slate-200"}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="my-2 border-t border-[#1E2D45]" />;
}
