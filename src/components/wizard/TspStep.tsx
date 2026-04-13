"use client";

import type { ReportInput, TspFundBalance } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface StepProps {
  data: ReportInput;
  updateData: (section: keyof ReportInput, values: any) => void;
}

const fundLabels: Record<string, string> = {
  G: "G Fund (Govt Securities)",
  F: "F Fund (Fixed Income)",
  C: "C Fund (Common Stock / S&P 500)",
  S: "S Fund (Small Cap)",
  I: "I Fund (International)",
  L: "L Fund (Lifecycle)",
};

const withdrawalMethods = [
  { value: "LUMP_SUM", label: "Lump Sum" },
  { value: "MONTHLY_PAYMENTS", label: "Monthly Payments" },
  { value: "LIFE_ANNUITY", label: "Life Annuity" },
  { value: "COMBINATION", label: "Combination" },
];

function FundRow({
  balances,
  type,
  onUpdate,
}: {
  balances: TspFundBalance[];
  type: "traditional" | "roth";
  onUpdate: (updated: TspFundBalance[]) => void;
}) {
  const updateFund = (idx: number, field: keyof TspFundBalance, value: number) => {
    const copy = balances.map((b, i) =>
      i === idx ? { ...b, [field]: value } : b
    );
    onUpdate(copy);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold capitalize text-[#C9A84C]/80">
        {type} TSP Balances
      </h4>
      <div className="grid gap-3">
        {balances.map((fb, idx) => (
          <div key={fb.fund} className="grid grid-cols-[1fr_120px_100px] items-center gap-3">
            <span className="text-sm text-muted-foreground">{fundLabels[fb.fund]}</span>
            <Input
              type="number"
              min={0}
              step={100}
              value={fb.balance || ""}
              onChange={(e) => updateFund(idx, "balance", Number(e.target.value))}
              placeholder="$0"
            />
            <Input
              type="number"
              min={0}
              max={30}
              step={0.1}
              value={fb.returnRate ? (fb.returnRate * 100).toFixed(1) : ""}
              onChange={(e) => updateFund(idx, "returnRate", Number(e.target.value) / 100)}
              placeholder="%"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total {type}:</span>
        <span className="font-semibold text-[#C9A84C]">
          ${balances.reduce((sum, b) => sum + (b.balance || 0), 0).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function TspStep({ data, updateData }: StepProps) {
  const t = data.tsp;
  const update = (field: string, value: any) => {
    updateData("tsp", { ...t, [field]: value });
  };

  return (
    <Card className="border-[#1E2D45] bg-[#0F1D32]">
      <CardHeader>
        <CardTitle className="text-[#C9A84C]">Thrift Savings Plan (TSP)</CardTitle>
        <CardDescription>
          Current balances, contributions, and withdrawal strategy for your TSP account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-[#1E2D45] p-4">
          <div className="mb-2 grid grid-cols-[1fr_120px_100px] items-center gap-3 text-xs font-medium text-muted-foreground">
            <span>Fund</span>
            <span>Balance ($)</span>
            <span>Return (%)</span>
          </div>
          <FundRow
            balances={t.traditionalBalances}
            type="traditional"
            onUpdate={(updated) => update("traditionalBalances", updated)}
          />
          <Separator className="my-4" />
          <FundRow
            balances={t.rothBalances}
            type="roth"
            onUpdate={(updated) => update("rothBalances", updated)}
          />
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="annualTrad">Annual Traditional Contribution ($)</Label>
            <Input
              id="annualTrad"
              type="number"
              min={0}
              step={500}
              value={t.annualContributionTraditional || ""}
              onChange={(e) => update("annualContributionTraditional", Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="annualRoth">Annual Roth Contribution ($)</Label>
            <Input
              id="annualRoth"
              type="number"
              min={0}
              step={500}
              value={t.annualContributionRoth || ""}
              onChange={(e) => update("annualContributionRoth", Number(e.target.value))}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="govMatch">Government Match (%)</Label>
            <Input
              id="govMatch"
              type="number"
              min={0}
              max={5}
              step={0.5}
              value={t.governmentMatchPercent || ""}
              onChange={(e) => update("governmentMatchPercent", Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">FERS employees receive up to 5%.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="catchUp">Catch-Up Contribution ($)</Label>
            <Input
              id="catchUp"
              type="number"
              min={0}
              step={500}
              value={t.catchUpContribution || ""}
              onChange={(e) => update("catchUpContribution", Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Age 50+ additional amount.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="blendedRate">Expected Blended Return (%)</Label>
            <Input
              id="blendedRate"
              type="number"
              min={0}
              max={20}
              step={0.1}
              value={t.expectedReturnRate ? (t.expectedReturnRate * 100).toFixed(1) : ""}
              onChange={(e) => update("expectedReturnRate", Number(e.target.value) / 100)}
              placeholder="7.0"
            />
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="withdrawalAge">Planned Withdrawal Age</Label>
            <Input
              id="withdrawalAge"
              type="number"
              min={55}
              max={90}
              value={t.plannedWithdrawalAge || ""}
              onChange={(e) => update("plannedWithdrawalAge", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Withdrawal Method</Label>
            <Select
              value={t.withdrawalMethod}
              onValueChange={(val) => update("withdrawalMethod", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {withdrawalMethods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(t.withdrawalMethod === "MONTHLY_PAYMENTS" || t.withdrawalMethod === "COMBINATION") && (
            <div className="space-y-2">
              <Label htmlFor="monthlyAmt">Monthly Withdrawal ($)</Label>
              <Input
                id="monthlyAmt"
                type="number"
                min={0}
                step={100}
                value={t.monthlyWithdrawalAmount || ""}
                onChange={(e) => update("monthlyWithdrawalAmount", Number(e.target.value))}
                placeholder="2,000"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
