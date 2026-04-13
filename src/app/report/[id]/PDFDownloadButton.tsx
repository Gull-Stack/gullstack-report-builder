"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FederalRetirementReport from "@/lib/pdf/report";
import type { ReportInput, CalculationResult } from "@/lib/types";

interface Props {
  input: ReportInput;
  result: CalculationResult;
  clientName: string;
}

export default function PDFDownloadButton({ input, result, clientName }: Props) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const blob = await pdf(
        <FederalRetirementReport input={input} result={result} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${clientName.replace(/\s+/g, "_")}_Federal_Benefits_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please try again.");
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
