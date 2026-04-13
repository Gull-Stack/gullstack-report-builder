"use client";

import type { ReportInput } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StepProps {
  data: ReportInput;
  updateData: (section: keyof ReportInput, values: any) => void;
}

const retirementSystems = [
  { value: "FERS", label: "FERS" },
  { value: "CSRS", label: "CSRS" },
  { value: "CSRS_OFFSET", label: "CSRS Offset" },
  { value: "FERS_TRANSFER", label: "FERS Transfer (from CSRS)" },
];

const employeeTypes = [
  { value: "REGULAR", label: "Regular Employee" },
  { value: "LEO", label: "Law Enforcement Officer" },
  { value: "FIREFIGHTER", label: "Firefighter" },
  { value: "ATC", label: "Air Traffic Controller" },
  { value: "POSTAL", label: "Postal Employee" },
];

export default function EmploymentStep({ data, updateData }: StepProps) {
  const e = data.employment;
  const update = (field: string, value: any) => {
    updateData("employment", { ...e, [field]: value });
  };

  const isFersTransfer = e.retirementSystem === "FERS_TRANSFER";

  return (
    <Card className="border-[#1E2D45] bg-[#0F1D32]">
      <CardHeader>
        <CardTitle className="text-[#C9A84C]">Employment Information</CardTitle>
        <CardDescription>
          Federal service details used to calculate your annuity benefit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Retirement System</Label>
            <Select
              value={e.retirementSystem}
              onValueChange={(val) => update("retirementSystem", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select system" />
              </SelectTrigger>
              <SelectContent>
                {retirementSystems.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Employee Type</Label>
            <Select
              value={e.employeeType}
              onValueChange={(val) => update("employeeType", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {employeeTypes.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="scd">Service Computation Date (SCD)</Label>
            <Input
              id="scd"
              type="date"
              value={e.serviceComputationDate}
              onChange={(ev) => update("serviceComputationDate", ev.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Found on your SF-50 or Leave &amp; Earnings Statement.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retireDate">Planned Retirement Date</Label>
            <Input
              id="retireDate"
              type="date"
              value={e.plannedRetirementDate}
              onChange={(ev) => update("plannedRetirementDate", ev.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="salary">Current Annual Salary ($)</Label>
            <Input
              id="salary"
              type="number"
              min={0}
              step={1000}
              value={e.currentAnnualSalary || ""}
              onChange={(ev) => update("currentAnnualSalary", Number(ev.target.value))}
              placeholder="95,000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salaryIncrease">Annual Salary Increase (%)</Label>
            <Input
              id="salaryIncrease"
              type="number"
              min={0}
              max={20}
              step={0.1}
              value={e.annualSalaryIncreaseRate ? (e.annualSalaryIncreaseRate * 100).toFixed(1) : ""}
              onChange={(ev) => update("annualSalaryIncreaseRate", Number(ev.target.value) / 100)}
              placeholder="2.0"
            />
            <p className="text-xs text-muted-foreground">Expected annual raise (e.g., 2.0 for 2%)</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="serviceYrs">Creditable Service (Years)</Label>
            <Input
              id="serviceYrs"
              type="number"
              min={0}
              max={50}
              value={e.creditableServiceYears || ""}
              onChange={(ev) => update("creditableServiceYears", Number(ev.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceMos">Creditable Service (Months)</Label>
            <Input
              id="serviceMos"
              type="number"
              min={0}
              max={11}
              value={e.creditableServiceMonths || ""}
              onChange={(ev) => update("creditableServiceMonths", Number(ev.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sickLeave">Sick Leave Hours</Label>
            <Input
              id="sickLeave"
              type="number"
              min={0}
              value={e.sickLeaveHours || ""}
              onChange={(ev) => update("sickLeaveHours", Number(ev.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Unused sick leave adds to service credit.
            </p>
          </div>
        </div>

        {isFersTransfer && (
          <>
            <div className="rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4">
              <h4 className="mb-3 text-sm font-semibold text-[#C9A84C]">
                FERS Transfer Service Breakdown
              </h4>
              <p className="mb-4 text-xs text-muted-foreground">
                Split your creditable service between CSRS and FERS periods.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="csrsYrs">CSRS Service (Years)</Label>
                  <Input
                    id="csrsYrs"
                    type="number"
                    min={0}
                    value={e.csrsServiceYears || ""}
                    onChange={(ev) => update("csrsServiceYears", Number(ev.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="csrsMos">CSRS Service (Months)</Label>
                  <Input
                    id="csrsMos"
                    type="number"
                    min={0}
                    max={11}
                    value={e.csrsServiceMonths || ""}
                    onChange={(ev) => update("csrsServiceMonths", Number(ev.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fersYrs">FERS Service (Years)</Label>
                  <Input
                    id="fersYrs"
                    type="number"
                    min={0}
                    value={e.fersServiceYears || ""}
                    onChange={(ev) => update("fersServiceYears", Number(ev.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fersMos">FERS Service (Months)</Label>
                  <Input
                    id="fersMos"
                    type="number"
                    min={0}
                    max={11}
                    value={e.fersServiceMonths || ""}
                    onChange={(ev) => update("fersServiceMonths", Number(ev.target.value))}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
