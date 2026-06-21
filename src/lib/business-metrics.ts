/** Business metrics — DAU, WAU, MAU from analytics events. */

import { getAllAnalyticsEvents, type AnalyticsEvent } from "./analytics-events-store";

export type ActiveUserMetrics = {
  dau: number;
  wau: number;
  mau: number;
  dauTrend: number;
  wauTrend: number;
  mauTrend: number;
  activeFreelancers: number;
  activeClients: number;
  totalEvents7d: number;
  conversionRate: number;
};

function eventMs(e: AnalyticsEvent): number {
  return new Date(e.timestamp).getTime();
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function uniqueUsersInRange(
  events: AnalyticsEvent[],
  fromMs: number,
  toMs: number,
): Set<string> {
  const users = new Set<string>();
  for (const e of events) {
    const ts = eventMs(e);
    if (ts >= fromMs && ts < toMs && e.userId) {
      users.add(e.userId);
    }
  }
  return users;
}

function countFreelancerActivity(events: AnalyticsEvent[], fromMs: number): number {
  const users = new Set<string>();
  for (const e of events) {
    if (eventMs(e) >= fromMs && e.userId) {
      if (
        e.type === "profile_view" ||
        e.type === "service_view" ||
        e.type === "proposal_received" ||
        e.type === "order_completed"
      ) {
        users.add(e.userId);
      }
    }
  }
  return users.size;
}

function countClientActivity(events: AnalyticsEvent[], fromMs: number): number {
  const users = new Set<string>();
  for (const e of events) {
    if (eventMs(e) >= fromMs && e.userId) {
      if (
        e.type === "order_created" ||
        e.type === "checkout_start" ||
        e.type === "project_created" ||
        e.type === "proposal_accepted"
      ) {
        users.add(e.userId);
      }
    }
  }
  return users.size;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function getActiveUserMetrics(): ActiveUserMetrics {
  const events = getAllAnalyticsEvents();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const todayStart = startOfDay(new Date());
  const yesterdayStart = todayStart - dayMs;
  const weekAgo = now - 7 * dayMs;
  const twoWeeksAgo = now - 14 * dayMs;
  const monthAgo = now - 30 * dayMs;
  const twoMonthsAgo = now - 60 * dayMs;

  const dauUsers = uniqueUsersInRange(events, todayStart, now);
  const prevDauUsers = uniqueUsersInRange(events, yesterdayStart, todayStart);
  const wauUsers = uniqueUsersInRange(events, weekAgo, now);
  const prevWauUsers = uniqueUsersInRange(events, twoWeeksAgo, weekAgo);
  const mauUsers = uniqueUsersInRange(events, monthAgo, now);
  const prevMauUsers = uniqueUsersInRange(events, twoMonthsAgo, monthAgo);

  const orders7d = events.filter(
    (e) => e.type === "order_created" && eventMs(e) >= weekAgo,
  ).length;
  const views7d = events.filter(
    (e) =>
      (e.type === "service_view" || e.type === "profile_view") &&
      eventMs(e) >= weekAgo,
  ).length;
  const conversionRate =
    views7d > 0 ? Math.round((orders7d / views7d) * 1000) / 10 : 0;

  return {
    dau: dauUsers.size,
    wau: wauUsers.size,
    mau: mauUsers.size,
    dauTrend: pctChange(dauUsers.size, prevDauUsers.size),
    wauTrend: pctChange(wauUsers.size, prevWauUsers.size),
    mauTrend: pctChange(mauUsers.size, prevMauUsers.size),
    activeFreelancers: countFreelancerActivity(events, weekAgo),
    activeClients: countClientActivity(events, weekAgo),
    totalEvents7d: events.filter((e) => eventMs(e) >= weekAgo).length,
    conversionRate,
  };
}

export type MarketplaceHealthSummary = {
  supplyDemandRatio: number;
  listingVelocity7d: number;
  orderVelocity7d: number;
  healthScore: number;
};

export function getMarketplaceHealthSummary(): MarketplaceHealthSummary {
  const events = getAllAnalyticsEvents();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const newServices = events.filter(
    (e) => e.type === "service_view" && e.meta?.created === "true" && eventMs(e) >= weekAgo,
  ).length;
  const newProjects = events.filter(
    (e) => e.type === "project_created" && eventMs(e) >= weekAgo,
  ).length;
  const orders = events.filter(
    (e) => e.type === "order_created" && eventMs(e) >= weekAgo,
  ).length;

  const supply = newServices + 1;
  const demand = newProjects + orders + 1;
  const ratio = Math.round((supply / demand) * 100) / 100;

  const healthScore = Math.min(
    100,
    Math.round(
      Math.min(orders * 8, 40) +
        Math.min(newServices * 3, 25) +
        Math.min(newProjects * 3, 25) +
        (ratio >= 0.5 && ratio <= 2 ? 10 : 0),
    ),
  );

  return {
    supplyDemandRatio: ratio,
    listingVelocity7d: newServices + newProjects,
    orderVelocity7d: orders,
    healthScore,
  };
}
