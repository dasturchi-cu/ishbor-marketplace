import type { AuthUser } from "./auth";
import { getActiveRole, toProfileUserType } from "./active-role-store";
import { computeProfileCompletionPercent } from "./profile-store";
import { getPublishedPortfoliosByUsername } from "./portfolio-store";
import { getMyPublishedServices } from "./services-store";
import { computeTrustScore, computeSuccessScore, computeResponseRate } from "./growth-metrics";
import { getEntityEventCount } from "./analytics-utils";
import { readStoredApplications } from "./applications-store";
import { getAgenciesForUser } from "./agency-store";

export type OpportunityBreakdown = {
  profileCompletion: number;
  portfolio: number;
  services: number;
  trust: number;
  activity: number;
  total: number;
};

/** Opportunity score 0–100 from real stored user data */
export function computeOpportunityScore(user: AuthUser): OpportunityBreakdown {
  const username = user.username ?? "";
  const userType = toProfileUserType(getActiveRole());

  const profilePct = computeProfileCompletionPercent(user.id, userType);
  const profileCompletion = Math.round(profilePct * 0.25);

  let portfolio = 0;
  if (userType === "freelancer") {
    const portfolios = username ? getPublishedPortfoliosByUsername(username) : [];
    portfolio = Math.min(20, portfolios.length * 7);
  } else {
    portfolio = profilePct >= 80 ? 15 : 0;
  }

  let services = 0;
  if (userType === "freelancer") {
    const svc = getMyPublishedServices(user.id);
    services = Math.min(15, svc.length * 8);
  }

  const trust = username
    ? Math.round(computeTrustScore(user, username).trustScore * 0.2)
    : Math.round(profilePct * 0.15);

  let activity = 0;
  if (username) {
    const views = getEntityEventCount("profile_view", username);
    const apps = readStoredApplications().filter((a) => a.freelancerUsername === username).length;
    activity = Math.min(15, views + apps);
  }

  const agencies = getAgenciesForUser(user.id);
  if (agencies.length > 0) activity += 5;

  const total = Math.min(100, profileCompletion + portfolio + services + trust + activity);

  return { profileCompletion, portfolio, services, trust, activity, total };
}

export function getOpportunityLabel(score: number): string {
  if (score >= 80) return "Yuqori imkoniyat";
  if (score >= 60) return "Yaxshi imkoniyat";
  if (score >= 40) return "O'sish potensiali";
  return "Boshlang'ich";
}
