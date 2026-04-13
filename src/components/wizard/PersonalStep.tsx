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

const maritalOptions = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
];

export default function PersonalStep({ data, updateData }: StepProps) {
  const p = data.personal;
  const update = (field: string, value: any) => {
    updateData("personal", { ...p, [field]: value });
  };

  const showSpouse = p.maritalStatus === "MARRIED";

  return (
    <Card className="border-[#1E2D45] bg-[#0F1D32]">
      <CardHeader>
        <CardTitle className="text-[#C9A84C]">Personal Information</CardTitle>
        <CardDescription>Basic details about the federal employee.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={p.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="John A. Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={p.dateOfBirth}
              onChange={(e) => update("dateOfBirth", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Mailing Address</Label>
          <Input
            id="address"
            value={p.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="123 Main St, City, State ZIP"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Marital Status</Label>
            <Select
              value={p.maritalStatus}
              onValueChange={(val) => update("maritalStatus", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {maritalOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showSpouse && (
            <div className="space-y-2">
              <Label htmlFor="spouseDob">Spouse Date of Birth</Label>
              <Input
                id="spouseDob"
                type="date"
                value={p.spouseDateOfBirth}
                onChange={(e) => update("spouseDateOfBirth", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required for survivor benefit calculations.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
