"use client";

import { useState } from "react";
import type { CalculationResult, ReportInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Download,
  DollarSign,
  TrendingUp,
  Shield,
  Calendar,
  Heart,
  Building,
  Loader2,
} from "lucide-react";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

interface ResultsViewProps {
  result: CalculationResult;
  input: ReportInput;
  onBack: () => void;
}

export function ResultsView({ result, input, onBack }: ResultsViewProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await fetch("/api/report/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, result }),
      });
      if (!response.ok) throw new Error("PDF generation failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${input.personal.fullName || "Federal"}-Retirement-Report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const { annuity, survivorBenefit, fersSupplement, socialSecurity, tsp, fegli, fehb, incomeComparison, eligibility, mraPlus10, proposedRetirement, delayedRetirement, yearlyProjections } = result;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={onBack} className="mb-2">
              <ArrowLeft className="mr-2 size-4" /> Back to Calculator
            </Button>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Federal Retirement Benefits Report
            </h1>
            <p className="text-sm text-muted-foreground">
              {input.personal.fullName} — {input.employment.retirementSystem} — Retire{" "}
              {input.employment.plannedRetirementDate}
            </p>
          </div>
          <Button onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Download className="mr-2 size-4" />
            )}
            Download PDF Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<DollarSign className="size-5" />}
            title="Monthly Annuity"
            value={fmt(annuity.monthlyAnnuity)}
            subtitle={`${fmt(annuity.annualAnnuity)}/year`}
          />
          <SummaryCard
            icon={<TrendingUp className="size-5" />}
            title="TSP at Retirement"
            value={fmt(tsp.totalAtRetirement)}
            subtitle={`${fmt(tsp.monthlyWithdrawal)}/mo withdrawal`}
          />
          <SummaryCard
            icon={<Shield className="size-5" />}
            title="Replacement Ratio"
            value={fmtPct(incomeComparison.replacementRatio)}
            subtitle={`${fmt(incomeComparison.monthlyDifference)}/mo difference`}
          />
          <SummaryCard
            icon={<Calendar className="size-5" />}
            title="Earliest Eligibility"
            value={eligibility.earliestEligibleDate}
            subtitle={`MRA: ${eligibility.mra.toFixed(1)} years`}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-4 w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="income">Income Comparison</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
            <TabsTrigger value="tsp">TSP</TabsTrigger>
            <TabsTrigger value="insurance">FEGLI / FEHB</TabsTrigger>
            <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Annuity Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="size-5" /> Annuity Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DetailRow label="High-3 Average" value={fmt(annuity.high3Average)} />
                  <DetailRow label="Creditable Service" value={`${annuity.totalServiceYears}y ${annuity.totalServiceMonths}m`} />
                  <DetailRow label="Sick Leave Credit" value={`${annuity.sickLeaveCredit.toFixed(2)} years`} />
                  <DetailRow label="Multiplier" value={fmtPct(annuity.multiplier)} />
                  <Separator />
                  <DetailRow label="Annual Annuity" value={fmt(annuity.annualAnnuity)} bold />
                  <DetailRow label="Monthly Annuity" value={fmt(annuity.monthlyAnnuity)} bold />
                  {annuity.csrsComponent != null && (
                    <>
                      <Separator />
                      <DetailRow label="CSRS Component" value={fmt(annuity.csrsComponent)} />
                      <DetailRow label="FERS Component" value={fmt(annuity.fersComponent ?? 0)} />
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Survivor Benefit */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="size-5" /> Survivor Benefit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DetailRow label="Election" value={survivorBenefit.election.replace("_", " ")} />
                  <DetailRow label="Annual Cost" value={fmt(survivorBenefit.annualCost)} />
                  <DetailRow label="Monthly Cost" value={fmt(survivorBenefit.monthlyCost)} />
                  <Separator />
                  <DetailRow label="Survivor Annual Benefit" value={fmt(survivorBenefit.survivorAnnualBenefit)} bold />
                  <DetailRow label="Survivor Monthly Benefit" value={fmt(survivorBenefit.survivorMonthlyBenefit)} />
                </CardContent>
              </Card>

              {/* FERS Supplement */}
              {fersSupplement.eligible && (
                <Card>
                  <CardHeader>
                    <CardTitle>FERS Supplement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <DetailRow label="Monthly Amount" value={fmt(fersSupplement.monthlyAmount)} bold />
                    <DetailRow label="Annual Amount" value={fmt(fersSupplement.annualAmount)} />
                    <DetailRow label="Start Date" value={fersSupplement.startDate} />
                    <DetailRow label="End Date (age 62)" value={fersSupplement.endDate} />
                  </CardContent>
                </Card>
              )}

              {/* Social Security */}
              <Card>
                <CardHeader>
                  <CardTitle>Social Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DetailRow label="Benefit at Start Age" value={fmt(socialSecurity.monthlyBenefitAtStartAge)} bold />
                  <DetailRow label="Annual Benefit" value={fmt(socialSecurity.annualBenefitAtStartAge)} />
                  <DetailRow label="Start Age" value={String(socialSecurity.startAge)} />
                  <DetailRow label="Full Retirement Age" value={socialSecurity.fullRetirementAge.toFixed(1)} />
                </CardContent>
              </Card>

              {/* Proposed vs Delayed */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Proposed vs. Delayed Retirement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <h3 className="font-semibold">Proposed</h3>
                      <DetailRow label="Date" value={proposedRetirement.date} />
                      <DetailRow label="Age" value={String(proposedRetirement.age)} />
                      <DetailRow label="Monthly" value={fmt(proposedRetirement.monthlyAnnuity)} bold />
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-semibold">Delayed (+2 years)</h3>
                      <DetailRow label="Date" value={delayedRetirement.date} />
                      <DetailRow label="Age" value={String(delayedRetirement.age)} />
                      <DetailRow label="Monthly" value={fmt(delayedRetirement.monthlyAnnuity)} bold />
                    </div>
                  </div>
                  {mraPlus10.applies && (
                    <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                      <strong>MRA+10 Penalty:</strong> {fmtPct(mraPlus10.penaltyPercent)} reduction
                      ({mraPlus10.monthsUnder62} months under 62). Reduced annuity:{" "}
                      {fmt(mraPlus10.reducedAnnuity)}/year
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="income">
            <Card>
              <CardHeader>
                <CardTitle>Last Paycheck vs. First Retirement Check</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-8 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Last Paycheck (Monthly)</h3>
                    <div className="space-y-2">
                      <DetailRow label="Gross Monthly" value={fmt(incomeComparison.lastPaycheck.grossMonthly)} bold />
                      <DetailRow label="Retirement Contribution" value={`-${fmt(incomeComparison.lastPaycheck.retirementContribution)}`} />
                      <DetailRow label="TSP Contribution" value={`-${fmt(incomeComparison.lastPaycheck.tspContribution)}`} />
                      <DetailRow label="FICA/Medicare" value={`-${fmt(incomeComparison.lastPaycheck.ficaMedicare)}`} />
                      <DetailRow label="Federal Tax" value={`-${fmt(incomeComparison.lastPaycheck.federalTax)}`} />
                      <DetailRow label="State Tax" value={`-${fmt(incomeComparison.lastPaycheck.stateTax)}`} />
                      <DetailRow label="FEGLI" value={`-${fmt(incomeComparison.lastPaycheck.fegliPremium)}`} />
                      <DetailRow label="FEHB" value={`-${fmt(incomeComparison.lastPaycheck.fehbPremium)}`} />
                      <Separator />
                      <DetailRow label="Net Monthly" value={fmt(incomeComparison.lastPaycheck.netMonthly)} bold />
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-4 text-lg font-semibold">First Retirement Check (Monthly)</h3>
                    <div className="space-y-2">
                      <DetailRow label="Gross Annuity" value={fmt(incomeComparison.firstRetirementCheck.grossAnnuity)} bold />
                      <DetailRow label="Survivor Cost" value={`-${fmt(incomeComparison.firstRetirementCheck.survivorBenefitCost)}`} />
                      <DetailRow label="Federal Tax" value={`-${fmt(incomeComparison.firstRetirementCheck.federalTax)}`} />
                      <DetailRow label="State Tax" value={`-${fmt(incomeComparison.firstRetirementCheck.stateTax)}`} />
                      <DetailRow label="FEGLI" value={`-${fmt(incomeComparison.firstRetirementCheck.fegliPremium)}`} />
                      <DetailRow label="FEHB" value={`-${fmt(incomeComparison.firstRetirementCheck.fehbPremium)}`} />
                      <DetailRow label="FERS Supplement" value={`+${fmt(incomeComparison.firstRetirementCheck.fersSupplement)}`} />
                      <DetailRow label="Social Security" value={`+${fmt(incomeComparison.firstRetirementCheck.socialSecurity)}`} />
                      <DetailRow label="TSP Withdrawal" value={`+${fmt(incomeComparison.firstRetirementCheck.tspWithdrawal)}`} />
                      <DetailRow label="Other Income" value={`+${fmt(incomeComparison.firstRetirementCheck.otherIncome)}`} />
                      <Separator />
                      <DetailRow label="Net Monthly" value={fmt(incomeComparison.firstRetirementCheck.netMonthly)} bold />
                    </div>
                  </div>
                </div>
                <div className="mt-6 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Monthly Difference</span>
                    <span className={`text-lg font-bold ${incomeComparison.monthlyDifference >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {fmt(incomeComparison.monthlyDifference)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Income Replacement Ratio</span>
                    <span>{fmtPct(incomeComparison.replacementRatio)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projections">
            <Card>
              <CardHeader>
                <CardTitle>30-Year Income & Expense Projections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                        <th className="p-2">Year</th>
                        <th className="p-2">Age</th>
                        <th className="p-2 text-right">Annuity</th>
                        <th className="p-2 text-right">SS</th>
                        <th className="p-2 text-right">TSP</th>
                        <th className="p-2 text-right">Total Income</th>
                        <th className="p-2 text-right">Total Expenses</th>
                        <th className="p-2 text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearlyProjections.map((p) => (
                        <tr key={p.year} className="border-b">
                          <td className="p-2">{p.year}</td>
                          <td className="p-2">{p.age}</td>
                          <td className="p-2 text-right">{fmt(p.annuity)}</td>
                          <td className="p-2 text-right">{fmt(p.socialSecurity)}</td>
                          <td className="p-2 text-right">{fmt(p.tspWithdrawal)}</td>
                          <td className="p-2 text-right font-medium">{fmt(p.totalIncome)}</td>
                          <td className="p-2 text-right">{fmt(p.totalExpenses)}</td>
                          <td className={`p-2 text-right font-medium ${p.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {fmt(p.netIncome)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tsp">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>TSP Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DetailRow label="Total at Retirement" value={fmt(tsp.totalAtRetirement)} bold />
                  <DetailRow label="Traditional" value={fmt(tsp.traditionalAtRetirement)} />
                  <DetailRow label="Roth" value={fmt(tsp.rothAtRetirement)} />
                  <Separator />
                  <DetailRow label="Monthly Withdrawal" value={fmt(tsp.monthlyWithdrawal)} bold />
                  <DetailRow label="Annual Withdrawal" value={fmt(tsp.annualWithdrawal)} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>TSP Growth Projections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white dark:bg-zinc-950">
                        <tr className="border-b text-xs font-medium text-muted-foreground">
                          <th className="p-2 text-left">Year</th>
                          <th className="p-2 text-right">Traditional</th>
                          <th className="p-2 text-right">Roth</th>
                          <th className="p-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tsp.traditionalProjections.map((t, i) => (
                          <tr key={t.year} className="border-b">
                            <td className="p-2">{t.year}</td>
                            <td className="p-2 text-right">{fmt(t.endBalance)}</td>
                            <td className="p-2 text-right">{fmt(tsp.rothProjections[i]?.endBalance ?? 0)}</td>
                            <td className="p-2 text-right font-medium">{fmt(t.endBalance + (tsp.rothProjections[i]?.endBalance ?? 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insurance">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="size-5" /> FEGLI Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DetailRow label="Basic" value={fmt(fegli.currentCoverage.basic)} />
                  <DetailRow label="Option A" value={fmt(fegli.currentCoverage.optionA)} />
                  <DetailRow label="Option B" value={fmt(fegli.currentCoverage.optionB)} />
                  <DetailRow label="Option C" value={fmt(fegli.currentCoverage.optionC)} />
                  <Separator />
                  <DetailRow label="Total Coverage" value={fmt(fegli.currentCoverage.total)} bold />
                  <DetailRow label="Current Monthly Cost" value={fmt(fegli.currentMonthlyCost)} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="size-5" /> FEHB
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DetailRow label="Current Monthly Premium" value={fmt(fehb.currentMonthlyPremium)} />
                  <DetailRow label="Retirement Monthly Premium" value={fmt(fehb.retirementMonthlyPremium)} />
                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    Government continues to pay ~72% of total premium in retirement.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="eligibility">
            <Card>
              <CardHeader>
                <CardTitle>Retirement Eligibility Dates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <DetailRow label="MRA" value={`${eligibility.mra.toFixed(1)} years`} />
                  <DetailRow label="Earliest Eligible" value={eligibility.earliestEligibleDate} bold />
                  <Separator />
                  {eligibility.eligibilityDates.map((d) => (
                    <div key={d.type} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{d.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Date: {d.date} (Age {d.age}, {d.serviceYears}+ years service)
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${d.eligible ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
                        {d.eligible ? "Eligible" : "Not Yet"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            {icon}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-lg font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm ${bold ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
