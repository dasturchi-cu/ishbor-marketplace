import { redirect } from "@tanstack/react-router";
import type { UserType } from "./auth-constants";
import { getSession, getDefaultDashboard, isAdminUser } from "./auth";
import { getActiveRole } from "./active-role-store";

type GuardContext = {
  location: { href: string; pathname: string };
};

export function requireAuth(ctx: GuardContext) {
  if (typeof window === "undefined") return;
  const session = getSession();
  if (!session) {
    throw redirect({
      to: "/login",
      search: { redirect: ctx.location.pathname },
    });
  }
}

export function requireGuest(ctx: GuardContext) {
  if (typeof window === "undefined") return;
  const session = getSession();
  if (session) {
    throw redirect({ to: getDefaultDashboard(session.user.userType) });
  }
}

export function requireRole(roles: UserType[]) {
  return (ctx: GuardContext) => {
    if (typeof window === "undefined") return;
    const session = getSession();
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: ctx.location.pathname },
      });
    }
    const activeRole = getActiveRole();
    if (!roles.includes(activeRole)) {
      throw redirect({ to: getDefaultDashboard(activeRole) });
    }
  };
}

export function requireAdmin(ctx: GuardContext) {
  if (typeof window === "undefined") return;
  const session = getSession();
  if (!session) {
    throw redirect({
      to: "/login",
      search: { redirect: ctx.location.pathname },
    });
  }
  if (!isAdminUser(session.user)) {
    throw redirect({ to: getDefaultDashboard(session.user.userType) });
  }
}
