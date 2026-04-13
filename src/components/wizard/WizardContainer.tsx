"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ReportInput } from "@/lib/types";
import { defaultReportInput } from "@/lib/defaults";
import { saveReport } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText, Loader2 } from "lucide-react";

import PersonalStep from "./PersonalStep";
import EmploymentStep from "./EmploymentStep";
import TspStep from "./TspStep";
import FegliStep from "./FegliStep";
import FehbStep from "./FehbStep";
import SocialSecurityStep from "./SocialSecurityStep";
import LtcStep from "./LtcStep";
import OtherIncomeStep from "./OtherIncomeStep";
import ExpensesStep from "./ExpensesStep";
import TaxStep from "./TaxStep";
import MilitaryStep from "./MilitaryStep";
import DepositsStep from "./DepositsStep";
import ReviewStep from "./ReviewStep";

const STEPS = [
  { id: "personal", label: "Personal", component: PersonalStep },
  { id: "employment", label: "Employment", component: EmploymentStep },
  { id: "tsp", label: "TSP", component: TspStep },
  { id: "fegli", label: "FEGLI", component: FegliStep },
  { id: "fehb", label: "FEHB", component: FehbStep },
  { id: "socialSecurity", label: "Social Security", component: SocialSecurityStep },
  { id: "ltc", label: "LTC", component: LtcStep },
  { id: "otherIncome", label: "Other Income", component: OtherIncomeStep },
  { id: "expenses", label: "Expenses", component: ExpensesStep },
  { id: "tax", label: "Tax", component: TaxStep },
  { id: "military", label: "Military", component: MilitaryStep },
  { id: "deposits", label: "Deposits", component: DepositsStep },
  { id: "review", label: "Review", component: ReviewStep },
] as const;

interface WizardContainerProps {
  initialData?: ReportInput;
}

export default function WizardContainer({ initialData }: WizardContainerProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ReportInput>(
    initialData ?? { ...defaultReportInput }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = STEPS.length;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const updateData = useCallback(
    (section: keyof ReportInput, values: any) => {
      setFormData((prev) => ({ ...prev, [section]: values }));
    },
    []
  );

  const goNext = () => {
    if (!isLastStep) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrev = () => {
    if (!isFirstStep) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToStep = (idx: number) => {
    setCurrentStep(idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Calculation failed (${res.status})`);
      }

      const result = await res.json();
      const saved = saveReport(formData, result);
      router.push(`/report/${saved.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepComponent = STEPS[currentStep].component;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Progress header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[#C9A84C]">
            Step {currentStep + 1} of {totalSteps}: {STEPS[currentStep].label}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progressPercent)}% complete
          </span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {/* Step navigation pills */}
      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((step, idx) => (
          <button
            key={step.id}
            type="button"
            onClick={() => goToStep(idx)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              idx === currentStep
                ? "bg-[#C9A84C] text-[#0A1628]"
                : idx < currentStep
                  ? "bg-[#C9A84C]/20 text-[#C9A84C] hover:bg-[#C9A84C]/30"
                  : "bg-[#1E2D45] text-slate-400 hover:bg-[#1E2D45]/80"
            }`}
          >
            {step.label}
          </button>
        ))}
      </div>

      {/* Current step form */}
      <StepComponent data={formData} updateData={updateData} />

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pb-8">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={isFirstStep}
          className="border-[#1E2D45] bg-transparent hover:bg-[#1E2D45]"
        >
          <ChevronLeft className="mr-1 size-4" />
          Previous
        </Button>

        <div className="flex gap-3">
          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#C9A84C] text-[#0A1628] hover:bg-[#D4B65E]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 size-4" />
                  Generate Report
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              className="bg-[#C9A84C] text-[#0A1628] hover:bg-[#D4B65E]"
            >
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
