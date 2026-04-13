import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import FederalRetirementReport from "@/lib/pdf/report";

export async function POST(request: Request) {
  try {
    const { input, result } = await request.json();

    if (!input || !result) {
      return Response.json(
        { error: "Missing input or result data" },
        { status: 400 }
      );
    }

    const buffer = await renderToBuffer(
      React.createElement(FederalRetirementReport, { input, result }) as any
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${input.personal?.fullName || "Federal"}-Retirement-Report.pdf"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
