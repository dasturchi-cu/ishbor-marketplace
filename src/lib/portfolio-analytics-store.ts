import type { PortfolioItem } from "./portfolio-types";

export type PortfolioAnalytics = {
  views: number;
  saves: number;
  shares: number;
  contactClicks: number;
  hireConversions: number;
};

const STORAGE_KEY = "ishbor-portfolio-analytics";
const EMPTY_ANALYTICS_STORE: Record<string, PortfolioAnalytics> = {};
const EMPTY_ANALYTICS: PortfolioAnalytics = { views: 0, saves: 0, shares: 0, contactClicks: 0, hireConversions: 0 };
const listeners = new Set<() => void>();
let cache: Record<string, PortfolioAnalytics> | null = null;

function invalidateCache() {
  cache = null;
}

function notify() {
  invalidateCache();
  listeners.forEach((l) => l());
}

export function subscribePortfolioAnalytics(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Record<string, PortfolioAnalytics> {
  if (typeof window === "undefined") return EMPTY_ANALYTICS_STORE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PortfolioAnalytics>) : EMPTY_ANALYTICS_STORE;
  } catch {
    return EMPTY_ANALYTICS_STORE;
  }
}

function writeAll(data: Record<string, PortfolioAnalytics>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function emptyAnalytics(): PortfolioAnalytics {
  return EMPTY_ANALYTICS;
}

function getSnapshot(): Record<string, PortfolioAnalytics> {
  if (cache === null) {
    cache = readAll();
  }
  return cache;
}

export function getPortfolioAnalytics(slug: string): PortfolioAnalytics {
  return getSnapshot()[slug] ?? emptyAnalytics();
}

/** Stable snapshot for useSyncExternalStore — only changes when analytics data updates. */
export function getAnalyticsStoreSnapshot(): Record<string, PortfolioAnalytics> {
  return getSnapshot();
}

function increment(slug: string, field: keyof PortfolioAnalytics) {
  const all = readAll();
  const current = all[slug] ?? emptyAnalytics();
  all[slug] = { ...current, [field]: current[field] + 1 };
  writeAll(all);
  notify();
}

export function recordPortfolioView(slug: string) {
  increment(slug, "views");
}

export function recordPortfolioSave(slug: string) {
  increment(slug, "saves");
}

export function recordPortfolioShare(slug: string) {
  increment(slug, "shares");
}

export function recordPortfolioContactClick(slug: string) {
  increment(slug, "contactClicks");
}

export function recordPortfolioHireConversion(slug: string) {
  increment(slug, "hireConversions");
}

export type PortfolioPerformance = {
  slug: string;
  title: string;
  category: string;
  hue: number;
  analytics: PortfolioAnalytics;
  score: number;
};

export function getTopPerformingByAnalytics(
  items: PortfolioItem[],
  limit = 5,
): PortfolioPerformance[] {
  const snapshot = getSnapshot();
  return items
    .map((item) => {
      const analytics = snapshot[item.slug] ?? emptyAnalytics();
      const score =
        analytics.views * 1 +
        analytics.saves * 3 +
        analytics.shares * 2 +
        analytics.contactClicks * 5 +
        analytics.hireConversions * 10;
      return { slug: item.slug, title: item.title, category: item.category, hue: item.hue, analytics, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getTotalAnalyticsForOwner(items: PortfolioItem[]): PortfolioAnalytics {
  const snapshot = getSnapshot();
  return items.reduce(
    (acc, item) => {
      const a = snapshot[item.slug] ?? emptyAnalytics();
      return {
        views: acc.views + a.views,
        saves: acc.saves + a.saves,
        shares: acc.shares + a.shares,
        contactClicks: acc.contactClicks + a.contactClicks,
        hireConversions: acc.hireConversions + a.hireConversions,
      };
    },
    emptyAnalytics(),
  );
}

export function seedMockAnalytics(slugs: string[]) {
  if (typeof window === "undefined") return;
  const all = readAll();
  let changed = false;
  for (const slug of slugs) {
    if (!all[slug]) {
      all[slug] = {
        views: 50 + Math.floor(Math.random() * 500),
        saves: 5 + Math.floor(Math.random() * 40),
        shares: 2 + Math.floor(Math.random() * 20),
        contactClicks: 1 + Math.floor(Math.random() * 15),
        hireConversions: Math.floor(Math.random() * 5),
      };
      changed = true;
    }
  }
  if (changed) {
    writeAll(all);
    notify();
  }
}
