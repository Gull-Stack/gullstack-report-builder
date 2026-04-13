"use client";

import type { ReportInput } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StepProps {
  data: ReportInput;
  updateData: (section: keyof ReportInput, values: any) => void;
}

export default function ExpensesStep({ data, updateData }: StepProps) {
  const ex = data.expenses;
  const update = (field: string, value: any) => {
    updateData("expenses", { ...ex, [field]: value });
  };

  const fields = [
    { key: "housing", label: "Housing (Mortgage/Rent)" },
    { key: "utilities", label: "Utilities" },
    { key: "transportation", label: "Transportation" },
    { key: "food", label: "Food & Groceries" },
    { key: "healthcareOutOfPocket", label: "Healthcare (Out of Pocket)" },
    { key: "insurance", label: "Insurance (Auto, Home, etc.)" },
    { key: "debtPayments", label: "Debt Payments" },
    { key: "entertainment", label: "Entertainment" },
    { key: "travel", label: "Travel" },
    { key: "charitableGiving", label: "Charitable Giving" },
    { key: "other", label: "Other Expenses" },
  ];

  const totalMonthly = Object.values(ex).reduce(
    (sum, val) => sum + (typeof val === "number" ? val : 0),
    0
  );

  return (
    <Card className="border-[#1E2D45] bg-[#0F1D32]">
      <CardHeader>
        <CardTitle className="text-[#C9A84C]">Monthly Expenses</CardTitle>
        <CardDescription>
          Estimated monthly living expenses in retirement. These help determine your income gap or surplus.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label htmlFor={f.key}>{f.label} ($/mo)</Label>
              <Input
                id={f.key}
                type="number"
                min={0}
                step={50}
                value={(ex as any)[f.key] || ""}
                onChange={(e) => update(f.key, Number(e.target.value))}
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Total Monthly Expenses
            </span>
            <span className="text-lg font-bold text-[#C9A84C]">
              ${totalMonthly.toLocaleString()}/mo
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Annual equivalent</span>
            <span>${(totalMonthly * 12).toLocaleString()}/yr</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
