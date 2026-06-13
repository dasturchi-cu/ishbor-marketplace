import { getSession } from "./auth";
import { hasAgencyPermission, getAgencyBySlug } from "./agency-store";
import type { AgencyCaseStudy } from "./agency-types";

const STORAGE_KEY = "ishbor-agency-portfolio";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeAgencyPortfolio(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): AgencyCaseStudy[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AgencyCaseStudy[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: AgencyCaseStudy[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  notify();
}

export type AgencyCaseStudyInput = Omit<
  AgencyCaseStudy,
  "id" | "createdAt" | "updatedAt" | "status"
>;

export function getCaseStudiesByAgency(agencySlug: string, publishedOnly = false): AgencyCaseStudy[] {
  return readAll().filter(
    (c) => c.agencySlug === agencySlug && (!publishedOnly || c.status === "published"),
  );
}

export function createCaseStudy(
  agencySlug: string,
  input: AgencyCaseStudyInput,
): AgencyCaseStudy | { error: string } {
  const session = getSession();
  if (!session) return { error: "Tizimga kiring." };

  const agency = getAgencyBySlug(agencySlug);
  if (!agency) return { error: "Agentlik topilmadi." };
  if (!hasAgencyPermission(agency, session.user.id, "manage_portfolio")) {
    return { error: "Portfolio boshqarish huquqi yo'q." };
  }

  const now = new Date().toISOString();
  const study: AgencyCaseStudy = {
    ...input,
    id: `acs-${Date.now()}`,
    agencySlug,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  writeAll([study, ...readAll()]);
  return study;
}

export function publishCaseStudy(id: string): AgencyCaseStudy | { error: string } {
  const session = getSession();
  if (!session) return { error: "Tizimga kiring." };

  const all = readAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return { error: "Loyiha hikoyasi topilmadi." };

  const study = all[idx]!;
  const agency = getAgencyBySlug(study.agencySlug);
  if (!agency || !hasAgencyPermission(agency, session.user.id, "manage_portfolio")) {
    return { error: "Ruxsat yo'q." };
  }

  const updated: AgencyCaseStudy = { ...study, status: "published", updatedAt: new Date().toISOString() };
  const next = [...all];
  next[idx] = updated;
  writeAll(next);
  return updated;
}

export function deleteCaseStudy(id: string): boolean {
  const session = getSession();
  if (!session) return false;

  const all = readAll();
  const study = all.find((c) => c.id === id);
  if (!study) return false;

  const agency = getAgencyBySlug(study.agencySlug);
  if (!agency || !hasAgencyPermission(agency, session.user.id, "manage_portfolio")) return false;

  writeAll(all.filter((c) => c.id !== id));
  return true;
}
