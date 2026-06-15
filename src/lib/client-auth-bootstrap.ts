import { getSession } from "./auth";
import { getActiveRole, getActiveDashboardPath } from "./active-role-store";

/** Inline script — must run before React hydration (in RootShell <head>). */
export const AUTH_BOOTSTRAP_INLINE = `(function(){try{var path=location.pathname.replace(/\\/$/,'')||'/';var fullPath=path+location.search;var auth=['/dashboard','/settings','/wallet','/messages','/orders','/escrow','/profile','/my-projects','/my-services','/applications','/clients/manage','/freelancers/manage','/analytics','/subscription','/saved','/checkout','/promotions','/portfolio','/services/create','/projects/create','/agency','/ai','/notifications','/agencies/create','/revenue','/admin'];var needs=auth.some(function(p){return path===p||path.indexOf(p+'/')===0;});if(!needs)return;var raw=localStorage.getItem('ishbor-session')||sessionStorage.getItem('ishbor-session');if(!raw){location.replace('/login?redirect='+encodeURIComponent(fullPath));return;}var session=JSON.parse(raw);var uid=session.user&&session.user.id;var role=session.user.userType||'client';if(uid){var stored=localStorage.getItem('ishbor-active-role-'+uid);if(stored==='client'||stored==='freelancer'||stored==='agency')role=stored;}var clientOnly=['/my-projects','/projects/create','/clients/manage','/analytics/client','/checkout'];var freelancerOnly=['/my-services','/services/create','/applications','/freelancers/manage','/analytics/freelancer','/dashboard/freelancer','/portfolio/create','/portfolio/edit','/promotions'];var agencyOnly=['/dashboard/agency','/agency','/agencies/create','/agencies/edit'];var dash=role==='freelancer'?'/dashboard/freelancer':role==='agency'?'/dashboard/agency':'/dashboard';if(agencyOnly.some(function(p){return path===p||path.indexOf(p+'/')===0;})&&role!=='agency'){location.replace(dash);return;}if(clientOnly.some(function(p){return path===p||path.indexOf(p+'/')===0;})&&role!=='client'){location.replace(dash);return;}if(freelancerOnly.some(function(p){return path===p||path.indexOf(p+'/')===0;})&&role!=='freelancer'){location.replace(dash);return;}if(path==='/portfolio'&&role!=='freelancer'){location.replace(dash);return;}if(path.indexOf('/admin')===0&&!(session.user&&session.user.isAdmin)){location.replace(dash);}}catch(e){}})();`;

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
  "/checkout",
];

const FREELANCER_ONLY_PREFIXES = [
  "/my-services",
  "/services/create",
  "/applications",
  "/freelancers/manage",
  "/analytics/freelancer",
  "/dashboard/freelancer",
  "/portfolio/create",
  "/portfolio/edit",
  "/promotions",
];

const AGENCY_ONLY_PREFIXES = [
  "/dashboard/agency",
  "/agency",
  "/agencies/create",
  "/agencies/edit",
];

function matchesPrefix(path: string, prefix: string, exactOnly = false) {
  if (exactOnly) return path === prefix;
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
    const redirect = encodeURIComponent(pathname + (typeof window !== "undefined" ? window.location.search : ""));
    window.location.replace(`/login?redirect=${redirect}`);
    return true;
  }

  const role = getActiveRole();

  if (AGENCY_ONLY_PREFIXES.some((p) => matchesPrefix(path, p)) && role !== "agency") {
    window.location.replace(getActiveDashboardPath(role));
    return true;
  }

  if (CLIENT_ONLY_PREFIXES.some((p) => matchesPrefix(path, p)) && role !== "client") {
    window.location.replace(getActiveDashboardPath(role));
    return true;
  }

  if (FREELANCER_ONLY_PREFIXES.some((p) => matchesPrefix(path, p)) && role !== "freelancer") {
    window.location.replace(getActiveDashboardPath(role));
    return true;
  }

  if (path === "/portfolio" && role !== "freelancer") {
    window.location.replace(getActiveDashboardPath(role));
    return true;
  }

  if (path.startsWith("/admin") && !session.user.isAdmin) {
    window.location.replace(getActiveDashboardPath(role));
    return true;
  }

  return false;
}
