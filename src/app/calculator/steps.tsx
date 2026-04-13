"use client";

import { useFormContext } from "react-hook-form";
import type { ReportInput } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  name,
  type = "text",
  placeholder,
  helpText,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  helpText?: string;
}) {
  const { register, formState } = useFormContext<ReportInput>();
  const error = name.split(".").reduce((obj: any, key) => obj?.[key], formState.errors);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name as any, { valueAsNumber: type === "number" })}
      />
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      {error?.message && (
        <p className="text-xs text-red-500">{String(error.message)}</p>
      )}
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
}) {
  const { setValue, watch } = useFormContext<ReportInput>();
  const value = watch(name as any);
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => setValue(name as any, v, { shouldValidate: true })}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

// ── Step 1: Personal Info ────────────────────────────────────────────────────

export function PersonalStep() {
  const { watch } = useFormContext<ReportInput>();
  const marital = watch("personal.maritalStatus");
  return (
    <div className="space-y-6">
      <SectionTitle>Personal Information</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full Name" name="personal.fullName" placeholder="John A. Smith" />
        <Field label="Date of Birth" name="personal.dateOfBirth" type="date" />
        <Field label="Address" name="personal.address" placeholder="123 Main St, City, ST" />
        <SelectField
          label="Marital Status"
          name="personal.maritalStatus"
          options={[
            { value: "SINGLE", label: "Single" },
            { value: "MARRIED", label: "Married" },
            { value: "DIVORCED", label: "Divorced" },
            { value: "WIDOWED", label: "Widowed" },
          ]}
        />
        {marital === "MARRIED" && (
          <Field label="Spouse Date of Birth" name="personal.spouseDateOfBirth" type="date" />
        )}
      </div>
    </div>
  );
}

// ── Step 2: Employment ───────────────────────────────────────────────────────

export function EmploymentStep() {
  const { watch } = useFormContext<ReportInput>();
  const system = watch("employment.retirementSystem");
  return (
    <div className="space-y-6">
      <SectionTitle>Employment Information</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Service Computation Date" name="employment.serviceComputationDate" type="date" />
        <SelectField
          label="Retirement System"
          name="employment.retirementSystem"
          options={[
            { value: "FERS", label: "FERS" },
            { value: "CSRS", label: "CSRS" },
            { value: "CSRS_OFFSET", label: "CSRS Offset" },
            { value: "FERS_TRANSFER", label: "FERS Transfer" },
          ]}
        />
        <SelectField
          label="Employee Type"
          name="employment.employeeType"
          options={[
            { value: "REGULAR", label: "Regular" },
            { value: "LEO", label: "Law Enforcement Officer" },
            { value: "FIREFIGHTER", label: "Firefighter" },
            { value: "ATC", label: "Air Traffic Controller" },
            { value: "POSTAL", label: "Postal" },
          ]}
        />
        <Field label="Current Annual Salary" name="employment.currentAnnualSalary" type="number" placeholder="85000" />
        <Field label="Annual Salary Increase %" name="employment.annualSalaryIncreaseRate" type="number" placeholder="0.02" helpText="Enter as decimal (e.g., 0.02 for 2%)" />
        <Field label="Creditable Service Years" name="employment.creditableServiceYears" type="number" />
        <Field label="Creditable Service Months" name="employment.creditableServiceMonths" type="number" />
        <Field label="Sick Leave Hours" name="employment.sickLeaveHours" type="number" />
        <Field label="Planned Retirement Date" name="employment.plannedRetirementDate" type="date" />
      </div>
      {system === "FERS_TRANSFER" && (
        <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t">
          <SectionTitle>FERS Transfer Service Split</SectionTitle>
          <div />
          <Field label="CSRS Service Years" name="employment.csrsServiceYears" type="number" />
          <Field label="CSRS Service Months" name="employment.csrsServiceMonths" type="number" />
          <Field label="FERS Service Years" name="employment.fersServiceYears" type="number" />
          <Field label="FERS Service Months" name="employment.fersServiceMonths" type="number" />
        </div>
      )}
    </div>
  );
}

// ── Step 3: TSP ──────────────────────────────────────────────────────────────

export function TspStep() {
  return (
    <div className="space-y-6">
      <SectionTitle>Thrift Savings Plan (TSP)</SectionTitle>
      <p className="text-sm text-muted-foreground">
        Enter your current TSP balances and contribution details. Fund-level
        balances can be entered in the detailed view (coming soon) — for now,
        enter your total expected return rate below.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Annual Traditional Contribution" name="tsp.annualContributionTraditional" type="number" />
        <Field label="Annual Roth Contribution" name="tsp.annualContributionRoth" type="number" />
        <Field label="Government Match %" name="tsp.governmentMatchPercent" type="number" helpText="Max 5% for FERS" />
        <Field label="Catch-Up Contribution (50+)" name="tsp.catchUpContribution" type="number" />
        <Field label="Expected Return Rate" name="tsp.expectedReturnRate" type="number" placeholder="0.07" helpText="Decimal (e.g., 0.07 for 7%)" />
        <Field label="Planned Withdrawal Age" name="tsp.plannedWithdrawalAge" type="number" />
        <SelectField
          label="Withdrawal Method"
          name="tsp.withdrawalMethod"
          options={[
            { value: "LUMP_SUM", label: "Lump Sum" },
            { value: "MONTHLY_PAYMENTS", label: "Monthly Payments" },
            { value: "LIFE_ANNUITY", label: "Life Annuity" },
            { value: "COMBINATION", label: "Combination" },
          ]}
        />
        <Field label="Monthly Withdrawal Amount" name="tsp.monthlyWithdrawalAmount" type="number" helpText="For monthly payment method" />
      </div>
    </div>
  );
}

// ── Step 4: FEGLI ────────────────────────────────────────────────────────────

export function FegliStep() {
  const { watch, setValue } = useFormContext<ReportInput>();
  return (
    <div className="space-y-6">
      <SectionTitle>FEGLI (Life Insurance)</SectionTitle>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="fegli-basic"
            checked={watch("fegli.basicCoverage")}
            onCheckedChange={(v) => setValue("fegli.basicCoverage", !!v)}
          />
          <Label htmlFor="fegli-basic">Basic Coverage (salary + $2,000)</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="fegli-a"
            checked={watch("fegli.optionA")}
            onCheckedChange={(v) => setValue("fegli.optionA", !!v)}
          />
          <Label htmlFor="fegli-a">Option A — Standard ($10,000)</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="fegli-b"
            checked={watch("fegli.optionB")}
            onCheckedChange={(v) => setValue("fegli.optionB", !!v)}
          />
          <Label htmlFor="fegli-b">Option B — Additional (1-5x salary)</Label>
        </div>
        {watch("fegli.optionB") && (
          <Field label="Option B Multiples" name="fegli.optionBMultiple" type="number" />
        )}
        <div className="flex items-center gap-2">
          <Checkbox
            id="fegli-c"
            checked={watch("fegli.optionC")}
            onCheckedChange={(v) => setValue("fegli.optionC", !!v)}
          />
          <Label htmlFor="fegli-c">Option C — Family</Label>
        </div>
        {watch("fegli.optionC") && (
          <Field label="Option C Multiples" name="fegli.optionCMultiple" type="number" />
        )}
        <SelectField
          label="Post-Retirement Basic Reduction"
          name="fegli.postRetirementReduction"
          options={[
            { value: "NO_REDUCTION", label: "No Reduction (pay full cost)" },
            { value: "75_PERCENT", label: "75% Reduction (free after 65)" },
            { value: "50_PERCENT", label: "50% Reduction (free after 65)" },
            { value: "ZERO", label: "Reduce to $0 (free after 65)" },
          ]}
        />
      </div>
    </div>
  );
}

// ── Step 5: FEHB ─────────────────────────────────────────────────────────────

export function FehbStep() {
  return (
    <div className="space-y-6">
      <SectionTitle>FEHB (Health Benefits)</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plan Name" name="fehb.currentPlanName" placeholder="BCBS Standard" />
        <SelectField
          label="Enrollment Type"
          name="fehb.enrollment"
          options={[
            { value: "SELF_ONLY", label: "Self Only" },
            { value: "SELF_PLUS_ONE", label: "Self Plus One" },
            { value: "SELF_AND_FAMILY", label: "Self and Family" },
          ]}
        />
        <Field label="Biweekly Premium" name="fehb.biweeklyPremium" type="number" helpText="Your share (employee portion)" />
        <Field label="Premium Increase Rate" name="fehb.premiumIncreaseRate" type="number" placeholder="0.05" helpText="Decimal (e.g., 0.05 for 5%)" />
      </div>
    </div>
  );
}

// ── Step 6: Social Security ──────────────────────────────────────────────────

export function SocialSecurityStep() {
  return (
    <div className="space-y-6">
      <SectionTitle>Social Security</SectionTitle>
      <p className="text-sm text-muted-foreground">
        Enter your estimated benefits from your SSA statement (ssa.gov).
        CSRS employees may have reduced benefits due to the WEP.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Estimated Monthly Benefit at Age 62" name="socialSecurity.estimatedBenefitAge62" type="number" />
        <Field label="Estimated Monthly Benefit at FRA" name="socialSecurity.estimatedBenefitFRA" type="number" />
        <Field label="Planned Start Age" name="socialSecurity.plannedStartAge" type="number" helpText="62 to 70" />
      </div>
    </div>
  );
}

// ── Step 7: LTC ──────────────────────────────────────────────────────────────

export function LtcStep() {
  const { watch, setValue } = useFormContext<ReportInput>();
  return (
    <div className="space-y-6">
      <SectionTitle>Long Term Care Insurance (FLTCIP)</SectionTitle>
      <div className="flex items-center gap-2">
        <Checkbox
          id="ltc-enrolled"
          checked={watch("ltc.enrolled")}
          onCheckedChange={(v) => setValue("ltc.enrolled", !!v)}
        />
        <Label htmlFor="ltc-enrolled">Enrolled in FLTCIP</Label>
      </div>
      {watch("ltc.enrolled") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Monthly Premium" name="ltc.currentPremium" type="number" />
          <Field label="Daily Benefit Amount" name="ltc.dailyBenefitAmount" type="number" />
          <Field label="Benefit Period (years)" name="ltc.benefitPeriodYears" type="number" />
        </div>
      )}
    </div>
  );
}

// ── Step 8: Other Income ─────────────────────────────────────────────────────

export function OtherIncomeStep() {
  return (
    <div className="space-y-6">
      <SectionTitle>Other Income Sources (Annual)</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Other Pensions" name="otherIncome.otherPensions" type="number" />
        <Field label="Spouse Income" name="otherIncome.spouseIncome" type="number" />
        <Field label="Rental Income" name="otherIncome.rentalIncome" type="number" />
        <Field label="Investment Income" name="otherIncome.investmentIncome" type="number" />
        <Field label="Other Taxable Income" name="otherIncome.otherTaxableIncome" type="number" />
        <Field label="Other Non-Taxable Income" name="otherIncome.otherNonTaxableIncome" type="number" />
      </div>
    </div>
  );
}

// ── Step 9: Expenses ─────────────────────────────────────────────────────────

export function ExpensesStep() {
  return (
    <div className="space-y-6">
      <SectionTitle>Monthly Expenses</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Housing (mortgage/rent)" name="expenses.housing" type="number" />
        <Field label="Utilities" name="expenses.utilities" type="number" />
        <Field label="Transportation" name="expenses.transportation" type="number" />
        <Field label="Food" name="expenses.food" type="number" />
        <Field label="Healthcare (out of pocket)" name="expenses.healthcareOutOfPocket" type="number" />
        <Field label="Insurance (auto, life, etc.)" name="expenses.insurance" type="number" />
        <Field label="Debt Payments" name="expenses.debtPayments" type="number" />
        <Field label="Entertainment" name="expenses.entertainment" type="number" />
        <Field label="Travel" name="expenses.travel" type="number" />
        <Field label="Charitable Giving" name="expenses.charitableGiving" type="number" />
        <Field label="Other" name="expenses.other" type="number" />
      </div>
    </div>
  );
}

// ── Step 10: Tax Info ────────────────────────────────────────────────────────

export function TaxStep() {
  return (
    <div className="space-y-6">
      <SectionTitle>Tax Information</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Filing Status"
          name="tax.filingStatus"
          options={[
            { value: "SINGLE", label: "Single" },
            { value: "MARRIED_FILING_JOINTLY", label: "Married Filing Jointly" },
            { value: "MARRIED_FILING_SEPARATELY", label: "Married Filing Separately" },
            { value: "HEAD_OF_HOUSEHOLD", label: "Head of Household" },
          ]}
        />
        <Field label="Federal Tax Rate" name="tax.federalTaxRate" type="number" placeholder="0.22" helpText="Effective rate (e.g., 0.22)" />
        <Field label="State of Residence" name="tax.stateOfResidence" placeholder="Virginia" />
        <Field label="State Tax Rate" name="tax.stateTaxRate" type="number" placeholder="0.05" helpText="Effective rate (e.g., 0.05)" />
      </div>
    </div>
  );
}

// ── Step 11: Military Service ────────────────────────────────────────────────

export function MilitaryStep() {
  const { watch, setValue } = useFormContext<ReportInput>();
  return (
    <div className="space-y-6">
      <SectionTitle>Military Service</SectionTitle>
      <div className="flex items-center gap-2">
        <Checkbox
          id="mil-service"
          checked={watch("military.hasMilitaryService")}
          onCheckedChange={(v) => setValue("military.hasMilitaryService", !!v)}
        />
        <Label htmlFor="mil-service">I have prior military service</Label>
      </div>
      {watch("military.hasMilitaryService") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Branch"
            name="military.branch"
            options={[
              { value: "Army", label: "Army" },
              { value: "Navy", label: "Navy" },
              { value: "Air Force", label: "Air Force" },
              { value: "Marines", label: "Marines" },
              { value: "Coast Guard", label: "Coast Guard" },
              { value: "Space Force", label: "Space Force" },
            ]}
          />
          <Field label="Active Duty Start" name="military.activeDutyStartDate" type="date" />
          <Field label="Active Duty End" name="military.activeDutyEndDate" type="date" />
          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox
              id="mil-deposit"
              checked={watch("military.depositPaid")}
              onCheckedChange={(v) => setValue("military.depositPaid", !!v)}
            />
            <Label htmlFor="mil-deposit">Military deposit paid</Label>
          </div>
          {!watch("military.depositPaid") && (
            <Field label="Deposit Amount Owed" name="military.depositAmountOwed" type="number" />
          )}
        </div>
      )}
    </div>
  );
}

// ── Step 12: Deposits ────────────────────────────────────────────────────────

export function DepositsStep() {
  const { watch, setValue } = useFormContext<ReportInput>();
  return (
    <div className="space-y-6">
      <SectionTitle>Civilian Deposits & Redeposits</SectionTitle>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="deposit"
            checked={watch("deposits.hasNonDeductionService")}
            onCheckedChange={(v) => setValue("deposits.hasNonDeductionService", !!v)}
          />
          <Label htmlFor="deposit">I have non-deduction service requiring a deposit</Label>
        </div>
        {watch("deposits.hasNonDeductionService") && (
          <Field label="Deposit Amount Owed" name="deposits.depositOwed" type="number" />
        )}
        <div className="flex items-center gap-2">
          <Checkbox
            id="redeposit"
            checked={watch("deposits.hasRefundedService")}
            onCheckedChange={(v) => setValue("deposits.hasRefundedService", !!v)}
          />
          <Label htmlFor="redeposit">I have refunded service requiring a redeposit</Label>
        </div>
        {watch("deposits.hasRefundedService") && (
          <Field label="Redeposit Amount Owed" name="deposits.reDepositOwed" type="number" />
        )}
      </div>
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
        <strong>Note:</strong> Unpaid deposits mean the service period is not creditable
        toward your annuity. Unpaid redeposits result in an actuarial reduction
        to the CSRS component of your annuity.
      </div>
    </div>
  );
}
