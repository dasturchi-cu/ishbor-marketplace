import { getSession } from "./auth";
import { getActiveRole, getActiveDashboardPath } from "./active-role-store";

/** Inline script — must run before React hydration (in RootShell <head>). */
export const AUTH_BOOTSTRAP_INLINE = `(function(){try{var path=location.pathname.replace(/\\/$/,'')||'/';var auth=['/dashboard','/settings','/wallet','/messages','/orders','/escrow','/profile','/my-projects','/my-services','/applications','/clients/manage','/freelancers/manage','/analytics','/subscription','/saved','/checkout','/promotions','/portfolio','/services/create','/projects/create','/agency','/ai','/notifications','/agencies/create','/revenue','/admin'];var needs=auth.some(function(p){return path===p||path.indexOf(p+'/')===0;});if(!needs)return;var raw=localStorage.getItem('ishbor-session')||sessionStorage.getItem('ishbor-session');if(!raw){location.replace('/login?redirect='+encodeURIComponent(location.pathname));return;}var session=JSON.parse(raw);var uid=session.user&&session.user.id;var role=session.user.userType||'client';if(uid){var stored=localStorage.getItem('ishbor-active-role-'+uid);if(stored==='client'||stored==='freelancer')role=stored;}var clientOnly=['/my-projects','/projects/create','/clients/manage','/analytics/client'];var freelancerOnly=['/my-services','/services/create','/applications','/freelancers/manage','/analytics/freelancer','/promotions','/dashboard/freelancer'];var dash=role==='freelancer'?'/dashboard/freelancer':'/dashboard';if(clientOnly.some(function(p){return path===p||path.indexOf(p+'/')===0;})&&role!=='client'){location.replace(dash);return;}if(freelancerOnly.some(function(p){return path===p||path.indexOf(p+'/')===0;})&&role!=='freelancer'){location.replace(dash);return;}if(path.indexOf('/admin')===0&&!(session.user&&session.user.isAdmin)){location.replace(dash);}}catch(e){}})();`;

const AUTH_REQUIRED_PREFIXES = [
  "/dashboard",
  "/settings",
  "/wallet",
  "/messages",
  "/orders",
  "/escrow",
  "/profile",
  "/my-projects",
  "/my-services",
  "/applications",
  "/clients/manage",
  "/freelancers/manage",
  "/analytics",
  "/subscription",
  "/saved",
  "/checkout",
  "/promotions",
  "/portfolio/create",
  "/portfolio/edit",
  "/services/create",
  "/projects/create",
  "/agency",
  "/ai",
  "/notifications",
  "/agencies/create",
  "/revenue",
];

const CLIENT_ONLY_PREFIXES = [
  "/my-projects",
  "/projects/create",
  "/clients/manage",
  "/analytics/client",
];

const FREELANCER_ONLY_PREFIXES = [
  "/my-services",
  "/services/create",
  "/applications",
  "/freelancers/manage",
  "/analytics/freelancer",
  "/promotions",
  "/dashboard/freelancer",
  "/portfolio/create",
  "/portfolio/edit",
];

function matchesPrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/** Runs once on client boot — enforces auth/role before TanStack hydration edge cases. */
export function runClientAuthBootstrap(pathname: string): boolean {
  if (typeof window === "undefined") return false;

  const path = pathname.replace(/\/$/, "") || "/";
  const needsAuth = AUTH_REQUIRED_PREFIXES.some((p) => matchesPrefix(path, p));
  if (!needsAuth) return false;

  const session = getSession();
  if (!session) {
    const redirect = encodeURIComponent(pathname);
    window.location.replace(`/login?redirect=${redirect}`);
    return true;
  }

  const role = getActiveRole();

  if (CLIENT_ONLY_PREFIXES.some((p) => matchesPrefix(path, p)) && role !== "client") {
    window.location.replace(getActiveDashboardPath(role));
    return true;
  }

  if (FREELANCER_ONLY_PREFIXES.some((p) => matchesPrefix(path, p)) && role !== "freelancer") {
    window.location.replace(getActiveDashboardPath(role));
    return true;
  }

  if (path.startsWith("/admin") && !session.user.isAdmin) {
    window.location.replace(getActiveDashboardPath(role));
    return true;
  }

  return false;
}
