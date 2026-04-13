"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shield, FileText, Plus, Trash2, Clock, User } from "lucide-react";
import type { SavedReport } from "@/lib/types";
import { listReports, deleteReport } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setReports(listReports());
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    deleteReport(id);
    setReports(listReports());
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-12 text-center">
        <div className="mb-4 flex justify-center">
          <Shield className="size-16 text-[#C9A84C]" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Federal Retirement{" "}
          <span className="text-[#C9A84C]">Benefits Analysis</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
          Generate comprehensive 50+ page retirement reports covering FERS, CSRS, TSP,
          FEGLI, FEHB, Social Security, and more — powered by real OPM formulas.
        </p>
        <div className="mt-8">
          <Link href="/new">
            <Button className="bg-[#C9A84C] px-8 py-6 text-lg font-semibold text-[#0A1628] hover:bg-[#D4B65E]">
              <Plus className="mr-2 size-5" />
              Create New Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature highlights */}
      {reports.length === 0 && (
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "FERS & CSRS Annuity",
              desc: "Full annuity calculations including FERS Transfer, CSRS Offset, and Special Provisions (LEO/FF/ATC).",
            },
            {
              title: "TSP Projections",
              desc: "Fund-by-fund growth modeling for Traditional and Roth TSP with withdrawal strategy analysis.",
            },
            {
              title: "FEGLI & FEHB",
              desc: "Age-banded FEGLI cost projections and FEHB premium analysis through retirement.",
            },
            {
              title: "Income Comparison",
              desc: "Last paycheck vs. first retirement check — see exactly how your income changes.",
            },
            {
              title: "30-Year Projections",
              desc: "Year-by-year income, expenses, and net income tables with COLA adjustments.",
            },
            {
              title: "PDF Report",
              desc: "Professional 50+ page PDF report with navy & gold branding — ready for client meetings.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[#1E2D45] bg-[#0A1628] p-6"
            >
              <h3 className="mb-2 font-semibold text-[#C9A84C]">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Saved Reports */}
      {reports.length > 0 && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Saved Reports</h2>
            <span className="text-sm text-slate-400">
              {reports.length} report{reports.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="group rounded-xl border border-[#1E2D45] bg-[#0A1628] p-5 transition-colors hover:border-[#C9A84C]/40"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-[#C9A84C]" />
                    <span className="font-semibold text-white">
                      {report.clientName}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="rounded p-1 text-slate-500 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mb-4 space-y-1 text-sm text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <FileText className="size-3.5" />
                    <span>
                      {report.retirementSystem.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    <span>
                      Retirement: {new Date(report.plannedRetirementDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Updated:{" "}
                    {new Date(report.updatedAt).toLocaleDateString()}{" "}
                    {new Date(report.updatedAt).toLocaleTimeString()}
                  </div>
                </div>
                <Link href={`/report/${report.id}`}>
                  <Button
                    variant="outline"
                    className="w-full border-[#1E2D45] bg-transparent text-[#C9A84C] hover:bg-[#1E2D45]"
                  >
                    View Report
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
