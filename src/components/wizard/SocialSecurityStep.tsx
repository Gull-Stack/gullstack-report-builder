"use client";

import type { ReportInput } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StepProps {
  data: ReportInput;
  updateData: (section: keyof ReportInput, values: any) => void;
}

export default function SocialSecurityStep({ data, updateData }: StepProps) {
  const ss = data.socialSecurity;
  const update = (field: string, value: any) => {
    updateData("socialSecurity", { ...ss, [field]: value });
  };

  return (
    <Card className="border-[#1E2D45] bg-[#0F1D32]">
      <CardHeader>
        <CardTitle className="text-[#C9A84C]">Social Security</CardTitle>
        <CardDescription>
          Enter your estimated Social Security benefits from your SSA statement at ssa.gov/myaccount.
          CSRS employees may not be eligible for Social Security.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ssAge62">Estimated Monthly Benefit at Age 62 ($)</Label>
            <Input
              id="ssAge62"
              type="number"
              min={0}
              step={50}
              value={ss.estimatedBenefitAge62 || ""}
              onChange={(e) => update("estimatedBenefitAge62", Number(e.target.value))}
              placeholder="1,500"
            />
            <p className="text-xs text-muted-foreground">
              Earliest eligibility with reduced benefit.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ssFRA">Estimated Monthly Benefit at Full Retirement Age ($)</Label>
            <Input
              id="ssFRA"
              type="number"
              min={0}
              step={50}
              value={ss.estimatedBenefitFRA || ""}
              onChange={(e) => update("estimatedBenefitFRA", Number(e.target.value))}
              placeholder="2,200"
            />
            <p className="text-xs text-muted-foreground">
              Full benefit amount at your FRA (typically age 67).
            </p>
          </div>
        </div>

        <div className="max-w-xs space-y-2">
          <Label htmlFor="ssStart">Planned Start Age</Label>
          <Input
            id="ssStart"
            type="number"
            min={62}
            max={70}
            value={ss.plannedStartAge || ""}
            onChange={(e) => update("plannedStartAge", Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Benefits increase approximately 8% per year if you delay past your FRA, up to age 70.
          </p>
        </div>

        <div className="rounded-lg border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-[#C9A84C]">Important Notes</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>CSRS employees are generally not covered by Social Security through federal service.</li>
            <li>CSRS Offset employees pay into Social Security; their CSRS annuity is offset at age 62.</li>
            <li>FERS employees pay into Social Security and receive both benefits.</li>
            <li>The Windfall Elimination Provision (WEP) may reduce your Social Security benefit.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
