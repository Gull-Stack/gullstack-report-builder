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

export default function DepositsStep({ data, updateData }: StepProps) {
  const d = data.deposits;
  const update = (field: string, value: any) => {
    updateData("deposits", { ...d, [field]: value });
  };

  return (
    <Card className="border-[#1E2D45] bg-[#0F1D32]">
      <CardHeader>
        <CardTitle className="text-[#C9A84C]">Service Credit Deposits</CardTitle>
        <CardDescription>
          Deposits for non-deduction service and re-deposits for refunded service that can increase your annuity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Non-deduction service */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={d.hasNonDeductionService}
              onCheckedChange={(checked) => update("hasNonDeductionService", !!checked)}
            />
            <div>
              <Label className="cursor-pointer">Non-Deduction Service</Label>
              <p className="text-xs text-muted-foreground">
                Temporary or intermittent federal service where no retirement deductions were withheld.
              </p>
            </div>
          </div>

          {d.hasNonDeductionService && (
            <div className="ml-7 max-w-xs space-y-2">
              <Label htmlFor="depositOwed">Deposit Amount Owed ($)</Label>
              <Input
                id="depositOwed"
                type="number"
                min={0}
                step={100}
                value={d.depositOwed || ""}
                onChange={(e) => update("depositOwed", Number(e.target.value))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Paying this deposit makes the non-deduction service creditable toward your annuity.
              </p>
            </div>
          )}
        </div>

        {/* Refunded service */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={d.hasRefundedService}
              onCheckedChange={(checked) => update("hasRefundedService", !!checked)}
            />
            <div>
              <Label className="cursor-pointer">Refunded Service</Label>
              <p className="text-xs text-muted-foreground">
                Prior federal service where you withdrew your retirement contributions when you left.
              </p>
            </div>
          </div>

          {d.hasRefundedService && (
            <div className="ml-7 max-w-xs space-y-2">
              <Label htmlFor="reDeposit">Re-Deposit Amount Owed ($)</Label>
              <Input
                id="reDeposit"
                type="number"
                min={0}
                step={100}
                value={d.reDepositOwed || ""}
                onChange={(e) => update("reDepositOwed", Number(e.target.value))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Re-depositing restores credit for that service period. Interest accrues on unpaid amounts.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-[#C9A84C]">Why Deposits Matter</p>
          <p className="mt-1">
            Unpaid deposits reduce your annuity. For FERS, unpaid non-deduction service
            receives no credit. For CSRS, unpaid service receives credit at a reduced
            actuarial rate. Paying deposits before retirement maximizes your benefit.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
