"use client";

import Link from "next/link";
import { Shield } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1E2D45] bg-[#0A1628]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Shield className="size-8 text-[#C9A84C]" />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-white">
              CapitalWealth<span className="text-[#C9A84C]">.com</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#C9A84C]/60">
              Federal Benefits Analysis
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-[#C9A84C]"
          >
            Dashboard
          </Link>
          <Link
            href="/new"
            className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0A1628] transition-colors hover:bg-[#D4B65E]"
          >
            New Report
          </Link>
        </nav>
      </div>
    </header>
  );
}
