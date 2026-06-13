import { redirect } from "@tanstack/react-router";
import type { UserType } from "./auth-constants";
import { getSession, getDefaultDashboard } from "./auth";

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
    if (!roles.includes(session.user.userType)) {
      throw redirect({ to: getDefaultDashboard(session.user.userType) });
    }
  };
}
