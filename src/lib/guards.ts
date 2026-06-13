import { redirect } from "@tanstack/react-router";
import type { UserType } from "./auth-constants";
import { getSession, isAdminUser } from "./auth";
import { getActiveRole, getActiveDashboardPath } from "./active-role-store";

type GuardContext = {
  location: { href: string; pathname: string; search?: string | Record<string, unknown> };
};

function resolvePostLoginPath(ctx: GuardContext): string {
  try {
    const href = ctx.location.href;
    if (href.includes("redirect=")) {
      const url = new URL(href, "http://localhost");
      const redirect = url.searchParams.get("redirect");
      if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
        return redirect;
      }
    }
    const search = ctx.location.search;
    if (search && typeof search === "object" && "redirect" in search) {
      const redirect = search.redirect;
      if (typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//")) {
        return redirect;
      }
    }
  } catch {
    /* ignore */
  }
  return getActiveDashboardPath(getActiveRole());
}

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
    throw redirect({ to: resolvePostLoginPath(ctx) });
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
      throw redirect({ to: getActiveDashboardPath(activeRole) });
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
    throw redirect({ to: getActiveDashboardPath(getActiveRole()) });
  }
}
