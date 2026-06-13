import type { AuthUser } from "./auth";
import { getPublishedPortfoliosByUsername } from "./portfolio-store";
import { getTotalAnalyticsForOwner, getTopPerformingByAnalytics } from "./portfolio-analytics-store";
import { getStoredServices } from "./services-store";
import { getStoredProjects } from "./projects-store";
import { readStoredOrders, getOrdersForFreelancer } from "./orders-store";
import { readStoredApplications } from "./applications-store";
import {
  getAllAnalyticsEvents,
  getEventsSince,
  getDailyBuckets,
  recordAnalyticsEvent,
} from "./analytics-events-store";
import {
  computeSuccessScore,
  computeTrustScore,
  computeResponseRate,
  getMonthlyEarnings,
} from "./growth-metrics";
import { computeProfileCompletionPercent } from "./profile-store";
import { getCreditSpendTotal } from "./credits-store";
import { getFeaturedPerformance } from "./featured-listings-store";
import { getVisibilityFunnel, getOwnerVisibilitySummary } from "./visibility-store";

export type FreelancerAnalyticsSummary = {
  portfolioViews: number;
  portfolioSaves: number;
  portfolioShares: number;
  contactClicks: number;
  hireConversions: number;
  profileViews: number;
  serviceViews: number;
  serviceSaves: number;
  serviceOrders: number;
  earnings: number;
  earnings30: number;
  proposalAcceptanceRate: number;
  successScore: number;
  trustScore: number;
  responseRate: number;
  profileCompletion: number;
  ordersCompleted: number;
  creditSpend: number;
  promotionRoi: number;
  featuredPerformance: ReturnType<typeof getFeaturedPerformance>;
  visibilityFunnel: ReturnType<typeof getOwnerVisibilitySummary>;
};

export function getFreelancerAnalytics(user: AuthUser, days = 30): FreelancerAnalyticsSummary {
  const username = user.username ?? "";
  const portfolios = username ? getPublishedPortfoliosByUsername(username) : [];
  const portfolioTotals = getTotalAnalyticsForOwner(portfolios);
  const events = getEventsSince(days);

  const profileViews = events.filter((e) => e.type === "profile_view" && e.entityId === username).length;
  const serviceViews = events.filter((e) => e.type === "service_view" && e.meta?.seller === username).length;
  const serviceSaves = events.filter((e) => e.type === "service_save" && e.meta?.seller === username).length;
  const serviceOrders = events.filter((e) => e.type === "service_order" && e.meta?.seller === username).length;

  const apps = username
    ? readStoredApplications().filter((a) => a.freelancerUsername === username && !a.archived)
    : [];
  const accepted = apps.filter((a) => a.status === "accepted").length;
  const proposalAcceptanceRate = apps.length > 0 ? Math.round((accepted / apps.length) * 100) : 0;

  const orders = username ? getOrdersForFreelancer(username) : [];
  const completed = orders.filter((o) => o.status === "completed");
  const earnings = completed.reduce((s, o) => s + o.amount, 0);
  const cutoff = Date.now() - 30 * 86400000;
  const earnings30 = completed
    .filter((o) => o.completedAt && new Date(o.completedAt).getTime() >= cutoff)
    .reduce((s, o) => s + o.amount, 0);

  const success = username ? computeSuccessScore(username) : { score: 0 };
  const trust = computeTrustScore(user, username);
  const response = username ? computeResponseRate(username) : { rate: 0 };

  const creditSpend = getCreditSpendTotal(user.id, days);
  const featuredPerformance = getFeaturedPerformance(user.id, days);
  const serviceSlugs = getStoredServices().filter((s) => s.sellerUsername === username).map((s) => s.slug);
  const portfolioSlugs = portfolios.map((p) => p.slug);
  const visibilityFunnel = getOwnerVisibilitySummary(username, { services: serviceSlugs, portfolios: portfolioSlugs }, days);
  const promotionRoi =
    featuredPerformance.creditsSpent > 0
      ? Math.round((visibilityFunnel.contacts / featuredPerformance.creditsSpent) * 10000)
      : 0;

  return {
    portfolioViews: portfolioTotals.views,
    portfolioSaves: portfolioTotals.saves,
    portfolioShares: portfolioTotals.shares,
    contactClicks: portfolioTotals.contactClicks,
    hireConversions: portfolioTotals.hireConversions,
    profileViews,
    serviceViews,
    serviceSaves,
    serviceOrders,
    earnings,
    earnings30,
    proposalAcceptanceRate,
    successScore: success.score,
    trustScore: trust.trustScore,
    responseRate: response.rate,
    profileCompletion: computeProfileCompletionPercent(user.id, "freelancer"),
    ordersCompleted: completed.length,
    creditSpend,
    promotionRoi,
    featuredPerformance,
    visibilityFunnel,
  };
}

export function getFreelancerChartData(username: string, range: 7 | 30 | 90) {
  const events = getEventsSince(range);
  return getDailyBuckets(
    ["profile_view", "service_view", "service_order", "portfolio_view", "contact_click"],
    range,
  ).map((b) => ({
    ...b,
    value: events.filter(
      (e) =>
        e.timestamp.slice(0, 10) === b.date &&
        (e.entityId === username || e.meta?.seller === username || e.meta?.owner === username),
    ).length,
  }));
}

export function getFreelancerEarningsChart(username: string, months = 6) {
  return getMonthlyEarnings(username, months);
}

export function getTopPortfolioItems(username: string, limit = 5) {
  return getTopPerformingByAnalytics(getPublishedPortfoliosByUsername(username), limit);
}

export function getTopServicesForFreelancer(username: string, limit = 5) {
  const services = getStoredServices().filter((s) => s.sellerUsername === username);
  const events = getAllAnalyticsEvents();
  return services
    .map((s) => ({
      slug: s.slug,
      title: s.title,
      orders: events.filter((e) => e.type === "service_order" && e.entityId === s.slug).length,
      views: events.filter((e) => e.type === "service_view" && e.entityId === s.slug).length,
    }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, limit);
}

export function getClientAnalytics(user: AuthUser, days = 30) {
  const clientSlug = user.companySlug;
  const clientName = user.company ?? user.fullName;
  const orders = readStoredOrders().filter(
    (o) => o.clientSlug === clientSlug || o.client === clientName,
  );
  const projects = getStoredProjects().filter((p) => p.ownerUserId === user.id);
  const proposals = readStoredApplications().filter((a) =>
    projects.some((p) => p.slug === a.projectSlug),
  );

  const totalSpend = orders.reduce((s, o) => s + o.amount, 0);
  const escrowFunded = orders.filter((o) => o.escrowFunded).reduce((s, o) => s + o.amount, 0);
  const hired = orders.length;
  const freelancers = new Set(orders.map((o) => o.freelancerUsername).filter(Boolean));
  const repeatRate =
    freelancers.size > 0
      ? Math.round(
          ([...freelancers].filter((f) => orders.filter((o) => o.freelancerUsername === f).length >= 2).length /
            freelancers.size) *
            100,
        )
      : 0;

  const featuredProjects = projects.filter((p) => p.featured);
  const featuredProjectPerformance = featuredProjects.map((p) => ({
    slug: p.slug,
    title: p.title,
    funnel: getVisibilityFunnel("project", p.slug, days),
  }));

  return {
    projectsCreated: projects.length,
    proposalsReceived: proposals.length,
    freelancersHired: hired,
    ordersCreated: orders.length,
    escrowFunded,
    totalSpend,
    averageHireTime: hired > 0 ? Math.round(totalSpend / hired) : 0,
    repeatFreelancerRate: repeatRate,
    trustScore: computeProfileCompletionPercent(user.id, "client"),
    hiringSpend: totalSpend,
    featuredProjectPerformance,
  };
}

export function getClientChartData(_userId: string, range: 7 | 30 | 90) {
  return getDailyBuckets(["project_created", "proposal_received", "order_created", "escrow_funded"], range);
}

export function getClientSpendChart(user: AuthUser, months = 6) {
  const clientSlug = user.companySlug;
  const orders = readStoredOrders().filter((o) => o.status === "completed" && o.clientSlug === clientSlug);
  const monthNames = ["Yan", "Fev", "Mar", "Aprel", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
  const now = new Date();
  const result: { month: string; value: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const total = orders
      .filter((o) => {
        if (!o.completedAt) return false;
        const cd = new Date(o.completedAt);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      })
      .reduce((s, o) => s + o.amount, 0);
    result.push({ month: monthNames[d.getMonth()]!, value: total });
  }
  return result;
}

export function recordProfileView(username: string) {
  recordAnalyticsEvent({ type: "profile_view", entityId: username });
}

export function recordServiceView(slug: string, sellerUsername: string) {
  recordAnalyticsEvent({ type: "service_view", entityId: slug, meta: { seller: sellerUsername } });
}

export function recordServiceSave(slug: string, sellerUsername: string) {
  recordAnalyticsEvent({ type: "service_save", entityId: slug, meta: { seller: sellerUsername } });
}

export function recordServiceOrder(slug: string, sellerUsername: string, amount: number) {
  recordAnalyticsEvent({ type: "service_order", entityId: slug, value: amount, meta: { seller: sellerUsername } });
}

export function recordContactClick(username: string) {
  recordAnalyticsEvent({ type: "contact_click", entityId: username });
}

export function recordAgencyView(slug: string) {
  recordAnalyticsEvent({ type: "agency_view", entityId: slug });
}

export function getEntityEventCount(type: string, entityId: string): number {
  return getAllAnalyticsEvents().filter((e) => e.type === type && e.entityId === entityId).length;
}

export function getClientPublicMetrics(clientSlug: string, clientName: string, verified: boolean) {
  const orders = readStoredOrders().filter(
    (o) => o.clientSlug === clientSlug || o.client === clientName,
  );
  const projects = getStoredProjects().filter(
    (p) => p.clientSlug === clientSlug || p.client === clientName,
  );
  const totalSpend = orders
    .filter((o) => o.escrowFunded || o.status === "completed")
    .reduce((s, o) => s + o.amount, 0);
  const hiresCompleted = orders.filter((o) => o.status === "completed").length;
  const projectsPosted = projects.filter((p) => p.status === "published").length;
  const activityScore = Math.min(100, projectsPosted * 15 + hiresCompleted * 20 + (totalSpend > 0 ? 25 : 0));
  const trustScore = Math.round((verified ? 50 : 20) + activityScore * 0.5);
  const trustLevel: "Yangi" | "Barqaror" | "Ishonchli" =
    trustScore >= 80 ? "Ishonchli" : trustScore >= 55 ? "Barqaror" : "Yangi";
  return { totalSpend, projectsPosted, hiresCompleted, trustScore, trustLevel };
}
