"use client";

import type { ReportInput } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface StepProps {
  data: ReportInput;
  updateData: (section: keyof ReportInput, values: any) => void;
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-[#C9A84C]">{title}</h4>
      <div className="grid gap-x-8 gap-y-1 text-sm md:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | boolean | undefined }) {
  if (value === undefined || value === null || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{display}</span>
    </div>
  );
}

function Currency({ label, value }: { label: string; value: number | undefined }) {
  if (!value) return null;
  return <Field label={label} value={`$${value.toLocaleString()}`} />;
}

function Percent({ label, value }: { label: string; value: number | undefined }) {
  if (value === undefined || value === null) return null;
  return <Field label={label} value={`${(value * 100).toFixed(1)}%`} />;
}

const retirementSystemLabels: Record<string, string> = {
  FERS: "FERS",
  CSRS: "CSRS",
  CSRS_OFFSET: "CSRS Offset",
  FERS_TRANSFER: "FERS Transfer",
};

const employeeTypeLabels: Record<string, string> = {
  REGULAR: "Regular",
  LEO: "Law Enforcement",
  FIREFIGHTER: "Firefighter",
  ATC: "Air Traffic Controller",
  POSTAL: "Postal",
};

const maritalLabels: Record<string, string> = {
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
};

const filingLabels: Record<string, string> = {
  SINGLE: "Single",
  MARRIED_FILING_JOINTLY: "Married Filing Jointly",
  MARRIED_FILING_SEPARATELY: "Married Filing Separately",
  HEAD_OF_HOUSEHOLD: "Head of Household",
};

const withdrawalLabels: Record<string, string> = {
  LUMP_SUM: "Lump Sum",
  MONTHLY_PAYMENTS: "Monthly Payments",
  LIFE_ANNUITY: "Life Annuity",
  COMBINATION: "Combination",
};

const reductionLabels: Record<string, string> = {
  NO_REDUCTION: "No Reduction",
  "75_PERCENT": "75% Reduction",
  "50_PERCENT": "50% Reduction",
  "25_PERCENT": "25% Reduction",
  ZERO: "Full Reduction to $0",
};

export default function ReviewStep({ data }: StepProps) {
  const { personal: p, employment: e, tsp, fegli, fehb, socialSecurity: ss, ltc, otherIncome: oi, expenses: ex, tax, military: m, deposits: d } = data;

  const tradTotal = tsp.traditionalBalances.reduce((s, b) => s + (b.balance || 0), 0);
  const rothTotal = tsp.rothBalances.reduce((s, b) => s + (b.balance || 0), 0);
  const monthlyExpenses = Object.values(ex).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);

  return (
    <Card className="border-[#1E2D45] bg-[#0F1D32]">
      <CardHeader>
        <CardTitle className="text-[#C9A84C]">Review Your Information</CardTitle>
        <CardDescription>
          Please verify all information before generating your report. Use the Previous button to go back and make corrections.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal */}
        <SectionBlock title="Personal Information">
          <Field label="Full Name" value={p.fullName} />
          <Field label="Date of Birth" value={p.dateOfBirth} />
          <Field label="Address" value={p.address} />
          <Field label="Marital Status" value={maritalLabels[p.maritalStatus]} />
          {p.maritalStatus === "MARRIED" && (
            <Field label="Spouse DOB" value={p.spouseDateOfBirth} />
          )}
        </SectionBlock>

        <Separator />

        {/* Employment */}
        <SectionBlock title="Employment">
          <Field label="Retirement System" value={retirementSystemLabels[e.retirementSystem]} />
          <Field label="Employee Type" value={employeeTypeLabels[e.employeeType]} />
          <Field label="SCD" value={e.serviceComputationDate} />
          <Field label="Planned Retirement" value={e.plannedRetirementDate} />
          <Currency label="Annual Salary" value={e.currentAnnualSalary} />
          <Percent label="Salary Increase Rate" value={e.annualSalaryIncreaseRate} />
          <Field label="Creditable Service" value={`${e.creditableServiceYears}y ${e.creditableServiceMonths}m`} />
          <Field label="Sick Leave Hours" value={e.sickLeaveHours} />
          {e.retirementSystem === "FERS_TRANSFER" && (
            <>
              <Field label="CSRS Service" value={`${e.csrsServiceYears || 0}y ${e.csrsServiceMonths || 0}m`} />
              <Field label="FERS Service" value={`${e.fersServiceYears || 0}y ${e.fersServiceMonths || 0}m`} />
            </>
          )}
        </SectionBlock>

        <Separator />

        {/* TSP */}
        <SectionBlock title="Thrift Savings Plan">
          <Currency label="Traditional Balance" value={tradTotal} />
          <Currency label="Roth Balance" value={rothTotal} />
          <Currency label="Total TSP" value={tradTotal + rothTotal} />
          <Currency label="Annual Traditional Contribution" value={tsp.annualContributionTraditional} />
          <Currency label="Annual Roth Contribution" value={tsp.annualContributionRoth} />
          <Field label="Government Match" value={`${tsp.governmentMatchPercent}%`} />
          <Currency label="Catch-Up Contribution" value={tsp.catchUpContribution} />
          <Percent label="Expected Return Rate" value={tsp.expectedReturnRate} />
          <Field label="Withdrawal Age" value={tsp.plannedWithdrawalAge} />
          <Field label="Withdrawal Method" value={withdrawalLabels[tsp.withdrawalMethod]} />
          {tsp.monthlyWithdrawalAmount ? (
            <Currency label="Monthly Withdrawal" value={tsp.monthlyWithdrawalAmount} />
          ) : null}
        </SectionBlock>

        <Separator />

        {/* FEGLI */}
        <SectionBlock title="FEGLI">
          <Field label="Basic Coverage" value={fegli.basicCoverage} />
          <Field label="Option A" value={fegli.optionA} />
          <Field label="Option B" value={fegli.optionB} />
          {fegli.optionB && <Field label="Option B Multiple" value={`${fegli.optionBMultiple}x`} />}
          <Field label="Option C" value={fegli.optionC} />
          {fegli.optionC && <Field label="Option C Multiple" value={`${fegli.optionCMultiple}x`} />}
          <Field label="Post-Retirement Reduction" value={reductionLabels[fegli.postRetirementReduction]} />
        </SectionBlock>

        <Separator />

        {/* FEHB */}
        <SectionBlock title="FEHB">
          <Field label="Plan" value={fehb.currentPlanName} />
          <Field label="Enrollment" value={fehb.enrollment.replace(/_/g, " ")} />
          <Currency label="Biweekly Premium" value={fehb.biweeklyPremium} />
          <Percent label="Premium Increase Rate" value={fehb.premiumIncreaseRate} />
        </SectionBlock>

        <Separator />

        {/* Social Security */}
        <SectionBlock title="Social Security">
          <Currency label="Benefit at Age 62" value={ss.estimatedBenefitAge62} />
          <Currency label="Benefit at FRA" value={ss.estimatedBenefitFRA} />
          <Field label="Planned Start Age" value={ss.plannedStartAge} />
        </SectionBlock>

        <Separator />

        {/* LTC */}
        <SectionBlock title="Long-Term Care">
          <Field label="Enrolled" value={ltc.enrolled} />
          {ltc.enrolled && (
            <>
              <Currency label="Monthly Premium" value={ltc.currentPremium} />
              <Currency label="Daily Benefit" value={ltc.dailyBenefitAmount} />
              <Field label="Benefit Period" value={`${ltc.benefitPeriodYears} years`} />
            </>
          )}
        </SectionBlock>

        <Separator />

        {/* Other Income */}
        <SectionBlock title="Other Income (Annual)">
          <Currency label="Other Pensions" value={oi.otherPensions} />
          <Currency label="Spouse Income" value={oi.spouseIncome} />
          <Currency label="Rental Income" value={oi.rentalIncome} />
          <Currency label="Investment Income" value={oi.investmentIncome} />
          <Currency label="Other Taxable" value={oi.otherTaxableIncome} />
          <Currency label="Other Non-Taxable" value={oi.otherNonTaxableIncome} />
        </SectionBlock>

        <Separator />

        {/* Expenses */}
        <SectionBlock title="Monthly Expenses">
          <Currency label="Housing" value={ex.housing} />
          <Currency label="Utilities" value={ex.utilities} />
          <Currency label="Transportation" value={ex.transportation} />
          <Currency label="Food" value={ex.food} />
          <Currency label="Healthcare" value={ex.healthcareOutOfPocket} />
          <Currency label="Insurance" value={ex.insurance} />
          <Currency label="Debt Payments" value={ex.debtPayments} />
          <Currency label="Entertainment" value={ex.entertainment} />
          <Currency label="Travel" value={ex.travel} />
          <Currency label="Charitable Giving" value={ex.charitableGiving} />
          <Currency label="Other" value={ex.other} />
        </SectionBlock>
        <div className="flex items-center justify-between rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/5 px-4 py-2">
          <span className="text-sm text-muted-foreground">Total Monthly Expenses</span>
          <Badge variant="outline" className="border-[#C9A84C] text-[#C9A84C]">
            ${monthlyExpenses.toLocaleString()}/mo
          </Badge>
        </div>

        <Separator />

        {/* Tax */}
        <SectionBlock title="Tax Information">
          <Field label="Filing Status" value={filingLabels[tax.filingStatus]} />
          <Percent label="Federal Tax Rate" value={tax.federalTaxRate} />
          <Field label="State" value={tax.stateOfResidence} />
          <Percent label="State Tax Rate" value={tax.stateTaxRate} />
        </SectionBlock>

        <Separator />

        {/* Military */}
        <SectionBlock title="Military Service">
          <Field label="Has Military Service" value={m.hasMilitaryService} />
          {m.hasMilitaryService && (
            <>
              <Field label="Branch" value={m.branch} />
              <Field label="Start Date" value={m.activeDutyStartDate} />
              <Field label="End Date" value={m.activeDutyEndDate} />
              <Field label="Deposit Paid" value={m.depositPaid} />
              {!m.depositPaid && <Currency label="Deposit Owed" value={m.depositAmountOwed} />}
            </>
          )}
        </SectionBlock>

        <Separator />

        {/* Deposits */}
        <SectionBlock title="Service Credit Deposits">
          <Field label="Non-Deduction Service" value={d.hasNonDeductionService} />
          {d.hasNonDeductionService && <Currency label="Deposit Owed" value={d.depositOwed} />}
          <Field label="Refunded Service" value={d.hasRefundedService} />
          {d.hasRefundedService && <Currency label="Re-Deposit Owed" value={d.reDepositOwed} />}
        </SectionBlock>

        {/* Advisor / Assumptions */}
        {(data.advisorName || data.colaAssumption || data.projectionYears) && (
          <>
            <Separator />
            <SectionBlock title="Report Settings">
              {data.advisorName && <Field label="Advisor" value={data.advisorName} />}
              {data.advisorCompany && <Field label="Company" value={data.advisorCompany} />}
              {data.advisorPhone && <Field label="Phone" value={data.advisorPhone} />}
              {data.advisorEmail && <Field label="Email" value={data.advisorEmail} />}
              <Percent label="COLA Assumption" value={data.colaAssumption} />
              <Field label="Projection Years" value={data.projectionYears} />
            </SectionBlock>
          </>
        )}
      </CardContent>
    </Card>
  );
}
