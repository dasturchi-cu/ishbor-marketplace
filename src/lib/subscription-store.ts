import { getSession } from "./auth";
import { recordRevenueEntry } from "./revenue-store";
import { recordAnalyticsEvent } from "./analytics-events-store";
import { addNotification } from "./notifications-store";
import { bumpStoreVersion, STORE_KEYS } from "./store-version";

const STORAGE_KEY = "ishbor-subscriptions";
const USAGE_KEY = "ishbor-subscription-usage";
const listeners = new Set<() => void>();

export type PlanId = "free" | "pro" | "elite";

export type Subscription = {
  userId: string;
  plan: PlanId;
  status: "active" | "cancelled" | "past_due";
  startedAt: string;
  renewsAt: string;
  cancelledAt?: string;
};

const EMPTY_SUBS: Record<string, Subscription> = {};
let subsCache: Record<string, Subscription> | null = null;
const defaultSubCache = new Map<string, Subscription>();

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceMonthly: number;
  proposalsPerMonth: number | null;
  maxServices: number | null;
  featuredProfile: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  featuredListings: boolean;
  eliteBadge: boolean;
  priorityRanking: boolean;
  featuredDiscount: number;
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Bepul",
    priceMonthly: 0,
    proposalsPerMonth: 10,
    maxServices: 3,
    featuredProfile: false,
    prioritySupport: false,
    advancedAnalytics: false,
    featuredListings: false,
    eliteBadge: false,
    priorityRanking: false,
    featuredDiscount: 0,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 99000,
    proposalsPerMonth: null,
    maxServices: 20,
    featuredProfile: true,
    prioritySupport: true,
    advancedAnalytics: true,
    featuredListings: false,
    eliteBadge: false,
    priorityRanking: false,
    featuredDiscount: 0.1,
  },
  elite: {
    id: "elite",
    name: "Elite",
    priceMonthly: 249000,
    proposalsPerMonth: null,
    maxServices: null,
    featuredProfile: true,
    prioritySupport: true,
    advancedAnalytics: true,
    featuredListings: true,
    eliteBadge: true,
    priorityRanking: true,
    featuredDiscount: 0.2,
  },
};

type MonthlyUsage = { month: string; proposals: number };

function notify() {
  bumpStoreVersion(STORE_KEYS.subscriptions);
  listeners.forEach((l) => l());
}

export function subscribeSubscriptions(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Record<string, Subscription> {
  if (typeof window === "undefined") return EMPTY_SUBS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Subscription>) : EMPTY_SUBS;
  } catch {
    return EMPTY_SUBS;
  }
}

function writeAll(data: Record<string, Subscription>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  subsCache = data;
  notify();
}

function readUsage(): Record<string, MonthlyUsage> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, MonthlyUsage>) : {};
  } catch {
    return {};
  }
}

function writeUsage(data: Record<string, MonthlyUsage>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USAGE_KEY, JSON.stringify(data));
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function defaultSub(userId: string): Subscription {
  const now = new Date();
  const renews = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return {
    userId,
    plan: "free",
    status: "active",
    startedAt: now.toISOString(),
    renewsAt: renews.toISOString(),
  };
}

export function getSubscription(userId?: string): Subscription {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return getCachedDefaultSub("guest");
  if (subsCache === null) subsCache = readAll();
  return subsCache[uid] ?? getCachedDefaultSub(uid);
}

function getCachedDefaultSub(userId: string): Subscription {
  const cached = defaultSubCache.get(userId);
  if (cached) return cached;
  const sub = defaultSub(userId);
  defaultSubCache.set(userId, sub);
  return sub;
}

export function getPlan(userId?: string): PlanDefinition {
  return PLANS[getSubscription(userId).plan];
}

export function getProposalUsage(userId?: string): { used: number; limit: number | null } {
  const uid = userId ?? getSession()?.user.id;
  const plan = getPlan(uid);
  const usage = readUsage();
  const month = currentMonth();
  const used = uid ? (usage[`${uid}:${month}`]?.proposals ?? 0) : 0;
  return { used, limit: plan.proposalsPerMonth };
}

export function canSubmitProposal(userId?: string): boolean {
  const { used, limit } = getProposalUsage(userId);
  if (limit === null) return true;
  return used < limit;
}

export function recordProposalSubmitted(userId?: string): void {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return;
  const usage = readUsage();
  const key = `${uid}:${currentMonth()}`;
  const cur = usage[key] ?? { month: currentMonth(), proposals: 0 };
  usage[key] = { ...cur, proposals: cur.proposals + 1 };
  writeUsage(usage);
  notify();
}

export function canCreateService(userId: string, currentCount: number): boolean {
  const max = getPlan(userId).maxServices;
  if (max === null) return true;
  return currentCount < max;
}

export function hasAdvancedAnalytics(userId?: string): boolean {
  return getPlan(userId).advancedAnalytics;
}

export function getFeaturedDiscount(userId?: string): number {
  return getPlan(userId).featuredDiscount;
}

export function getPlanRankingBoost(userId?: string): number {
  const plan = getSubscription(userId).plan;
  if (plan === "elite") return 25;
  if (plan === "pro") return 10;
  return 0;
}

function activatePlan(userId: string, plan: PlanId): Subscription {
  const now = new Date();
  const renews = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const sub: Subscription = {
    userId,
    plan,
    status: "active",
    startedAt: now.toISOString(),
    renewsAt: renews.toISOString(),
  };
  const all = readAll();
  all[userId] = sub;
  writeAll(all);

  const price = PLANS[plan].priceMonthly;
  if (price > 0) {
    recordRevenueEntry({
      type: "subscription_purchase",
      amount: price,
      userId,
      meta: { plan },
    });
    recordAnalyticsEvent({
      type: "subscription_purchase",
      value: price,
      meta: { plan },
    });
  }

  addNotification({
    userId,
    kind: "system",
    title: `${PLANS[plan].name} rejasi faollashdi`,
    body: plan === "free" ? "Bepul rejaga o'tdingiz." : `${PLANS[plan].name} rejasi faollashdi. Keyingi to'lov: ${renews.toLocaleDateString("uz-UZ")}.`,
    priority: "high",
    href: "/subscription",
  });

  return sub;
}

export function upgradePlan(plan: PlanId, userId?: string): { ok: true } | { ok: false; error: string } {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return { ok: false, error: "Tizimga kiring." };
  if (plan === "free") return { ok: false, error: "Yangilash uchun Pro yoki Elite tanlang." };
  activatePlan(uid, plan);
  return { ok: true };
}

export function downgradePlan(plan: PlanId, userId?: string): { ok: true } | { ok: false; error: string } {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return { ok: false, error: "Tizimga kiring." };
  activatePlan(uid, plan);
  return { ok: true };
}

export function cancelSubscription(userId?: string): Subscription {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return defaultSub("guest");
  const sub = getSubscription(uid);
  const updated: Subscription = { ...sub, status: "cancelled", cancelledAt: new Date().toISOString() };
  const all = readAll();
  all[uid] = updated;
  writeAll(all);
  addNotification({
    userId: uid,
    kind: "system",
    title: "Obuna bekor qilindi",
    body: "Joriy davr tugagach Bepul rejaga o'tasiz.",
    priority: "normal",
    href: "/subscription",
  });
  return updated;
}

export function renewSubscription(userId?: string): Subscription {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return defaultSub("guest");
  const sub = getSubscription(uid);
  if (sub.plan === "free") return sub;
  return activatePlan(uid, sub.plan);
}

export function getSubscriptionMix(): Record<PlanId, number> {
  const all = readAll();
  const mix: Record<PlanId, number> = { free: 0, pro: 0, elite: 0 };
  for (const sub of Object.values(all)) {
    if (sub.status === "active") mix[sub.plan] += 1;
  }
  return mix;
}

export function getActivePaidSubscriptions(): Subscription[] {
  return Object.values(readAll()).filter((s) => s.status === "active" && s.plan !== "free");
}
