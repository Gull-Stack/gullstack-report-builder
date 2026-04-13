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

const enrollmentOptions = [
  { value: "SELF_ONLY", label: "Self Only" },
  { value: "SELF_PLUS_ONE", label: "Self Plus One" },
  { value: "SELF_AND_FAMILY", label: "Self and Family" },
];

export default function FehbStep({ data, updateData }: StepProps) {
  const h = data.fehb;
  const update = (field: string, value: any) => {
    updateData("fehb", { ...h, [field]: value });
  };

  return (
    <Card className="border-[#1E2D45] bg-[#0F1D32]">
      <CardHeader>
        <CardTitle className="text-[#C9A84C]">
          Federal Employees Health Benefits (FEHB)
        </CardTitle>
        <CardDescription>
          Health insurance plan details. You can keep FEHB into retirement if enrolled for the 5 years immediately before retirement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="planName">Current Plan Name</Label>
            <Input
              id="planName"
              value={h.currentPlanName}
              onChange={(e) => update("currentPlanName", e.target.value)}
              placeholder="e.g., Blue Cross Blue Shield Standard"
            />
          </div>

          <div className="space-y-2">
            <Label>Enrollment Type</Label>
            <Select
              value={h.enrollment}
              onValueChange={(val) => update("enrollment", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select enrollment" />
              </SelectTrigger>
              <SelectContent>
                {enrollmentOptions.map((opt) => (
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
            <Label htmlFor="biweekly">Biweekly Premium ($)</Label>
            <Input
              id="biweekly"
              type="number"
              min={0}
              step={10}
              value={h.biweeklyPremium || ""}
              onChange={(e) => update("biweeklyPremium", Number(e.target.value))}
              placeholder="250"
            />
            <p className="text-xs text-muted-foreground">
              Your employee share from your Leave &amp; Earnings Statement.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="premIncrease">Expected Annual Premium Increase (%)</Label>
            <Input
              id="premIncrease"
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={h.premiumIncreaseRate ? (h.premiumIncreaseRate * 100).toFixed(1) : ""}
              onChange={(e) => update("premiumIncreaseRate", Number(e.target.value) / 100)}
              placeholder="5.0"
            />
            <p className="text-xs text-muted-foreground">
              Historical average is approximately 5% per year.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
