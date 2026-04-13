"use client";

import type { ReportInput } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StepProps {
  data: ReportInput;
  updateData: (section: keyof ReportInput, values: any) => void;
}

const branches = [
  "Army",
  "Navy",
  "Air Force",
  "Marine Corps",
  "Coast Guard",
  "Space Force",
  "National Guard",
  "Reserves",
];

export default function MilitaryStep({ data, updateData }: StepProps) {
  const m = data.military;
  const update = (field: string, value: any) => {
    updateData("military", { ...m, [field]: value });
  };

  return (
    <Card className="border-[#1E2D45] bg-[#0F1D32]">
      <CardHeader>
        <CardTitle className="text-[#C9A84C]">Military Service</CardTitle>
        <CardDescription>
          Prior military service may be creditable toward your civilian retirement if you make a military service deposit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={m.hasMilitaryService}
            onCheckedChange={(checked) => update("hasMilitaryService", !!checked)}
          />
          <div>
            <Label className="cursor-pointer">Prior Military Service</Label>
            <p className="text-xs text-muted-foreground">
              Check if you have active duty military service before your federal civilian career.
            </p>
          </div>
        </div>

        {m.hasMilitaryService && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Branch of Service</Label>
                <Select
                  value={m.branch}
                  onValueChange={(val) => update("branch", val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="milStart">Active Duty Start Date</Label>
                <Input
                  id="milStart"
                  type="date"
                  value={m.activeDutyStartDate}
                  onChange={(e) => update("activeDutyStartDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milEnd">Active Duty End Date</Label>
                <Input
                  id="milEnd"
                  type="date"
                  value={m.activeDutyEndDate}
                  onChange={(e) => update("activeDutyEndDate", e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                checked={m.depositPaid}
                onCheckedChange={(checked) => update("depositPaid", !!checked)}
              />
              <div>
                <Label className="cursor-pointer">Military Deposit Paid</Label>
                <p className="text-xs text-muted-foreground">
                  Have you paid the military service deposit to OPM?
                </p>
              </div>
            </div>

            {!m.depositPaid && (
              <div className="max-w-xs space-y-2">
                <Label htmlFor="milDeposit">Deposit Amount Owed ($)</Label>
                <Input
                  id="milDeposit"
                  type="number"
                  min={0}
                  step={100}
                  value={m.depositAmountOwed || ""}
                  onChange={(e) => update("depositAmountOwed", Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Contact your agency HR or OPM for the exact deposit amount. Interest accrues if unpaid.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
