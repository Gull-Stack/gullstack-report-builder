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

const filingOptions = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED_FILING_JOINTLY", label: "Married Filing Jointly" },
  { value: "MARRIED_FILING_SEPARATELY", label: "Married Filing Separately" },
  { value: "HEAD_OF_HOUSEHOLD", label: "Head of Household" },
];

const states = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

export default function TaxStep({ data, updateData }: StepProps) {
  const t = data.tax;
  const update = (field: string, value: any) => {
    updateData("tax", { ...t, [field]: value });
  };

  return (
    <Card className="border-[#1E2D45] bg-[#0F1D32]">
      <CardHeader>
        <CardTitle className="text-[#C9A84C]">Tax Information</CardTitle>
        <CardDescription>
          Tax assumptions used for net income projections. Use your effective (not marginal) tax rates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Filing Status</Label>
            <Select
              value={t.filingStatus}
              onValueChange={(val) => update("filingStatus", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select filing status" />
              </SelectTrigger>
              <SelectContent>
                {filingOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fedRate">Effective Federal Tax Rate (%)</Label>
            <Input
              id="fedRate"
              type="number"
              min={0}
              max={50}
              step={0.5}
              value={t.federalTaxRate ? (t.federalTaxRate * 100).toFixed(1) : ""}
              onChange={(e) => update("federalTaxRate", Number(e.target.value) / 100)}
              placeholder="22.0"
            />
            <p className="text-xs text-muted-foreground">
              Your estimated effective federal tax rate in retirement.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>State of Residence</Label>
            <Select
              value={t.stateOfResidence}
              onValueChange={(val) => update("stateOfResidence", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stateRate">Effective State Tax Rate (%)</Label>
            <Input
              id="stateRate"
              type="number"
              min={0}
              max={15}
              step={0.25}
              value={t.stateTaxRate ? (t.stateTaxRate * 100).toFixed(2) : ""}
              onChange={(e) => update("stateTaxRate", Number(e.target.value) / 100)}
              placeholder="5.0"
            />
            <p className="text-xs text-muted-foreground">
              Some states exempt federal pensions from state income tax.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
