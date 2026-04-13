"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportInput, CalculationResult } from "@/lib/types";
import FederalRetirementReport from "@/lib/pdf/report";

interface Props {
  input: ReportInput;
  result: CalculationResult;
}

export default function PDFDownloadButton({ input, result }: Props) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const doc = <FederalRetirementReport input={input} result={result} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const clientSlug = (input.personal.fullName || "report")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      a.href = url;
      a.download = `federal-retirement-report-${clientSlug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={generating}
      className="bg-[#C9A84C] text-[#0A1628] hover:bg-[#D4B65E]"
    >
      {generating ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="mr-2 size-4" />
          Download PDF Report
        </>
      )}
    </Button>
  );
}
