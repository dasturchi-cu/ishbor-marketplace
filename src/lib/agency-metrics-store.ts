import type { Agency } from "./agency-types";
import { readStoredOrders } from "./orders-store";
import { readStoredApplications } from "./applications-store";
import { getStoredProjects } from "./projects-store";
import { computeSuccessScore, computeResponseRate, computeTrustScore } from "./growth-metrics";
import { getAverageRating } from "./reviews-store";
import { getEntityEventCount } from "./analytics-utils";
import { freelancers } from "./mock-data";
import type { AuthUser } from "./auth";

export type AgencyMetrics = {
  trustScore: number;
  successScore: number;
  rating: number;
  reviewCount: number;
  activeProjects: number;
  completedProjects: number;
  revenueGenerated: number;
  teamUtilization: number;
  conversionRate: number;
  repeatClientRate: number;
  responseRate: number;
};

function getActiveMemberUsernames(agency: Agency): string[] {
  return agency.members
    .filter((m) => m.status === "active" && m.username)
    .map((m) => m.username!);
}

function getMemberAuthUser(username: string): AuthUser | undefined {
  const f = freelancers.find((x) => x.username === username);
  if (!f) return undefined;
  return {
    id: f.id,
    email: `${username}@ishbor.uz`,
    fullName: f.name,
    userType: "freelancer",
    username,
    avatarHue: f.hue,
    verified: f.identityVerified,
    bio: f.bio,
    location: f.city,
  };
}

/** All agency metrics computed from stored team member actions — no hardcoded values */
export function computeAgencyMetrics(agency: Agency): AgencyMetrics {
  const usernames = getActiveMemberUsernames(agency);
  const orders = readStoredOrders();
  const teamOrders = orders.filter((o) => o.freelancerUsername && usernames.includes(o.freelancerUsername));
  const completed = teamOrders.filter((o) => o.status === "completed");
  const active = teamOrders.filter((o) => o.status === "in_progress" || o.status === "review" || o.status === "revision");
  const revenueGenerated = completed.reduce((s, o) => s + o.amount, 0);

  let trustSum = 0;
  let trustCount = 0;
  let successSum = 0;
  let successCount = 0;
  let responseSum = 0;
  let responseCount = 0;
  let ratingSum = 0;
  let reviewCount = 0;

  for (const username of usernames) {
    const user = getMemberAuthUser(username);
    if (user) {
      const trust = computeTrustScore(user, username);
      trustSum += trust.trustScore;
      trustCount += 1;
    }
    const success = computeSuccessScore(username);
    successSum += success.score;
    successCount += 1;
    const response = computeResponseRate(username);
    responseSum += response.rate;
    responseCount += 1;
    const { avg, count } = getAverageRating(username);
    if (count > 0) {
      ratingSum += avg;
      reviewCount += count;
    }
  }

  const trustScore = trustCount > 0 ? Math.round(trustSum / trustCount) : 0;
  const successScore = successCount > 0 ? Math.round(successSum / successCount) : 0;
  const responseRate = responseCount > 0 ? Math.round(responseSum / responseCount) : 0;
  const rating = reviewCount > 0 ? Math.round((ratingSum / usernames.filter((u) => getAverageRating(u).count > 0).length || 1) * 10) / 10 : 0;

  const activeMembers = agency.members.filter((m) => m.status === "active").length;
  const membersWithOrders = new Set(teamOrders.map((o) => o.freelancerUsername)).size;
  const teamUtilization = activeMembers > 0 ? Math.round((membersWithOrders / activeMembers) * 100) : 0;

  const projects = getStoredProjects();
  const activeProjects = projects.filter(
    (p) => p.status === "published" && usernames.some((u) => p.ownerUserId === agency.members.find((m) => m.username === u)?.userId),
  ).length + active.length;

  const clientSet = new Set(teamOrders.map((o) => o.client));
  const repeatClients = [...clientSet].filter((c) => teamOrders.filter((o) => o.client === c).length >= 2).length;
  const repeatClientRate = clientSet.size > 0 ? Math.round((repeatClients / clientSet.size) * 100) : 0;

  const views = getEntityEventCount("agency_view", agency.slug);
  const contacts = getEntityEventCount("contact_click", agency.slug);
  const conversionRate = views > 0 ? Math.round((contacts / views) * 100) : 0;

  return {
    trustScore,
    successScore,
    rating,
    reviewCount,
    activeProjects: active.length,
    completedProjects: completed.length,
    revenueGenerated,
    teamUtilization,
    conversionRate,
    repeatClientRate,
    responseRate,
  };
}

export type AgencyCrmClient = {
  name: string;
  slug?: string;
  hue: number;
  totalPaid: number;
  orderCount: number;
  lastOrderDate?: string;
  isRepeat: boolean;
};

export function getAgencyCrmClients(agency: Agency): AgencyCrmClient[] {
  const usernames = getActiveMemberUsernames(agency);
  const orders = readStoredOrders().filter(
    (o) => o.freelancerUsername && usernames.includes(o.freelancerUsername),
  );

  const map = new Map<string, AgencyCrmClient>();
  for (const o of orders) {
    const key = o.clientSlug ?? o.client;
    const cur = map.get(key) ?? {
      name: o.client,
      slug: o.clientSlug,
      hue: o.clientHue,
      totalPaid: 0,
      orderCount: 0,
      isRepeat: false,
    };
    cur.totalPaid += o.amount;
    cur.orderCount += 1;
    if (o.completedAt && (!cur.lastOrderDate || o.completedAt > cur.lastOrderDate)) {
      cur.lastOrderDate = o.completedAt;
    }
    map.set(key, cur);
  }

  return [...map.values()]
    .map((c) => ({ ...c, isRepeat: c.orderCount >= 2 }))
    .sort((a, b) => b.totalPaid - a.totalPaid);
}

export type AgencyDashboardMetrics = {
  teamPerformance: number;
  revenue: number;
  orders: number;
  conversion: number;
  teamUtilization: number;
  activeMembers: number;
  pendingInvites: number;
};

export function getAgencyDashboardMetrics(agency: Agency): AgencyDashboardMetrics {
  const metrics = computeAgencyMetrics(agency);
  const usernames = getActiveMemberUsernames(agency);
  const orders = readStoredOrders().filter(
    (o) => o.freelancerUsername && usernames.includes(o.freelancerUsername),
  );

  const apps = readStoredApplications().filter((a) =>
    a.freelancerUsername && usernames.includes(a.freelancerUsername),
  );
  const accepted = apps.filter((a) => a.status === "accepted").length;
  const proposalConversion = apps.length > 0 ? Math.round((accepted / apps.length) * 100) : 0;

  return {
    teamPerformance: Math.round((metrics.successScore + metrics.trustScore) / 2),
    revenue: metrics.revenueGenerated,
    orders: orders.length,
    conversion: Math.max(metrics.conversionRate, proposalConversion),
    teamUtilization: metrics.teamUtilization,
    activeMembers: agency.members.filter((m) => m.status === "active").length,
    pendingInvites: agency.members.filter((m) => m.status === "pending").length,
  };
}

export type FounderAgencyMetrics = {
  totalAgencies: number;
  publishedAgencies: number;
  agencyRevenue: number;
  agencyGmv: number;
  teamGrowth: number;
  agencyRetention: number;
  verifiedCount: number;
  premiumCount: number;
  enterpriseCount: number;
};

export function computeFounderAgencyMetrics(agencies: Agency[], days = 30): FounderAgencyMetrics {
  const published = agencies.filter((a) => a.status === "published");
  const cutoff = Date.now() - days * 86400000;

  let agencyRevenue = 0;
  let agencyGmv = 0;
  let newMembers = 0;
  let retainedAgencies = 0;

  for (const agency of published) {
    const metrics = computeAgencyMetrics(agency);
    agencyRevenue += metrics.revenueGenerated;
    agencyGmv += metrics.revenueGenerated;

    const recentMembers = agency.members.filter(
      (m) => m.status === "active" && m.joinedAt && new Date(m.joinedAt).getTime() >= cutoff,
    );
    newMembers += recentMembers.length;

    const usernames = getActiveMemberUsernames(agency);
    const hasRecentOrder = readStoredOrders().some(
      (o) =>
        o.freelancerUsername &&
        usernames.includes(o.freelancerUsername) &&
        o.completedAt &&
        new Date(o.completedAt).getTime() >= cutoff,
    );
    if (hasRecentOrder || recentMembers.length > 0) retainedAgencies += 1;
  }

  return {
    totalAgencies: agencies.length,
    publishedAgencies: published.length,
    agencyRevenue,
    agencyGmv,
    teamGrowth: newMembers,
    agencyRetention: published.length > 0 ? Math.round((retainedAgencies / published.length) * 100) : 0,
    verifiedCount: agencies.filter((a) => a.verificationLevel === "verified").length,
    premiumCount: agencies.filter((a) => a.verificationLevel === "premium").length,
    enterpriseCount: agencies.filter((a) => a.verificationLevel === "enterprise").length,
  };
}
