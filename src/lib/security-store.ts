import { getSession } from "./auth";

const STORAGE_KEY = "ishbor-security";
const listeners = new Set<() => void>();
let cache: Map<string, SecurityState> | null = null;

export type SessionEntry = {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
};

export type SecurityState = {
  userId: string;
  twoFAEnabled: boolean;
  passwordChangedAt?: string;
  strongPasswordSet: boolean;
  sessions: SessionEntry[];
};

function notify() {
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribeSecurity(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Record<string, SecurityState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SecurityState>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, SecurityState>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "Brauzer";
  const ua = navigator.userAgent;
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Brauzer";
}

function detectDevice(): string {
  if (typeof navigator === "undefined") return "Kompyuter";
  const ua = navigator.userAgent;
  if (/Mobile|Android|iPhone/i.test(ua)) return "Mobil qurilma";
  if (/Tablet|iPad/i.test(ua)) return "Planshet";
  return "Kompyuter";
}

function defaultSessions(userId: string): SessionEntry[] {
  const now = new Date().toISOString();
  return [
    {
      id: `sess-${userId}-current`,
      device: detectDevice(),
      browser: detectBrowser(),
      location: "Toshkent, O'zbekiston",
      lastActive: now,
      current: true,
    },
    {
      id: `sess-${userId}-2`,
      device: "Mobil qurilma",
      browser: "Safari",
      location: "Toshkent, O'zbekiston",
      lastActive: new Date(Date.now() - 86400000 * 2).toISOString(),
      current: false,
    },
  ];
}

export function getSecurityState(userId?: string): SecurityState {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) {
    return { userId: "", twoFAEnabled: false, strongPasswordSet: false, sessions: [] };
  }
  if (!cache) cache = new Map(Object.entries(readAll()));
  const existing = cache.get(uid);
  if (existing) return existing;

  const state: SecurityState = {
    userId: uid,
    twoFAEnabled: false,
    strongPasswordSet: false,
    sessions: defaultSessions(uid),
  };
  cache.set(uid, state);
  const all = readAll();
  all[uid] = state;
  writeAll(all);
  return state;
}

function persist(state: SecurityState) {
  if (!cache) cache = new Map();
  cache.set(state.userId, state);
  const all = readAll();
  all[state.userId] = state;
  writeAll(all);
  notify();
}

export function enableTwoFA(userId: string): void {
  const state = getSecurityState(userId);
  persist({ ...state, twoFAEnabled: true });
}

export function disableTwoFA(userId: string): void {
  const state = getSecurityState(userId);
  persist({ ...state, twoFAEnabled: false });
}

export function recordPasswordChange(userId: string, strong: boolean): void {
  const state = getSecurityState(userId);
  persist({
    ...state,
    passwordChangedAt: new Date().toISOString(),
    strongPasswordSet: strong,
  });
}

export function revokeSession(userId: string, sessionId: string): boolean {
  const state = getSecurityState(userId);
  const session = state.sessions.find((s) => s.id === sessionId);
  if (!session || session.current) return false;
  persist({
    ...state,
    sessions: state.sessions.filter((s) => s.id !== sessionId),
  });
  return true;
}

export function computeSecurityScore(userId: string, emailVerified = true): number {
  const state = getSecurityState(userId);
  let score = 0;
  if (state.strongPasswordSet || state.passwordChangedAt) score += 25;
  else score += 10;
  if (state.twoFAEnabled) score += 30;
  if (emailVerified) score += 20;
  const otherSessions = state.sessions.filter((s) => !s.current).length;
  score += otherSessions <= 2 ? 25 : 15;
  return Math.min(100, score);
}

export function formatLastLogin(iso?: string): string {
  if (!iso) return "Noma'lum";
  const d = new Date(iso);
  return d.toLocaleString("uz-UZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
