import { computeSuccessScore, computeResponseRate, computeTrustScore } from "./growth-metrics";
import { getAverageRating } from "./reviews-store";
import { isFeaturedActive, isProfileFeatured } from "./featured-store";
import { getPlanRankingBoost } from "./subscription-store";
import { getEntityEventCount } from "./analytics-utils";
import type { AuthUser } from "./auth";
import type { Freelancer } from "./mock-data";
import type { StoredService } from "./services-store";
import type { Project } from "./mock-data";

export type RankingInput = {
  featured?: boolean;
  featuredUntil?: string;
  userId?: string;
  username?: string;
  user?: AuthUser;
  entityId?: string;
  entityType?: "service" | "project" | "freelancer" | "portfolio";
};

/** Ranking score 0–100 from stored user actions only */
export function computeRankingScore(input: RankingInput): number {
  const username = input.username ?? "";
  const success = username ? computeSuccessScore(username) : { score: 0, avgRating: 0, reviewCount: 0 };
  const response = username ? computeResponseRate(username) : { rate: 0 };
  const trust = input.user && username
    ? computeTrustScore(input.user, username).trustScore
    : success.score * 0.6 + response.rate * 0.2;
  const { avg, count } = username ? getAverageRating(username) : { avg: 0, count: 0 };

  let featuredBoost = 0;
  if (input.featured && isFeaturedActive(input.featured, input.featuredUntil)) {
    featuredBoost = 20;
  }
  if (input.userId && isProfileFeatured(input.userId)) {
    featuredBoost = Math.max(featuredBoost, 15);
  }

  const planBoost = input.userId ? getPlanRankingBoost(input.userId) : 0;

  let activityScore = 0;
  if (input.entityId && input.entityType) {
    const views = getEntityEventCount(`${input.entityType}_view`, input.entityId)
      + getEntityEventCount("profile_view", input.entityId)
      + getEntityEventCount("service_view", input.entityId);
    activityScore = Math.min(15, views);
  }

  const reviewScore = count > 0 ? Math.min(10, avg * 2) : 0;

  const raw =
    trust * 0.25 +
    success.score * 0.25 +
    response.rate * 0.15 +
    reviewScore +
    featuredBoost +
    planBoost +
    activityScore;

  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function rankFreelancers(freelancers: Freelancer[]): (Freelancer & { rankingScore: number })[] {
  return freelancers
    .map((f) => ({ ...f, rankingScore: computeRankingScore({ username: f.username, entityId: f.username, entityType: "freelancer" }) }))
    .sort((a, b) => b.rankingScore - a.rankingScore);
}

export function rankServices(services: StoredService[]): (StoredService & { rankingScore: number })[] {
  return services
    .map((s) => ({
      ...s,
      rankingScore: computeRankingScore({
        username: s.sellerUsername,
        featured: s.featured,
        featuredUntil: s.featuredUntil,
        entityId: s.slug,
        entityType: "service",
      }),
    }))
    .sort((a, b) => b.rankingScore - a.rankingScore);
}

export function rankProjects(projects: Project[]): (Project & { rankingScore: number })[] {
  return projects
    .map((p) => ({
      ...p,
      rankingScore: computeRankingScore({
        featured: p.featured,
        featuredUntil: p.featuredUntil,
        entityId: p.slug,
        entityType: "project",
      }),
    }))
    .sort((a, b) => b.rankingScore - a.rankingScore);
}
