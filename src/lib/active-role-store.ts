import type { UserType } from "./auth-constants";
import type { AuthUser } from "./auth";
import { getSession, subscribe as subscribeAuth } from "./auth";
import { getAgenciesForUser } from "./agency-store";
import { syncSmartNotifications } from "./ai-smart-notifications";

/** Active workspace mode — includes agency when user belongs to an agency. */
export type WorkspaceRole = UserType | "agency";

const STORAGE_PREFIX = "ishbor-active-role";

const listeners = new Set<() => void>();

let cachedUserId: string | null = null;
let cachedRole: WorkspaceRole | null = null;
let storageListenerAttached = false;
let authBridgeAttached = false;

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}-${userId}`;
}

function userHasAgency(userId: string): boolean {
  return getAgenciesForUser(userId).length > 0;
}

function readStoredRole(userId: string, fallback: WorkspaceRole): WorkspaceRole {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw === "client" || raw === "freelancer" || raw === "agency") {
      if (raw === "agency" && !userHasAgency(userId)) return fallback;
      return raw;
    }
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

export function getActiveRole(): WorkspaceRole {
  const session = getSession();
  if (!session) return "client";

  const { id, userType } = session.user;
  if (cachedUserId === id && cachedRole) return cachedRole;

  cachedUserId = id;
  cachedRole = readStoredRole(id, userType);
  return cachedRole;
}

export function getAvailableWorkspaceRoles(userId?: string): WorkspaceRole[] {
  const session = getSession();
  const uid = userId ?? session?.user.id;
  if (!uid) return ["client", "freelancer"];
  const roles: WorkspaceRole[] = ["client", "freelancer"];
  if (userHasAgency(uid)) roles.push("agency");
  return roles;
}

export function setActiveRole(role: WorkspaceRole) {
  const session = getSession();
  if (!session) return;

  if (role === "agency" && !userHasAgency(session.user.id)) return;

  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey(session.user.id), role);
  }
  cachedUserId = session.user.id;
  cachedRole = role;
  notifyListeners();

  if (typeof window !== "undefined") {
    queueMicrotask(() => syncSmartNotifications(session.user.id));
  }
}

export function getActiveDashboardPath(role?: WorkspaceRole): string {
  const active = role ?? getActiveRole();
  if (active === "freelancer") return "/dashboard/freelancer";
  if (active === "agency") return "/dashboard/agency";
  return "/dashboard";
}

/** Sync workspace role to account type after login (clears stale role). */
export function resetActiveRoleOnLogin(user: AuthUser): void {
  setActiveRole(user.userType);
}

function pathMatchesPrefix(path: string, prefix: string, exactOnly?: boolean): boolean {
  if (exactOnly) return path === prefix;
  return path === prefix || path.startsWith(`${prefix}/`);
}

/** Role-specific routes that must redirect when active role changes. */
const ROLE_SPECIFIC_PREFIXES: { prefix: string; role: WorkspaceRole; exactOnly?: boolean }[] = [
  { prefix: "/dashboard/freelancer", role: "freelancer" },
  { prefix: "/dashboard/agency", role: "agency" },
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
  { prefix: "/portfolio", role: "freelancer", exactOnly: true },
  { prefix: "/portfolio/create", role: "freelancer" },
  { prefix: "/portfolio/edit", role: "freelancer" },
  { prefix: "/agency/clients", role: "agency" },
  { prefix: "/agencies/create", role: "agency" },
  { prefix: "/agencies/edit", role: "agency" },
];

export function pathRequiresRole(pathname: string, role: WorkspaceRole): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  for (const { prefix, role: required, exactOnly } of ROLE_SPECIFIC_PREFIXES) {
    if (pathMatchesPrefix(path, prefix, exactOnly)) {
      return required === role;
    }
  }
  if (path === "/dashboard") return role === "client";
  return true;
}

export function getRedirectAfterRoleSwitch(newRole: WorkspaceRole, pathname: string): string | null {
  if (pathRequiresRole(pathname, newRole)) return null;
  return getActiveDashboardPath(newRole);
}

export function getProfilePath(user: AuthUser, role?: WorkspaceRole): string {
  const active = role ?? getActiveRole();
  if (active === "freelancer" && user.username) {
    return `/freelancers/${user.username}`;
  }
  if (user.companySlug) {
    return `/clients/${user.companySlug}`;
  }
  return "/profile";
}

/** Map workspace role to profile completion / onboarding user type. */
export function toProfileUserType(role: WorkspaceRole): UserType {
  return role === "freelancer" ? "freelancer" : "client";
}
