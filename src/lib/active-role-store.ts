import type { UserType } from "./auth-constants";
import type { AuthUser } from "./auth";
import { getSession, subscribe as subscribeAuth } from "./auth";

const STORAGE_PREFIX = "ishbor-active-role";

const listeners = new Set<() => void>();

let cachedUserId: string | null = null;
let cachedRole: UserType | null = null;
let storageListenerAttached = false;
let authBridgeAttached = false;

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

function notifyListeners() {
  listeners.forEach((l) => l());
}

function onCrossTabStorage(e: StorageEvent) {
  if (e.key?.startsWith(STORAGE_PREFIX) || e.key === null) {
    cachedUserId = null;
    cachedRole = null;
    notifyListeners();
  }
}

function attachStorageListener() {
  if (typeof window === "undefined" || storageListenerAttached) return;
  window.addEventListener("storage", onCrossTabStorage);
  storageListenerAttached = true;
}

function attachAuthBridge() {
  if (typeof window === "undefined" || authBridgeAttached) return;
  subscribeAuth(() => {
    const session = getSession();
    const nextUserId = session?.user.id ?? null;
    if (cachedUserId !== nextUserId) {
      cachedUserId = null;
      cachedRole = null;
      notifyListeners();
    }
  });
  authBridgeAttached = true;
}

/** Clear in-memory cache — call on logout or session user change. */
export function invalidateActiveRoleCache() {
  cachedUserId = null;
  cachedRole = null;
}

export function subscribeActiveRole(listener: () => void) {
  attachStorageListener();
  attachAuthBridge();
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
  notifyListeners();
}

export function getActiveDashboardPath(role?: UserType): string {
  const active = role ?? getActiveRole();
  return active === "freelancer" ? "/dashboard/freelancer" : "/dashboard";
}

/** Role-specific routes that must redirect when active role changes. */
const ROLE_SPECIFIC_PREFIXES: { prefix: string; role: UserType }[] = [
  { prefix: "/dashboard/freelancer", role: "freelancer" },
  { prefix: "/dashboard", role: "client" },
  { prefix: "/analytics/client", role: "client" },
  { prefix: "/analytics/freelancer", role: "freelancer" },
  { prefix: "/clients/manage", role: "client" },
  { prefix: "/freelancers/manage", role: "freelancer" },
  { prefix: "/my-projects", role: "client" },
  { prefix: "/projects/create", role: "client" },
  { prefix: "/my-services", role: "freelancer" },
  { prefix: "/services/create", role: "freelancer" },
  { prefix: "/applications", role: "freelancer" },
  { prefix: "/promotions", role: "freelancer" },
  { prefix: "/portfolio/create", role: "freelancer" },
  { prefix: "/portfolio/edit", role: "freelancer" },
];

export function pathRequiresRole(pathname: string, role: UserType): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  for (const { prefix, role: required } of ROLE_SPECIFIC_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return required === role;
    }
  }
  if (path === "/dashboard") return role === "client";
  return true;
}

export function getRedirectAfterRoleSwitch(newRole: UserType, pathname: string): string | null {
  if (pathRequiresRole(pathname, newRole)) return null;
  return getActiveDashboardPath(newRole);
}

export function getProfilePath(user: AuthUser, role?: UserType): string {
  const active = role ?? getActiveRole();
  if (active === "freelancer" && user.username) {
    return `/freelancers/${user.username}`;
  }
  if (user.companySlug) {
    return `/clients/${user.companySlug}`;
  }
  return "/profile";
}
