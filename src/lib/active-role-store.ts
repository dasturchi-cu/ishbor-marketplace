import type { UserType } from "./auth-constants";
import { getSession } from "./auth";

const STORAGE_PREFIX = "ishbor-active-role";

const listeners = new Set<() => void>();

let cachedUserId: string | null = null;
let cachedRole: UserType | null = null;

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}-${userId}`;
}

function readStoredRole(userId: string, fallback: UserType): UserType {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw === "client" || raw === "freelancer") return raw;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function subscribeActiveRole(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getActiveRole(): UserType {
  const session = getSession();
  if (!session) return "client";

  const { id, userType } = session.user;
  if (cachedUserId === id && cachedRole) return cachedRole;

  cachedUserId = id;
  cachedRole = readStoredRole(id, userType);
  return cachedRole;
}

export function setActiveRole(role: UserType) {
  const session = getSession();
  if (!session) return;

  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey(session.user.id), role);
  }
  cachedUserId = session.user.id;
  cachedRole = role;
  listeners.forEach((l) => l());
}

export function getActiveDashboardPath(role?: UserType): string {
  const active = role ?? getActiveRole();
  return active === "freelancer" ? "/dashboard/freelancer" : "/dashboard";
}
