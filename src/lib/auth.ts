import type { UserType } from "./auth-constants";
import { loadOnboardingState } from "./auth-constants";
import { invalidateActiveRoleCache } from "./active-role-store";
import { persistOnboardingToProfile, seedDemoProfileIfNeeded } from "./profile-store";
import { seedDemoAgencyIfNeeded } from "./agency-store";
import { isUserVerified, setUserVerified } from "./verified-users-store";
import { freelancers } from "./mock-data";
import {
  isLoginBlocked,
  loginBlockedMessage,
  setUserAccountStatus,
} from "./user-status-store";
import { normalizeEmail } from "./sanitize";
import { clearLoginAttempts, recordFailedLogin } from "./rate-limit";

export const SESSION_STORAGE_KEY = "ishbor-session";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  userType: UserType;
  username?: string;
  companySlug?: string;
  company?: string;
  avatarHue: number;
  verified: boolean;
  isAdmin?: boolean;
  bio?: string;
  location?: string;
};

export type AuthSession = {
  user: AuthUser;
  remember: boolean;
  loggedInAt: string;
};

const PASSWORD_OVERRIDES_KEY = "ishbor-password-overrides";

function readPasswordOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PASSWORD_OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writePasswordOverrides(data: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PASSWORD_OVERRIDES_KEY, JSON.stringify(data));
}

function getPasswordForEmail(email: string): string | null {
  const demo = demoUsers[email];
  if (!demo) return null;
  const overrides = readPasswordOverrides();
  return overrides[email] ?? demo.password;
}

export function verifyUserPassword(email: string, password: string): boolean {
  const normalized = email.trim().toLowerCase();
  const expected = getPasswordForEmail(normalized);
  if (expected) return expected === password;
  return password.length >= 6;
}

export function updateUserPassword(userId: string, newPassword: string): boolean {
  const session = getSession();
  if (!session || session.user.id !== userId || newPassword.length < 8) return false;
  const email = session.user.email.trim().toLowerCase();
  if (demoUsers[email]) {
    const overrides = readPasswordOverrides();
    overrides[email] = newPassword;
    writePasswordOverrides(overrides);
  }
  return true;
}

const demoUsers: Record<string, { password: string; user: AuthUser }> = {
  "sardor@asaka.uz": {
    password: "demo1234",
    user: {
      id: "u-client-1",
      email: "sardor@asaka.uz",
      fullName: "Sardor Mirkomilov",
      userType: "client",
      company: "Asaka Capital",
      companySlug: "asaka-capital",
      avatarHue: 215,
      verified: true,
      bio: "Head of Product at Asaka Capital. Hiring design and engineering talent for fintech.",
      location: "Tashkent, Uzbekistan",
    },
  },
  "nargiza@ishbor.uz": {
    password: "demo1234",
    user: {
      id: "u-freelancer-1",
      email: "nargiza@ishbor.uz",
      fullName: "Nargiza Akhmedova",
      userType: "freelancer",
      username: "nargiza",
      avatarHue: 250,
      verified: true,
      bio: "Senior Brand Strategist & UI Designer. 8 years, 120+ projects across Central Asia.",
      location: "Tashkent, Uzbekistan",
    },
  },
  "admin@ishbor.uz": {
    password: "demo1234",
    user: {
      id: "u-admin-1",
      email: "admin@ishbor.uz",
      fullName: "Bobur Niyazov",
      userType: "client",
      company: "Ishbor Platform",
      companySlug: "ishbor",
      avatarHue: 200,
      verified: true,
      isAdmin: true,
      bio: "Platform administrator for Ishbor marketplace operations.",
      location: "Tashkent, Uzbekistan",
    },
  },
};

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedRaw: string | null | undefined;
let cachedSession: AuthSession | null | undefined;

function notify() {
  listeners.forEach((l) => l());
}

function isValidAuthSession(session: unknown): session is AuthSession {
  if (!session || typeof session !== "object") return false;
  const candidate = session as AuthSession;
  return (
    typeof candidate.user?.id === "string" &&
    typeof candidate.user?.email === "string" &&
    typeof candidate.user?.fullName === "string"
  );
}

function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  cachedRaw = null;
  cachedSession = null;
}

function readStorage(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(SESSION_STORAGE_KEY) ??
      sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      cachedRaw = null;
      cachedSession = null;
      return null;
    }
    if (raw === cachedRaw) {
      return cachedSession ?? null;
    }
    cachedRaw = raw;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!isValidAuthSession(parsed)) {
      clearStoredSession();
      return null;
    }
    cachedSession = parsed;
    return cachedSession;
  } catch {
    clearStoredSession();
    return null;
  }
}

function writeStorage(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  if (!session) {
    cachedRaw = null;
    cachedSession = null;
    return;
  }
  const storage = session.remember ? localStorage : sessionStorage;
  const raw = JSON.stringify(session);
  storage.setItem(SESSION_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSession = session;
}

let storageListenerAttached = false;

function onCrossTabStorage(e: StorageEvent) {
  if (e.key === SESSION_STORAGE_KEY || e.key === null) {
    cachedRaw = undefined;
    cachedSession = undefined;
    notify();
  }
}

function attachStorageListener() {
  if (typeof window === "undefined" || storageListenerAttached) return;
  window.addEventListener("storage", onCrossTabStorage);
  storageListenerAttached = true;
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  attachStorageListener();
  return () => listeners.delete(listener);
}

export function getSession(): AuthSession | null {
  return readStorage();
}

/** Stable snapshot for useSyncExternalStore — must return same reference until auth changes. */
export function getSessionSnapshot(): AuthSession | null {
  return readStorage();
}

export function getCurrentUser(): AuthUser | null {
  return getSession()?.user ?? null;
}

export function isAuthenticated(): boolean {
  return isValidAuthSession(getSession());
}

export function loginWithCredentials(
  email: string,
  password: string,
  remember = false,
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const normalized = normalizeEmail(email);
  if (isLoginBlocked(normalized)) {
    return { ok: false, error: loginBlockedMessage(normalized) };
  }
  const demo = demoUsers[normalized];
  const expectedPassword = getPasswordForEmail(normalized);
  if (demo && expectedPassword === password) {
    const verified = isUserVerified(demo.user.id, demo.user.verified);
    const session: AuthSession = {
      user: { ...demo.user, verified },
      remember,
      loggedInAt: new Date().toISOString(),
    };
    writeStorage(session);
    persistOnboardingToProfile(session.user.id);
    seedDemoProfileIfNeeded(session.user.id);
    seedDemoAgencyIfNeeded(session.user.id);
    invalidateActiveRoleCache();
    clearLoginAttempts(normalized);
    notify();
    return { ok: true, session };
  }
  if (demo && expectedPassword !== password) {
    recordFailedLogin(normalized);
    return { ok: false, error: "Email yoki parol noto'g'ri." };
  }
  recordFailedLogin(normalized);
  return {
    ok: false,
    error: "Email yoki parol noto'g'ri. Ro'yxatdan o'tganmisiz?",
  };
}

/** Apply server-issued session (HttpOnly cookie is source of truth). */
export function applyServerSession(session: AuthSession): AuthSession {
  writeStorage(session);
  persistOnboardingToProfile(session.user.id);
  seedDemoProfileIfNeeded(session.user.id);
  seedDemoAgencyIfNeeded(session.user.id);
  invalidateActiveRoleCache();
  clearLoginAttempts(session.user.email);
  notify();
  return session;
}

/** Sync account status from admin panel — blocks future logins. */
export function syncAccountStatusFromAdmin(
  email: string,
  status: "active" | "suspended" | "banned",
): void {
  setUserAccountStatus(email, status);
  const normalized = normalizeEmail(email);
  const session = getSession();
  if (
    session &&
    normalizeEmail(session.user.email) === normalized &&
    (status === "suspended" || status === "banned")
  ) {
    logout();
  }
}

export function loginDemo(userType: UserType, remember = false): AuthSession {
  const email = userType === "client" ? "sardor@asaka.uz" : "nargiza@ishbor.uz";
  const result = loginWithCredentials(email, "demo1234", remember);
  return result.ok ? result.session : getSession()!;
}

export function logout() {
  writeStorage(null);
  invalidateActiveRoleCache();
  notify();
}

export function updateSessionUser(patch: Partial<AuthUser>) {
  const session = getSession();
  if (!session) return;
  if (patch.verified) setUserVerified(session.user.id);
  const next: AuthSession = {
    ...session,
    user: { ...session.user, ...patch },
  };
  writeStorage(next);
  notify();
}

export function getDefaultDashboard(userType: UserType): string {
  return userType === "freelancer" ? "/dashboard/freelancer" : "/dashboard";
}

export function isAdminUser(user?: AuthUser | null): boolean {
  return !!user?.isAdmin;
}

/** Shorthand demo emails — e.g. "admin" → admin@ishbor.uz */
export function normalizeLoginEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  if (trimmed === "admin") return "admin@ishbor.uz";
  return trimmed;
}

/** Demo hisoblar — jamoa taklifida tanlash uchun. */
export function getRegisteredDemoUsers(): AuthUser[] {
  return Object.values(demoUsers).map((entry) => entry.user);
}

/** Map marketplace freelancer username to wallet/session user id. */
export function resolveFreelancerUserId(username: string): string {
  if (username === "nargiza") return "u-freelancer-1";
  const match = freelancers.find((f) => f.username === username);
  return match ? `u-${match.id}` : `u-freelancer-${username}`;
}
