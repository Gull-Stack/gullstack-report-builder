"use client";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#1E2D45] bg-[#0A1628]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
          <p>&copy; {year} CapitalWealth.com. All rights reserved.</p>
          <p>
            Federal Retirement Benefits Report Generator &mdash; For professional use only.
          </p>
        </div>
      </div>
    </footer>
  );
}
