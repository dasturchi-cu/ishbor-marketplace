import { readStoredOrders } from "./orders-store";
import { getStoredServices } from "./services-store";
import { getStoredProjects } from "./projects-store";
import { getStoredApplications } from "./applications-store";
import { getAllAnalyticsEvents, getEventsSince, sumEventValues } from "./analytics-events-store";
import { getReferralState } from "./referral-store";
import { SESSION_STORAGE_KEY } from "./auth";
import { bumpStoreVersion, STORE_KEYS } from "./store-version";
import { persistRead, persistWrite } from "./store-persist";

const PLATFORM_FEE_RATE = 0.05;
const STORAGE_KEY = "ishbor-revenue-log";
const listeners = new Set<() => void>();
let cachedLog: RevenueEntry[] | null = null;
const cachedFilteredLog = new Map<number, RevenueEntry[]>();

function invalidateLogCache() {
  cachedLog = null;
  cachedFilteredLog.clear();
}

function notify() {
  invalidateLogCache();
  bumpStoreVersion(STORE_KEYS.revenue);
  listeners.forEach((l) => l());
}

export type RevenueEntry = {
  id: string;
  type:
    | "featured_purchase"
    | "order_gmv"
    | "escrow_volume"
    | "platform_fee"
    | "referral_credit_spent"
    | "subscription_purchase"
    | "credit_purchase";
  amount: number;
  timestamp: string;
  userId?: string;
  entityId?: string;
  meta?: Record<string, string>;
};

export function subscribeRevenue(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readLog(): RevenueEntry[] {
  if (cachedLog !== null) return cachedLog;
  if (typeof window === "undefined") {
    cachedLog = [];
    return cachedLog;
  }
  cachedLog = persistRead(STORAGE_KEY, []);
  return cachedLog;
}

function writeLog(entries: RevenueEntry[]) {
  if (typeof window === "undefined") return;
  try {
    persistWrite(STORAGE_KEY, entries.slice(0, 2000));
  } catch (error) {
    console.error("[revenue-store] write failed", error);
    return;
  }
  notify();
}

export function recordRevenueEntry(entry: Omit<RevenueEntry, "id" | "timestamp">): RevenueEntry {
  const full: RevenueEntry = {
    ...entry,
    id: `rev-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  writeLog([full, ...readLog()]);
  return full;
}

export function getRevenueLog(days?: number): RevenueEntry[] {
  const log = readLog();
  if (!days) return log;
  const cached = cachedFilteredLog.get(days);
  if (cached) return cached;
  const cutoff = Date.now() - days * 86400000;
  const filtered = log.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
  cachedFilteredLog.set(days, filtered);
  return filtered;
}

/** GMV = sum of stored order amounts */
export function computeGMV(days = 30): number {
  const cutoff = Date.now() - days * 86400000;
  return readStoredOrders()
    .filter((o) => new Date(o.completedAt ?? "").getTime() >= cutoff || o.status === "in_progress" || o.status === "review")
    .reduce((s, o) => s + o.amount, 0);
}

/** Platform revenue = 5% of completed order GMV + featured purchases */
export function computePlatformRevenue(days = 30): number {
  const cutoff = Date.now() - days * 86400000;
  const orderFees = readStoredOrders()
    .filter((o) => o.status === "completed" && o.completedAt && new Date(o.completedAt).getTime() >= cutoff)
    .reduce((s, o) => s + o.amount * PLATFORM_FEE_RATE, 0);
  const featured = getRevenueLog(days)
    .filter((e) => e.type === "featured_purchase")
    .reduce((s, e) => s + e.amount, 0);
  return Math.round(orderFees + featured);
}

export function computeEscrowVolume(days = 30): number {
  return sumEventValues(["escrow_funded"], days) || readStoredOrders()
    .filter((o) => o.escrowFunded)
    .reduce((s, o) => s + o.amount, 0);
}

export function getMarketplaceOverview(days = 30) {
  const orders = readStoredOrders();
  const services = getStoredServices();
  const projects = getStoredProjects();
  const applications = getStoredApplications();
  const events = getEventsSince(days);

  const uniqueUsers = new Set<string>();
  if (typeof window !== "undefined") {
    try {
      const session = localStorage.getItem(SESSION_STORAGE_KEY) ?? sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (session) uniqueUsers.add(JSON.parse(session).user.id);
    } catch { /* ignore */ }
  }
  events.forEach((e) => { if (e.userId) uniqueUsers.add(e.userId); });
  orders.forEach((o) => {
    if (o.freelancerUsername) uniqueUsers.add(o.freelancerUsername);
    if (o.clientSlug) uniqueUsers.add(o.clientSlug);
  });

  const activeFreelancers = new Set(orders.map((o) => o.freelancerUsername).filter(Boolean));
  const activeClients = new Set(orders.map((o) => o.clientSlug ?? o.client).filter(Boolean));

  return {
    gmv: computeGMV(days),
    revenue: computePlatformRevenue(days),
    escrowVolume: computeEscrowVolume(days),
    totalOrders: orders.length,
    completedOrders: orders.filter((o) => o.status === "completed").length,
    totalProjects: projects.filter((p) => p.status === "published").length,
    totalServices: services.filter((s) => s.status === "published").length,
    totalProposals: applications.length,
    totalUsers: uniqueUsers.size,
    activeFreelancers: activeFreelancers.size,
    activeClients: activeClients.size,
    featuredPurchases: getRevenueLog(days).filter((e) => e.type === "featured_purchase").length,
    referralCreditsSpent: sumEventValues(["referral_credit_spent", "credit_spent"], days),
    subscriptionRevenue: getRevenueLog(days).filter((e) => e.type === "subscription_purchase").reduce((s, e) => s + e.amount, 0),
    creditRevenue: getRevenueLog(days).filter((e) => e.type === "credit_purchase").reduce((s, e) => s + e.amount, 0),
  };
}

export function getTopFreelancersByRevenue(limit = 5) {
  const orders = readStoredOrders().filter((o) => o.status === "completed");
  const map = new Map<string, { username: string; earned: number; orders: number }>();
  for (const o of orders) {
    if (!o.freelancerUsername) continue;
    const cur = map.get(o.freelancerUsername) ?? { username: o.freelancerUsername, earned: 0, orders: 0 };
    cur.earned += o.amount;
    cur.orders += 1;
    map.set(o.freelancerUsername, cur);
  }
  return [...map.values()].sort((a, b) => b.earned - a.earned).slice(0, limit);
}

export function getTopClientsBySpend(limit = 5) {
  const orders = readStoredOrders();
  const map = new Map<string, { client: string; spent: number; hires: number }>();
  for (const o of orders) {
    const key = o.clientSlug ?? o.client;
    const cur = map.get(key) ?? { client: o.client, spent: 0, hires: 0 };
    cur.spent += o.amount;
    cur.hires += 1;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.spent - a.spent).slice(0, limit);
}

export function getTopServicesByOrders(limit = 5) {
  const events = getAllAnalyticsEvents().filter((e) => e.type === "service_order");
  const map = new Map<string, { slug: string; orders: number; revenue: number }>();
  for (const e of events) {
    if (!e.entityId) continue;
    const cur = map.get(e.entityId) ?? { slug: e.entityId, orders: 0, revenue: 0 };
    cur.orders += 1;
    cur.revenue += e.value ?? 0;
    map.set(e.entityId, cur);
  }
  return [...map.values()].sort((a, b) => b.orders - a.orders).slice(0, limit);
}

export function getOrdersGrowthBuckets(days: number) {
  const cutoff = Date.now() - days * 86400000;
  const buckets: { label: string; value: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("uz-UZ", { month: "short", day: "numeric" });
    const count = readStoredOrders().filter((o) => {
      const created = o.completedAt ?? "";
      return created.slice(0, 10) === dateKey || (o.id.includes(dateKey.replace(/-/g, "")));
    }).length;
    buckets.push({ label, value: count });
  }
  return buckets.map((b) => ({ month: b.label, value: b.value }));
}

export const PLATFORM_FEE = PLATFORM_FEE_RATE;
