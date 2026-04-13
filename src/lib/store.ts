import type { SavedReport, ReportInput, CalculationResult } from "./types";

const STORAGE_KEY = "cw-federal-reports";

function getAll(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setAll(reports: SavedReport[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function saveReport(
  input: ReportInput,
  result: CalculationResult,
  existingId?: string
): SavedReport {
  const reports = getAll();
  const now = new Date().toISOString();

  if (existingId) {
    const idx = reports.findIndex((r) => r.id === existingId);
    if (idx !== -1) {
      reports[idx] = {
        ...reports[idx],
        updatedAt: now,
        clientName: input.personal.fullName || "Unnamed Client",
        retirementSystem: input.employment.retirementSystem,
        plannedRetirementDate: input.employment.plannedRetirementDate,
        input,
        result,
      };
      setAll(reports);
      return reports[idx];
    }
  }

  const saved: SavedReport = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    clientName: input.personal.fullName || "Unnamed Client",
    retirementSystem: input.employment.retirementSystem,
    plannedRetirementDate: input.employment.plannedRetirementDate,
    input,
    result,
  };

  reports.unshift(saved);
  setAll(reports);
  return saved;
}

export function loadReport(id: string): SavedReport | null {
  const reports = getAll();
  return reports.find((r) => r.id === id) ?? null;
}

export function listReports(): SavedReport[] {
  return getAll().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function deleteReport(id: string): boolean {
  const reports = getAll();
  const filtered = reports.filter((r) => r.id !== id);
  if (filtered.length === reports.length) return false;
  setAll(filtered);
  return true;
}
