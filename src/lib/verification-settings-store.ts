import { getSession } from "./auth";
import type { VerificationItem } from "./mock-data";

const STORAGE_KEY = "ishbor-verification-settings";
const listeners = new Set<() => void>();
let cache: Map<string, VerificationSettingsState> | null = null;

export type VerificationStep = {
  id: string;
  label: string;
  status: "pending" | "review" | "approved" | "rejected" | "none";
  submittedAt?: string;
  reviewedAt?: string;
};

export type VerificationSettingsState = {
  userId: string;
  steps: VerificationStep[];
  history: { action: string; date: string }[];
};

const STEP_DEFS = [
  { id: "identity", label: "Shaxsni tasdiqlash" },
  { id: "business", label: "Biznes tasdiqlash" },
  { id: "phone", label: "Telefon raqami" },
  { id: "email", label: "Email manzil" },
  { id: "address", label: "Manzil tasdiqlash" },
];

function notify() {
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribeVerificationSettings(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Record<string, VerificationSettingsState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, VerificationSettingsState>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, VerificationSettingsState>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function defaultState(userId: string, verified: boolean): VerificationSettingsState {
  const now = new Date().toISOString();
  return {
    userId,
    steps: STEP_DEFS.map((s, i) => ({
      id: s.id,
      label: s.label,
      status:
        verified && (s.id === "identity" || s.id === "email" || s.id === "phone")
          ? "approved"
          : s.id === "email" || s.id === "phone"
            ? "approved"
            : "none",
      submittedAt: verified && s.id === "identity" ? now : undefined,
      reviewedAt: verified && s.id === "identity" ? now : undefined,
    })),
    history: verified
      ? [{ action: "Shaxs tasdiqlash tasdiqlandi", date: now }]
      : [],
  };
}

export function getVerificationSettings(userId?: string, userVerified = false): VerificationSettingsState {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) {
    return { userId: "", steps: [], history: [] };
  }
  if (!cache) cache = new Map(Object.entries(readAll()));
  const existing = cache.get(uid);
  if (existing) return existing;

  const state = defaultState(uid, userVerified);
  cache.set(uid, state);
  const all = readAll();
  all[uid] = state;
  writeAll(all);
  return state;
}

function persist(state: VerificationSettingsState) {
  if (!cache) cache = new Map();
  cache.set(state.userId, state);
  const all = readAll();
  all[state.userId] = state;
  writeAll(all);
  notify();
}

export function submitVerificationDocument(
  userId: string,
  stepId: string,
  docName: string,
): VerificationStep | null {
  const state = getVerificationSettings(userId);
  const idx = state.steps.findIndex((s) => s.id === stepId);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const steps = [...state.steps];
  steps[idx] = { ...steps[idx]!, status: "review", submittedAt: now };
  persist({
    ...state,
    steps,
    history: [{ action: `${steps[idx]!.label}: ${docName} yuborildi`, date: now }, ...state.history],
  });
  return steps[idx]!;
}

export function approveVerificationStep(userId: string, stepId: string): void {
  const state = getVerificationSettings(userId);
  const now = new Date().toISOString();
  persist({
    ...state,
    steps: state.steps.map((s) =>
      s.id === stepId ? { ...s, status: "approved" as const, reviewedAt: now } : s,
    ),
    history: [{ action: `${state.steps.find((s) => s.id === stepId)?.label} tasdiqlandi`, date: now }, ...state.history],
  });
}

export function buildVerificationItems(userId: string, userVerified: boolean): VerificationItem[] {
  const state = getVerificationSettings(userId, userVerified);
  return state.steps.map((s) => ({
    label: s.label,
    done: s.status === "approved",
    verifiedAt:
      s.status === "approved" && s.reviewedAt
        ? new Date(s.reviewedAt).toLocaleDateString("uz-UZ", { month: "short", year: "numeric" })
        : undefined,
  }));
}

export function computeVerificationScore(userId: string, userVerified: boolean): number {
  const state = getVerificationSettings(userId, userVerified);
  const approved = state.steps.filter((s) => s.status === "approved").length;
  const review = state.steps.filter((s) => s.status === "review").length;
  return Math.min(100, approved * 18 + review * 8);
}
