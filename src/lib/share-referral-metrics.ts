/** Share and referral funnel metrics for founder dashboard. */

import { getAllAnalyticsEvents } from "./analytics-events-store";
import { getReferralState } from "./referral-store";

const SHARE_TYPES = [
  "profile_share",
  "service_share",
  "portfolio_share",
  "project_share",
] as const;

export type ShareMetrics = {
  totalShares7d: number;
  totalShares30d: number;
  byChannel: Record<string, number>;
  byEntity: Record<string, number>;
  topEntityId?: string;
};

export type ReferralMetrics = {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  conversionRate: number;
  creditsIssued: number;
};

function eventMs(iso: string): number {
  return new Date(iso).getTime();
}

export function getShareMetrics(): ShareMetrics {
  const events = getAllAnalyticsEvents().filter((e) =>
    SHARE_TYPES.includes(e.type as (typeof SHARE_TYPES)[number]),
  );
  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const monthAgo = now - 30 * 86400000;

  const shares7d = events.filter((e) => eventMs(e.timestamp) >= weekAgo);
  const shares30d = events.filter((e) => eventMs(e.timestamp) >= monthAgo);

  const byChannel: Record<string, number> = {};
  const byEntity: Record<string, number> = {};
  let topEntityId: string | undefined;
  let topCount = 0;

  for (const e of shares30d) {
    const channel = e.meta?.channel ?? e.meta?.method ?? "organic";
    byChannel[channel] = (byChannel[channel] ?? 0) + 1;
    const entity = e.type.replace("_share", "");
    byEntity[entity] = (byEntity[entity] ?? 0) + 1;
    if (e.entityId) {
      const key = `${entity}:${e.entityId}`;
      const count = shares30d.filter((x) => x.entityId === e.entityId && x.type === e.type).length;
      if (count > topCount) {
        topCount = count;
        topEntityId = key;
      }
    }
  }

  return {
    totalShares7d: shares7d.length,
    totalShares30d: shares30d.length,
    byChannel,
    byEntity,
    topEntityId,
  };
}

export function getReferralMetrics(userId?: string): ReferralMetrics {
  const state = getReferralState(userId);
  if (!state) {
    return {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      conversionRate: 0,
      creditsIssued: 0,
    };
  }

  const completed = state.referrals.filter((r) => r.status === "completed").length;
  const pending = state.referrals.filter((r) => r.status === "pending").length;
  const total = state.referrals.length;

  return {
    totalReferrals: total,
    completedReferrals: completed,
    pendingReferrals: pending,
    conversionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    creditsIssued: completed * 50000,
  };
}

export function getGlobalReferralMetrics(): ReferralMetrics {
  const events = getAllAnalyticsEvents().filter((e) => e.type === "referral_signup");
  const completed = events.filter((e) => e.meta?.status === "completed").length;
  const pending = events.filter((e) => e.meta?.status !== "completed").length;
  const total = events.length;

  return {
    totalReferrals: total,
    completedReferrals: completed,
    pendingReferrals: pending,
    conversionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    creditsIssued: completed * 50000,
  };
}
