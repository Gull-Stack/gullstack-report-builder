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

const reductionOptions = [
  { value: "NO_REDUCTION", label: "No Reduction (highest cost)" },
  { value: "75_PERCENT", label: "75% Reduction" },
  { value: "50_PERCENT", label: "50% Reduction" },
  { value: "25_PERCENT", label: "25% Reduction" },
  { value: "ZERO", label: "Full Reduction to $0 (no post-retirement coverage)" },
];

export default function FegliStep({ data, updateData }: StepProps) {
  const f = data.fegli;
  const update = (field: string, value: any) => {
    updateData("fegli", { ...f, [field]: value });
  };

  return (
    <Card className="border-[#1E2D45] bg-[#0F1D32]">
      <CardHeader>
        <CardTitle className="text-[#C9A84C]">
          Federal Employees Group Life Insurance (FEGLI)
        </CardTitle>
        <CardDescription>
          Select your current coverage options. FEGLI premiums increase with age after retirement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={f.basicCoverage}
              onCheckedChange={(checked) => update("basicCoverage", !!checked)}
            />
            <div>
              <Label className="cursor-pointer">Basic Coverage</Label>
              <p className="text-xs text-muted-foreground">
                Equal to your annual salary rounded up to the nearest $1,000, plus $2,000.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              checked={f.optionA}
              onCheckedChange={(checked) => update("optionA", !!checked)}
            />
            <div>
              <Label className="cursor-pointer">Option A &mdash; Standard</Label>
              <p className="text-xs text-muted-foreground">
                Additional $10,000 of coverage.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              checked={f.optionB}
              onCheckedChange={(checked) => update("optionB", !!checked)}
            />
            <div className="flex-1 space-y-2">
              <Label className="cursor-pointer">Option B &mdash; Additional</Label>
              <p className="text-xs text-muted-foreground">
                1 to 5 multiples of your annual salary.
              </p>
              {f.optionB && (
                <div className="mt-2 w-32">
                  <Label htmlFor="optBMult">Multiple (1-5)</Label>
                  <Input
                    id="optBMult"
                    type="number"
                    min={1}
                    max={5}
                    value={f.optionBMultiple}
                    onChange={(e) => update("optionBMultiple", Number(e.target.value))}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              checked={f.optionC}
              onCheckedChange={(checked) => update("optionC", !!checked)}
            />
            <div className="flex-1 space-y-2">
              <Label className="cursor-pointer">Option C &mdash; Family</Label>
              <p className="text-xs text-muted-foreground">
                Coverage for spouse ($5,000 per multiple) and children ($2,500 per multiple).
              </p>
              {f.optionC && (
                <div className="mt-2 w-32">
                  <Label htmlFor="optCMult">Multiple (1-5)</Label>
                  <Input
                    id="optCMult"
                    type="number"
                    min={1}
                    max={5}
                    value={f.optionCMultiple}
                    onChange={(e) => update("optionCMultiple", Number(e.target.value))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Post-Retirement Basic Coverage Reduction</Label>
          <Select
            value={f.postRetirementReduction}
            onValueChange={(val) => update("postRetirementReduction", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select reduction schedule" />
            </SelectTrigger>
            <SelectContent>
              {reductionOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Basic coverage reduces by 2% per month after age 65 unless you elect No Reduction. Higher retention means higher premiums.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
