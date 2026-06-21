/** Ecosystem flywheels — trust, reputation, retention, repeat usage. */

import type { Order } from "./mock-data";
import type { AuthUser } from "./auth";
import type { WorkspaceRole } from "./active-role-store";
import { getSession } from "./auth";
import {
  computeSuccessScore,
  computeTrustScore,
  computeClientTrustScore,
} from "./growth-metrics";
import {
  computeFreelancerReputation,
  computeClientReputation,
} from "./reputation-store";
import {
  getOrdersForFreelancer,
  getOrdersForUser,
  readStoredOrders,
} from "./orders-store";
import {
  getOrderReviewDirection,
  hasUserReviewedOrder,
  type ReviewInput,
} from "./reviews-store";
import { getProfileByUsername, computeProfileCompletionPercent } from "./profile-store";
import { getSaved, type SavedState } from "./saved-store";
import { computeRankingScore } from "./ranking-store";
import { recordAnalyticsEvent } from "./analytics-events-store";
import { maybeCompleteReferral } from "./referral-store";
import {
  notifyReviewPrompt,
  notifyReputationGrowth,
  notifyProfileMilestone,
  notifyRepeatClient,
} from "./notification-events";

export type EcosystemMetrics = {
  trustScore: number;
  trustLabel: string;
  successScore: number;
  rankingScore: number;
  repeatClientRate: number;
  repeatClientCount: number;
  completedOrders: number;
  pendingReviews: number;
  savedFreelancers: number;
  repeatHireCount: number;
  profileCompletion: number;
  reputationTier?: string;
};

export type ReviewImpact = {
  successDelta: number;
  trustDelta: number;
  rankingDelta: number;
  newSuccessScore: number;
  newTrustScore: number;
  newRankingScore: number;
};

function resolveUserId(username: string): string | undefined {
  return getProfileByUsername(username)?.userId;
}

export function getPendingReviewOrders(user: AuthUser): Order[] {
  return readStoredOrders().filter((o) => {
    if (o.status !== "completed") return false;
    const dir = getOrderReviewDirection(user, o);
    if (!dir) return false;
    return !hasUserReviewedOrder(o.id, dir);
  });
}

export function countPendingReviews(user: AuthUser): number {
  return getPendingReviewOrders(user).length;
}

export function getRepeatClientStats(username: string): {
  repeatClientCount: number;
  repeatClientRate: number;
  totalClients: number;
} {
  const success = computeSuccessScore(username);
  const orders = getOrdersForFreelancer(username);
  const clientCounts = new Map<string, number>();
  for (const o of orders) {
    clientCounts.set(o.client, (clientCounts.get(o.client) ?? 0) + 1);
  }
  const repeatClientCount = [...clientCounts.values()].filter((c) => c >= 2).length;
  return {
    repeatClientCount,
    repeatClientRate: success.repeatClientRate,
    totalClients: clientCounts.size,
  };
}

export function getClientRepeatHireStats(user: AuthUser): {
  repeatHireCount: number;
  uniqueFreelancers: number;
  priorFreelancerUsernames: string[];
} {
  const orders = getOrdersForUser(
    user.id,
    user.username,
    user.companySlug,
    user.company ?? user.fullName,
  ).filter((o) => o.status === "completed" && o.freelancerUsername);

  const counts = new Map<string, number>();
  for (const o of orders) {
    const u = o.freelancerUsername!;
    counts.set(u, (counts.get(u) ?? 0) + 1);
  }
  const priorFreelancerUsernames = [...counts.keys()];
  const repeatHireCount = [...counts.values()].filter((c) => c >= 2).length;
  return {
    repeatHireCount,
    uniqueFreelancers: counts.size,
    priorFreelancerUsernames,
  };
}

export function getSavedFavoriteFreelancers(userId: string): SavedState["freelancers"] {
  return getSaved(userId).freelancers;
}

export function hasPriorOrderWithFreelancer(user: AuthUser, freelancerUsername: string): boolean {
  return getClientRepeatHireStats(user).priorFreelancerUsernames.includes(freelancerUsername);
}

export function isRepeatClientForFreelancer(freelancerUsername: string, clientUser: AuthUser): boolean {
  const orders = getOrdersForFreelancer(freelancerUsername).filter(
    (o) =>
      o.status === "completed" &&
      (o.ownerUserId === clientUser.id ||
        (clientUser.companySlug && o.clientSlug === clientUser.companySlug) ||
        o.client === clientUser.fullName ||
        (clientUser.company && o.client === clientUser.company)),
  );
  return orders.length >= 2;
}

export function getFreelancerEcosystemMetrics(user: AuthUser): EcosystemMetrics {
  const username = user.username ?? "";
  const trust = username ? computeTrustScore(user, username) : computeTrustScore(user);
  const success = username ? computeSuccessScore(username) : computeSuccessScore("");
  const repeat = username ? getRepeatClientStats(username) : { repeatClientCount: 0, repeatClientRate: 0, totalClients: 0 };
  const reputation = username ? computeFreelancerReputation(username, user) : null;
  const rankingScore = username
    ? computeRankingScore({ username, user, entityId: username, entityType: "freelancer" })
    : 0;

  return {
    trustScore: trust.trustScore,
    trustLabel: trust.label,
    successScore: success.score,
    rankingScore,
    repeatClientRate: repeat.repeatClientRate,
    repeatClientCount: repeat.repeatClientCount,
    completedOrders: success.completedJobs,
    pendingReviews: countPendingReviews(user),
    savedFreelancers: 0,
    repeatHireCount: 0,
    profileCompletion: computeProfileCompletionPercent(user.id, "freelancer"),
    reputationTier: reputation?.label,
  };
}

export function getClientEcosystemMetrics(user: AuthUser): EcosystemMetrics {
  const trust = computeClientTrustScore(user);
  const repeat = getClientRepeatHireStats(user);
  const saved = getSaved(user.id);
  const reputation = computeClientReputation(
    user.companySlug ?? "",
    user.fullName,
    user,
  );
  const completedOrders = getOrdersForUser(
    user.id,
    user.username,
    user.companySlug,
    user.company ?? user.fullName,
  ).filter((o) => o.status === "completed").length;

  return {
    trustScore: trust.trustScore,
    trustLabel: trust.label,
    successScore: reputation.successScore,
    rankingScore: 0,
    repeatClientRate: reputation.repeatClientRate,
    repeatClientCount: repeat.repeatHireCount,
    completedOrders,
    pendingReviews: countPendingReviews(user),
    savedFreelancers: saved.freelancers.length,
    repeatHireCount: repeat.repeatHireCount,
    profileCompletion: computeProfileCompletionPercent(user.id, "client"),
    reputationTier: reputation.label,
  };
}

export function getEcosystemMetrics(user: AuthUser, role: WorkspaceRole): EcosystemMetrics {
  return role === "client"
    ? getClientEcosystemMetrics(user)
    : getFreelancerEcosystemMetrics(user);
}

export function measureReviewImpact(username: string, rating: number): ReviewImpact {
  const profile = getProfileByUsername(username);
  const beforeSuccess = computeSuccessScore(username);
  const beforeRanking = computeRankingScore({
    username,
    userId: profile?.userId,
    entityId: username,
    entityType: "freelancer",
  });
  const beforeTrust = profile?.userId
    ? computeTrustScore(
        {
          id: profile.userId,
          email: "",
          fullName: "",
          userType: "freelancer",
          username,
          avatarHue: 250,
          verified: false,
        },
        username,
      ).trustScore
    : Math.round(beforeSuccess.score * 0.6);

  const projectedSuccess = Math.min(100, beforeSuccess.score + Math.round(rating * 0.8));
  const projectedTrust = Math.min(100, beforeTrust + Math.round(rating * 0.5));
  const projectedRanking = Math.min(100, beforeRanking + Math.round(rating * 0.6));
  return {
    successDelta: projectedSuccess - beforeSuccess.score,
    trustDelta: projectedTrust - beforeTrust,
    rankingDelta: projectedRanking - beforeRanking,
    newSuccessScore: projectedSuccess,
    newTrustScore: projectedTrust,
    newRankingScore: projectedRanking,
  };
}

function maybeCompleteReferralOnFirstOrder(userId: string): void {
  const orders = readStoredOrders().filter(
    (o) => o.ownerUserId === userId && o.status === "completed",
  );
  if (orders.length === 1) {
    maybeCompleteReferral(userId, "order_completed");
  }
}

/** Order yakunlanganda — review prompt, reputation, repeat client, referral. */
export function handleOrderCompleted(order: Order): void {
  if (order.ownerUserId) {
    maybeCompleteReferralOnFirstOrder(order.ownerUserId);
    notifyReviewPrompt(order.ownerUserId, order.title, order.id);
  }

  if (order.freelancerUsername) {
    const freelancerUserId = resolveUserId(order.freelancerUsername);
    const success = computeSuccessScore(order.freelancerUsername);
    if (freelancerUserId) {
      notifyReputationGrowth(
        freelancerUserId,
        "Muvaffaqiyat balli yangilandi",
        `Yakunlangan ishlar: ${success.completedJobs}. Muvaffaqiyat: ${success.score}/100 — qidiruvda yuqoriroq ko'rinasiz.`,
        `/freelancers/${order.freelancerUsername}`,
      );
      notifyReviewPrompt(freelancerUserId, order.title, order.id);

      const prior = getOrdersForFreelancer(order.freelancerUsername).filter(
        (o) =>
          o.status === "completed" &&
          o.id !== order.id &&
          (o.clientSlug === order.clientSlug || o.client === order.client),
      );
      if (prior.length >= 1) {
        notifyRepeatClient(freelancerUserId, order.client, success.repeatClientRate);
      }
    }
  }
}

/** Sharh yuborilganda — trust/ranking ta'sirini bildirish. */
export function handleReviewSubmitted(input: ReviewInput): ReviewImpact | null {
  if (input.direction !== "client_to_freelancer" || !input.freelancerUsername) return null;

  const profile = getProfileByUsername(input.freelancerUsername);
  const impact = measureReviewImpact(input.freelancerUsername, input.rating);

  if (profile?.userId) {
    notifyReputationGrowth(
      profile.userId,
      "Reyting va ishonch oshdi",
      `${input.rating}★ sharh qoldirildi. Muvaffaqiyat ~${impact.newSuccessScore}, qidiruv reytingi ~${impact.newRankingScore}.`,
      `/freelancers/${input.freelancerUsername}`,
    );
  }

  const session = getSession();
  if (session) {
    notifyReputationGrowth(
      session.user.id,
      "Sharh qabul qilindi",
      "Sharhingiz ishonch ekotizimiga qo'shildi. Rahmat!",
      "/orders",
    );
  }

  return impact;
}

const MILESTONES = [80, 100] as const;

/** Profil to'ldirilganda milestone mukofotlari. */
export function handleProfileCompletionChange(
  userId: string,
  role: WorkspaceRole,
  previousPercent: number,
  nextPercent: number,
): void {
  for (const milestone of MILESTONES) {
    if (previousPercent < milestone && nextPercent >= milestone) {
      notifyProfileMilestone(userId, milestone);
      recordAnalyticsEvent({
        type: "profile_view",
        entityId: userId,
        value: milestone,
        meta: { milestone: String(milestone), role },
      });
    }
  }
}

/** Saqlangan frilanser — retention loop. */
export function handleFavoriteFreelancer(userId: string, username: string): void {
  recordAnalyticsEvent({
    type: "service_save",
    entityId: username,
    meta: { kind: "favorite_freelancer" },
  });
  notifyReputationGrowth(
    userId,
    "Sevimli frilanser saqlandi",
    "Saqlanganlar bo'limidan tez qayta yollashingiz mumkin — takroriy hamkorlik ishonchni oshiradi.",
    "/saved",
  );
}

export function formatProgressDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return String(delta);
  return "0";
}
