import { readStoredOrders } from "./orders-store";
import { getStoredProjects } from "./projects-store";
import { getStoredServices } from "./services-store";
import { readStoredApplications } from "./applications-store";
import { readStoredReviews } from "./reviews-store";
import { getAllAnalyticsEvents } from "./analytics-events-store";

export type HealthStatus = "healthy" | "watch" | "critical";

export type MarketplaceHealthMetrics = {
  liquidity: number;
  clientRetention: number;
  freelancerRetention: number;
  reviewRate: number;
  repeatHireRate: number;
  activeListings: number;
  liquidityStatus: HealthStatus;
  retentionStatus: HealthStatus;
  reviewStatus: HealthStatus;
  listingsStatus: HealthStatus;
};

function status(value: number, healthy: number, watch: number): HealthStatus {
  if (value >= healthy) return "healthy";
  if (value >= watch) return "watch";
  return "critical";
}

export function computeMarketplaceHealth(days = 30): MarketplaceHealthMetrics {
  const orders = readStoredOrders();
  const completed = orders.filter((o) => o.status === "completed");
  const projects = getStoredProjects().filter((p) => p.status === "published");
  const services = getStoredServices().filter((s) => s.status === "published");
  const applications = readStoredApplications();
  const storedReviews = readStoredReviews();
  const events = getAllAnalyticsEvents();

  const clientCounts = new Map<string, number>();
  const freelancerCounts = new Map<string, number>();
  for (const o of orders) {
    if (o.clientSlug || o.client) {
      const key = o.clientSlug ?? o.client;
      clientCounts.set(key, (clientCounts.get(key) ?? 0) + 1);
    }
    if (o.freelancerUsername) {
      freelancerCounts.set(o.freelancerUsername, (freelancerCounts.get(o.freelancerUsername) ?? 0) + 1);
    }
  }

  const repeatClients = [...clientCounts.values()].filter((c) => c >= 2).length;
  const repeatFreelancers = [...freelancerCounts.values()].filter((c) => c >= 2).length;
  const clientRetention = clientCounts.size > 0 ? Math.round((repeatClients / clientCounts.size) * 100) : 0;
  const freelancerRetention = freelancerCounts.size > 0 ? Math.round((repeatFreelancers / freelancerCounts.size) * 100) : 0;

  const reviewRate = completed.length > 0
    ? Math.round((storedReviews.filter((r) => r.orderId).length / completed.length) * 100)
    : 0;

  const repeatHireRate = clientRetention;

  const proposalsPerProject = projects.length > 0 ? applications.length / projects.length : 0;
  const ordersPerProposal = applications.length > 0 ? orders.length / applications.length : 0;
  const liquidity = Math.min(100, Math.round(proposalsPerProject * 20 + ordersPerProposal * 30 + (events.length > 0 ? 20 : 0)));

  const activeListings = projects.length + services.length;

  return {
    liquidity,
    clientRetention,
    freelancerRetention,
    reviewRate,
    repeatHireRate,
    activeListings,
    liquidityStatus: status(liquidity, 60, 30),
    retentionStatus: status(Math.max(clientRetention, freelancerRetention), 40, 15),
    reviewStatus: status(reviewRate, 50, 20),
    listingsStatus: status(activeListings, 5, 1),
  };
}
