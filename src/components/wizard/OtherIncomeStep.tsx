"use client";

import type { ReportInput } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StepProps {
  data: ReportInput;
  updateData: (section: keyof ReportInput, values: any) => void;
}

export default function OtherIncomeStep({ data, updateData }: StepProps) {
  const o = data.otherIncome;
  const update = (field: string, value: any) => {
    updateData("otherIncome", { ...o, [field]: value });
  };

  const fields = [
    { key: "otherPensions", label: "Other Pensions (Annual $)", placeholder: "0", hint: "Military pension, state pension, etc." },
    { key: "spouseIncome", label: "Spouse Income (Annual $)", placeholder: "0", hint: "Spouse salary, pension, or Social Security." },
    { key: "rentalIncome", label: "Rental Income (Annual $)", placeholder: "0", hint: "Net rental income after expenses." },
    { key: "investmentIncome", label: "Investment Income (Annual $)", placeholder: "0", hint: "Dividends, interest, capital gains." },
    { key: "otherTaxableIncome", label: "Other Taxable Income (Annual $)", placeholder: "0", hint: "Part-time work, consulting, etc." },
    { key: "otherNonTaxableIncome", label: "Other Non-Taxable Income (Annual $)", placeholder: "0", hint: "VA disability, tax-exempt interest, etc." },
  ];

  return (
    <Card className="border-[#1E2D45] bg-[#0F1D32]">
      <CardHeader>
        <CardTitle className="text-[#C9A84C]">Other Income Sources</CardTitle>
        <CardDescription>
          Additional annual income expected in retirement beyond your federal annuity, TSP, and Social Security.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input
                id={f.key}
                type="number"
                min={0}
                step={500}
                value={(o as any)[f.key] || ""}
                onChange={(e) => update(f.key, Number(e.target.value))}
                placeholder={f.placeholder}
              />
              <p className="text-xs text-muted-foreground">{f.hint}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
