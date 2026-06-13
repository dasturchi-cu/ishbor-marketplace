import type { AuthUser } from "./auth";
import {
  computeSuccessScore,
  computeTrustScore,
  computeResponseRate,
  computeClientTrustScore,
} from "./growth-metrics";
import { getAverageRating, getReviewsForFreelancer, getReviewsForClient } from "./reviews-store";
import { getOrdersForFreelancer, getOrdersForClient } from "./orders-store";

export type ReputationTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Elite";

export type ReputationResult = {
  tier: ReputationTier;
  trustScore: number;
  successScore: number;
  avgRating: number;
  reviewCount: number;
  responseRate: number;
  completionRate: number;
  repeatClientRate: number;
  label: string;
};

const TIER_LABELS: Record<ReputationTier, string> = {
  Bronze: "Bronza",
  Silver: "Kumush",
  Gold: "Oltin",
  Platinum: "Platina",
  Elite: "Elita",
};

export function getTierLabel(tier: ReputationTier): string {
  return TIER_LABELS[tier];
}

function resolveTier(
  trustScore: number,
  successScore: number,
  reviewCount: number,
  completedJobs: number,
): ReputationTier {
  if (trustScore >= 90 && successScore >= 85 && reviewCount >= 5 && completedJobs >= 5) return "Elite";
  if (trustScore >= 80 && successScore >= 75 && reviewCount >= 3 && completedJobs >= 3) return "Platinum";
  if (trustScore >= 70 && successScore >= 60 && reviewCount >= 2 && completedJobs >= 2) return "Gold";
  if (trustScore >= 55 || successScore >= 50 || reviewCount >= 1 || completedJobs >= 1) return "Silver";
  if (completedJobs > 0 || reviewCount > 0) return "Bronze";
  return "Bronze";
}

export function computeFreelancerReputation(username: string, user?: AuthUser): ReputationResult {
  const success = computeSuccessScore(username);
  const response = computeResponseRate(username);
  const { avg, count } = getAverageRating(username);
  const trust = user
    ? computeTrustScore(user, username)
    : { trustScore: Math.round(success.score * 0.6 + response.rate * 0.2 + avg * 8) };

  const tier = resolveTier(trust.trustScore, success.score, count, success.completedJobs);

  return {
    tier,
    trustScore: trust.trustScore,
    successScore: success.score,
    avgRating: avg,
    reviewCount: count,
    responseRate: response.rate,
    completionRate: success.completionRate,
    repeatClientRate: success.repeatClientRate,
    label: TIER_LABELS[tier],
  };
}

export function computeClientReputation(clientSlug: string, clientName: string, user?: AuthUser): ReputationResult {
  const orders = getOrdersForClient(clientSlug, clientName);
  const completed = orders.filter((o) => o.status === "completed");
  const reviews = getReviewsForClient(clientSlug);
  const { avg, count } = reviews.length > 0
    ? { avg: reviews.reduce((s, r) => s + r.rating, 0) / reviews.length, count: reviews.length }
    : { avg: 0, count: 0 };

  const clientCounts = new Map<string, number>();
  for (const o of orders) {
    if (o.freelancerUsername) {
      clientCounts.set(o.freelancerUsername, (clientCounts.get(o.freelancerUsername) ?? 0) + 1);
    }
  }
  const unique = clientCounts.size;
  const repeat = [...clientCounts.values()].filter((c) => c >= 2).length;
  const repeatRate = unique > 0 ? Math.round((repeat / unique) * 100) : 0;
  const completionRate = orders.length > 0 ? Math.round((completed.length / orders.length) * 100) : 0;

  const trust = user
    ? computeClientTrustScore(user)
    : { trustScore: Math.min(100, completionRate * 0.4 + count * 10 + (orders.length > 0 ? 20 : 0)) };

  const successScore = Math.min(100, completionRate * 0.5 + repeatRate * 0.3 + count * 5);
  const tier = resolveTier(trust.trustScore, successScore, count, completed.length);

  return {
    tier,
    trustScore: trust.trustScore,
    successScore,
    avgRating: Math.round(avg * 10) / 10,
    reviewCount: count,
    responseRate: 0,
    completionRate,
    repeatClientRate: repeatRate,
    label: TIER_LABELS[tier],
  };
}

export function getTierColor(tier: ReputationTier): string {
  switch (tier) {
    case "Elite":
      return "text-primary border-primary/30 bg-primary/10";
    case "Platinum":
      return "text-[oklch(0.55_0.05_260)] border-[oklch(0.55_0.05_260)]/30 bg-[oklch(0.55_0.05_260)]/10";
    case "Gold":
      return "text-[oklch(0.65_0.15_75)] border-[oklch(0.65_0.15_75)]/30 bg-[oklch(0.65_0.15_75)]/10";
    case "Silver":
      return "text-muted-foreground border-border bg-secondary/50";
    default:
      return "text-[oklch(0.55_0.08_45)] border-[oklch(0.55_0.08_45)]/30 bg-[oklch(0.55_0.08_45)]/10";
  }
}
