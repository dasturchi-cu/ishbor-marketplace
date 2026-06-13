import { getActivePaidSubscriptions, getSubscriptionMix, PLANS } from "./subscription-store";
import { getRevenueLog, getMarketplaceOverview } from "./revenue-store";
import { getCreditBurnRate, readAllWallets } from "./credits-store";
import { getActiveFeaturedListings } from "./featured-listings-store";
import { getAllAnalyticsEvents } from "./analytics-events-store";

export function computeMRR(): number {
  return getActivePaidSubscriptions().reduce((s, sub) => s + PLANS[sub.plan].priceMonthly, 0);
}

export function computeARPU(days = 30): number {
  const overview = getMarketplaceOverview(days);
  const users = Math.max(1, overview.totalUsers);
  return Math.round(overview.revenue / users);
}

export function getSubscriptionRevenue(days = 30): number {
  const cutoff = Date.now() - days * 86400000;
  return getRevenueLog(days)
    .filter((e) => e.type === "subscription_purchase" && new Date(e.timestamp).getTime() >= cutoff)
    .reduce((s, e) => s + e.amount, 0);
}

export function getCreditPurchaseRevenue(days = 30): number {
  return getRevenueLog(days)
    .filter((e) => e.type === "credit_purchase")
    .reduce((s, e) => s + e.amount, 0);
}

export function getFeaturedRevenue(days = 30): number {
  return getRevenueLog(days)
    .filter((e) => e.type === "featured_purchase")
    .reduce((s, e) => s + e.amount, 0);
}

export function getMonetizationOverview(days = 30) {
  const overview = getMarketplaceOverview(days);
  const mix = getSubscriptionMix();
  const mrr = computeMRR();
  const arpu = computeARPU(days);
  const creditBurn = getCreditBurnRate(days);
  const featuredActive = getActiveFeaturedListings().length;
  const wallets = readAllWallets();
  const totalCreditBalance = Object.values(wallets as Record<string, { balance: number }>).reduce(
    (s, w) => s + (w.balance ?? 0),
    0,
  );

  const events = getAllAnalyticsEvents();
  const prevCutoff = Date.now() - days * 2 * 86400000;
  const midCutoff = Date.now() - days * 86400000;
  const prevRevenue = getRevenueLog(days * 2)
    .filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= prevCutoff && t < midCutoff;
    })
    .reduce((s, e) => s + e.amount, 0);
  const currRevenue = overview.revenue;
  const revenueGrowth = prevRevenue > 0 ? Math.round(((currRevenue - prevRevenue) / prevRevenue) * 100) : currRevenue > 0 ? 100 : 0;

  return {
    mrr,
    arpu,
    totalRevenue: currRevenue,
    subscriptionRevenue: getSubscriptionRevenue(days),
    creditRevenue: getCreditPurchaseRevenue(days),
    featuredRevenue: getFeaturedRevenue(days),
    subscriptionMix: mix,
    creditBurnRate: creditBurn,
    totalCreditBalance,
    featuredActive,
    revenueGrowth,
    gmv: overview.gmv,
  };
}

export type MonetizationHealth = "healthy" | "watch" | "critical";

export function getMonetizationHealth(): MonetizationHealth {
  const m = getMonetizationOverview(30);
  if (m.mrr > 0 && m.totalRevenue > 0) return "healthy";
  if (m.featuredRevenue > 0 || m.creditRevenue > 0) return "watch";
  return "critical";
}

export function getTopEarningCategories(limit = 5) {
  const log = getRevenueLog(90);
  const map = new Map<string, number>();
  for (const e of log) {
    const cat = e.meta?.category ?? e.meta?.targetType ?? e.type;
    map.set(cat, (map.get(cat) ?? 0) + e.amount);
  }
  return [...map.entries()]
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}
