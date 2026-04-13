"use client";

import type { ReportInput } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface StepProps {
  data: ReportInput;
  updateData: (section: keyof ReportInput, values: any) => void;
}

export default function LtcStep({ data, updateData }: StepProps) {
  const l = data.ltc;
  const update = (field: string, value: any) => {
    updateData("ltc", { ...l, [field]: value });
  };

  return (
    <Card className="border-[#1E2D45] bg-[#0F1D32]">
      <CardHeader>
        <CardTitle className="text-[#C9A84C]">Long-Term Care (LTC) Insurance</CardTitle>
        <CardDescription>
          Federal Long Term Care Insurance Program (FLTCIP) details if enrolled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={l.enrolled}
            onCheckedChange={(checked) => update("enrolled", !!checked)}
          />
          <div>
            <Label className="cursor-pointer">Enrolled in FLTCIP</Label>
            <p className="text-xs text-muted-foreground">
              Check if you currently have long-term care insurance through the federal program.
            </p>
          </div>
        </div>

        {l.enrolled && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ltcPremium">Monthly Premium ($)</Label>
              <Input
                id="ltcPremium"
                type="number"
                min={0}
                step={10}
                value={l.currentPremium || ""}
                onChange={(e) => update("currentPremium", Number(e.target.value))}
                placeholder="150"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyBenefit">Daily Benefit Amount ($)</Label>
              <Input
                id="dailyBenefit"
                type="number"
                min={0}
                step={25}
                value={l.dailyBenefitAmount || ""}
                onChange={(e) => update("dailyBenefitAmount", Number(e.target.value))}
                placeholder="200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefitYears">Benefit Period (Years)</Label>
              <Input
                id="benefitYears"
                type="number"
                min={1}
                max={10}
                value={l.benefitPeriodYears || ""}
                onChange={(e) => update("benefitPeriodYears", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Typical options: 2, 3, 5 years, or unlimited.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
