import { computeSuccessScore, computeResponseRate, computeTrustScore } from "./growth-metrics";
import { getAverageRating } from "./reviews-store";
import { isFeaturedActive, isProfileFeatured } from "./featured-store";
import { getPlanRankingBoost } from "./subscription-store";
import { getEntityEventCount } from "./analytics-utils";
import {
  getRecentReviewBoost,
  getReputationRankBoost,
  getRecentActivityBoost,
  getRepeatClientRankBoost,
  resolveSellerUserId,
} from "./marketplace-signals";
import { getProfileByUsername } from "./profile-store";
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

function resolveTrustScore(username: string, user?: AuthUser): number {
  if (user && username) {
    return computeTrustScore(user, username).trustScore;
  }
  const profile = getProfileByUsername(username);
  if (profile) {
    const authLike: AuthUser = {
      id: profile.userId,
      email: "",
      fullName: profile.username ?? username,
      userType: "freelancer",
      username,
      avatarHue: 250,
      verified: false,
    };
    return computeTrustScore(authLike, username).trustScore;
  }
  const success = computeSuccessScore(username);
  const response = computeResponseRate(username);
  return Math.min(100, Math.round(success.score * 0.6 + response.rate * 0.2));
}

/** Ranking score 0–100 — trust, reputation, reviews, recent activity (real data only). */
export function computeRankingScore(input: RankingInput): number {
  const username = input.username ?? "";
  const success = username ? computeSuccessScore(username) : { score: 0, avgRating: 0, reviewCount: 0 };
  const response = username ? computeResponseRate(username) : { rate: 0 };
  const trust = username ? resolveTrustScore(username, input.user) : 0;
  const { avg, count } = username ? getAverageRating(username) : { avg: 0, count: 0 };

  let featuredBoost = 0;
  if (input.featured && isFeaturedActive(input.featured, input.featuredUntil)) {
    featuredBoost = 20;
  }
  const userId = input.userId ?? (username ? resolveSellerUserId(username) : undefined);
  if (userId && isProfileFeatured(userId)) {
    featuredBoost = Math.max(featuredBoost, 15);
  }

  const planBoost = userId ? getPlanRankingBoost(userId) : 0;

  let discoveryScore = 0;
  if (input.entityId && input.entityType) {
    const views =
      getEntityEventCount(`${input.entityType}_view`, input.entityId) +
      getEntityEventCount("profile_view", input.entityId) +
      getEntityEventCount("service_view", input.entityId);
    discoveryScore = Math.min(8, views);
  }

  const reviewScore = count > 0 ? Math.min(12, avg * 2.4) : 0;
  const reputationBoost = username ? getReputationRankBoost(username) : 0;
  const recentReviewBoost = username ? getRecentReviewBoost(username) : 0;
  const recentActivityBoost =
    input.entityId && input.entityType
      ? getRecentActivityBoost(
          input.entityId,
          input.entityType === "freelancer" ? "freelancer" : input.entityType === "service" ? "service" : "project",
          username || undefined,
        )
      : 0;
  const repeatBoost = username ? getRepeatClientRankBoost(username) : 0;

  const raw =
    trust * 0.2 +
    success.score * 0.22 +
    response.rate * 0.1 +
    reviewScore +
    reputationBoost +
    recentReviewBoost +
    recentActivityBoost +
    repeatBoost +
    featuredBoost +
    planBoost +
    discoveryScore;

  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function rankFreelancers(freelancers: Freelancer[]): (Freelancer & { rankingScore: number })[] {
  return freelancers
    .map((f) => ({
      ...f,
      rankingScore: computeRankingScore({
        username: f.username,
        entityId: f.username,
        entityType: "freelancer",
        userId: resolveSellerUserId(f.username),
      }),
    }))
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
        userId: resolveSellerUserId(s.sellerUsername),
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
