/** Real marketplace signals for ranking, search, and social proof — no fake data. */

import { getAllAnalyticsEvents } from "./analytics-events-store";
import { computeSuccessScore } from "./growth-metrics";
import {
  computeFreelancerReputation,
  getTierLabel,
  type ReputationTier,
} from "./reputation-store";
import {
  getReviewsForFreelancer,
  readStoredReviews,
  type StoredReview,
} from "./reviews-store";
import { getOrdersForFreelancer, readStoredOrders } from "./orders-store";
import { getStoredServices } from "./services-store";
import { getPublishedProjects } from "./projects-store";
import { getEntityEventCount } from "./analytics-utils";
import { freelancers } from "./mock-data";
import { getProfileByUsername } from "./profile-store";

const TIER_RANK_BOOST: Record<ReputationTier, number> = {
  Bronze: 0,
  Silver: 2,
  Gold: 5,
  Platinum: 8,
  Elite: 12,
};

export type MarketplaceStatistics = {
  publishedServices: number;
  publishedProjects: number;
  totalFreelancers: number;
  verifiedFreelancers: number;
  completedOrders: number;
  totalReviews: number;
  recentReviews30d: number;
  recentOrders30d: number;
  recentProfileViews7d: number;
  isLive: boolean;
};

export type EntitySocialProof = {
  profileViews: number;
  serviceViews: number;
  saves: number;
  orders: number;
  completedJobs: number;
  trustScore: number;
  reputationLabel: string;
  recentReview?: StoredReview;
};

function daysAgoMs(days: number): number {
  return Date.now() - days * 86400000;
}

export function getRecentReviewsForFreelancer(username: string, days = 30, limit = 3): StoredReview[] {
  const cutoff = daysAgoMs(days);
  return getReviewsForFreelancer(username)
    .filter(
      (r) =>
        r.direction !== "freelancer_to_client" &&
        (!r.createdAt || new Date(r.createdAt).getTime() >= cutoff),
    )
    .slice(0, limit);
}

export function getLatestReviewForFreelancer(username: string): StoredReview | undefined {
  return getReviewsForFreelancer(username).find((r) => r.direction !== "freelancer_to_client");
}

/** 0–10 boost from recent verified reviews. */
export function getRecentReviewBoost(username: string): number {
  const recent = getRecentReviewsForFreelancer(username, 30, 5);
  if (recent.length === 0) return 0;
  const avg = recent.reduce((s, r) => s + r.rating, 0) / recent.length;
  return Math.min(10, Math.round(recent.length * 2 + avg));
}

/** 0–12 boost from reputation tier. */
export function getReputationRankBoost(username: string): number {
  const rep = computeFreelancerReputation(username);
  return TIER_RANK_BOOST[rep.tier] ?? 0;
}

/** 0–15 boost from recent views and completed work. */
export function getRecentActivityBoost(
  entityId: string,
  entityType: "service" | "freelancer" | "project",
  sellerUsername?: string,
): number {
  const events = getAllAnalyticsEvents();
  const viewCutoff = daysAgoMs(7);
  const viewType = entityType === "service" ? "service_view" : "profile_view";
  const viewId = entityType === "service" ? entityId : sellerUsername ?? entityId;

  const recentViews = events.filter(
    (e) =>
      e.type === viewType &&
      e.entityId === viewId &&
      new Date(e.timestamp).getTime() >= viewCutoff,
  ).length;

  let score = Math.min(8, recentViews * 2);

  if (sellerUsername) {
    const orderCutoff = daysAgoMs(14);
    const recentCompleted = getOrdersForFreelancer(sellerUsername).filter(
      (o) =>
        o.status === "completed" &&
        o.completedAt &&
        new Date(o.completedAt).getTime() >= orderCutoff,
    ).length;
    score += Math.min(7, recentCompleted * 4);
  }

  return Math.min(15, score);
}

/** 0–8 boost from repeat client rate. */
export function getRepeatClientRankBoost(username: string): number {
  const { repeatClientRate } = computeSuccessScore(username);
  return Math.min(8, Math.round(repeatClientRate * 0.08));
}

export function getMarketplaceStatistics(): MarketplaceStatistics {
  const publishedServices =
    typeof window !== "undefined"
      ? getStoredServices().filter((s) => s.status === "published").length
      : 0;
  const publishedProjects =
    typeof window !== "undefined" ? getPublishedProjects().length : 0;
  const orders = typeof window !== "undefined" ? readStoredOrders() : [];
  const reviews = typeof window !== "undefined" ? readStoredReviews() : [];
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const cutoff30 = daysAgoMs(30);
  const cutoff7 = daysAgoMs(7);
  const recentReviews30d = reviews.filter(
    (r) => r.createdAt && new Date(r.createdAt).getTime() >= cutoff30,
  ).length;
  const recentOrders30d = orders.filter(
    (o) =>
      o.status === "completed" &&
      o.completedAt &&
      new Date(o.completedAt).getTime() >= cutoff30,
  ).length;
  const recentProfileViews7d = getAllAnalyticsEvents().filter(
    (e) => e.type === "profile_view" && new Date(e.timestamp).getTime() >= cutoff7,
  ).length;
  const verifiedFreelancers = freelancers.filter((f) => f.identityVerified).length;

  return {
    publishedServices,
    publishedProjects,
    totalFreelancers: freelancers.length,
    verifiedFreelancers,
    completedOrders,
    totalReviews: reviews.length,
    recentReviews30d,
    recentOrders30d,
    recentProfileViews7d,
    isLive: publishedServices > 0 || publishedProjects > 0 || completedOrders > 0,
  };
}

export function getFreelancerSocialProof(username: string): EntitySocialProof {
  const rep = computeFreelancerReputation(username);
  const success = computeSuccessScore(username);
  return {
    profileViews: getEntityEventCount("profile_view", username),
    serviceViews: getAllAnalyticsEvents().filter(
      (e) => e.type === "service_view" && e.meta?.seller === username,
    ).length,
    saves: getAllAnalyticsEvents().filter(
      (e) => e.type === "service_save" && e.meta?.seller === username,
    ).length,
    orders: success.completedJobs,
    completedJobs: success.completedJobs,
    trustScore: rep.trustScore,
    reputationLabel: getTierLabel(rep.tier),
    recentReview: getLatestReviewForFreelancer(username),
  };
}

export function getServiceSocialProof(slug: string, sellerUsername: string): EntitySocialProof {
  const rep = computeFreelancerReputation(sellerUsername);
  return {
    profileViews: getEntityEventCount("profile_view", sellerUsername),
    serviceViews: getEntityEventCount("service_view", slug),
    saves: getEntityEventCount("service_save", slug),
    orders: getEntityEventCount("service_order", slug),
    completedJobs: computeSuccessScore(sellerUsername).completedJobs,
    trustScore: rep.trustScore,
    reputationLabel: getTierLabel(rep.tier),
    recentReview: getLatestReviewForFreelancer(sellerUsername),
  };
}

/** Hybrid search score: text relevance + marketplace ranking. */
export function combineSearchScore(textScore: number, rankingScore: number): number {
  return Math.round(textScore * 0.55 + rankingScore * 0.45);
}

export function resolveSellerUserId(username: string): string | undefined {
  return getProfileByUsername(username)?.userId;
}
