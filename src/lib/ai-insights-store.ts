import { computeMarketplaceHealth } from "./marketplace-health";
import { getMonetizationOverview } from "./monetization-store";
import { getStoredProjects } from "./projects-store";
import { getStoredServices } from "./services-store";
import { readStoredApplications } from "./applications-store";
import { getAllAnalyticsEvents } from "./analytics-events-store";
import { getAllAgencies } from "./agency-store";
import { computeFounderAgencyMetrics } from "./agency-metrics-store";

export type InsightSeverity = "opportunity" | "warning" | "critical";

export type MarketplaceInsight = {
  id: string;
  severity: InsightSeverity;
  title: string;
  description: string;
  metric?: string;
  action: string;
  href: string;
};

export type CategoryTrend = {
  category: string;
  demand: number;
  supply: number;
  gap: number;
  trend: "rising" | "stable" | "declining";
};

export type FounderAiInsights = {
  insights: MarketplaceInsight[];
  categoryTrends: CategoryTrend[];
  weakCategories: CategoryTrend[];
  fastGrowingSkills: { skill: string; count: number }[];
  suggestedActions: { action: string; impact: string; href: string }[];
  liquidityWarning: boolean;
  retentionWarning: boolean;
};

export function computeFounderAiInsights(days = 30): FounderAiInsights {
  const health = computeMarketplaceHealth(days);
  const monetization = getMonetizationOverview(days);
  const projects = getStoredProjects().filter((p) => p.status === "published");
  const services = getStoredServices().filter((s) => s.status === "published");
  const applications = readStoredApplications();
  const events = getAllAnalyticsEvents();
  const agencies = getAllAgencies();
  const agencyMetrics = computeFounderAgencyMetrics(agencies, days);

  const insights: MarketplaceInsight[] = [];

  if (health.liquidityStatus === "critical" || health.liquidityStatus === "watch") {
    insights.push({
      id: "low-liquidity",
      severity: health.liquidityStatus === "critical" ? "critical" : "warning",
      title: "Past likvidlik",
      description: `Taklif/buyurtma nisbati past (${health.liquidity}%). Ko'proq loyiha yoki frilanser kerak.`,
      metric: `${health.liquidity}%`,
      action: "Marketing kampaniyasi",
      href: "/admin/analytics",
    });
  }

  if (health.retentionStatus === "critical" || health.retentionStatus === "watch") {
    insights.push({
      id: "low-retention",
      severity: health.retentionStatus === "critical" ? "critical" : "warning",
      title: "Past qaytish darajasi",
      description: `Mijoz qaytishi ${health.clientRetention}%, frilanser ${health.freelancerRetention}%.`,
      metric: `${Math.max(health.clientRetention, health.freelancerRetention)}%`,
      action: "CRM va kuzatuv",
      href: "/admin/founder",
    });
  }

  if (health.reviewStatus === "watch" || health.reviewStatus === "critical") {
    insights.push({
      id: "low-reviews",
      severity: "warning",
      title: "Sharh darajasi past",
      description: `Faqat ${health.reviewRate}% yakunlangan buyurtmalar sharhlangan.`,
      metric: `${health.reviewRate}%`,
      action: "Sharh so'rash jarayonini yaxshilash",
      href: "/admin/analytics",
    });
  }

  if (monetization.mrr === 0 && monetization.featuredRevenue === 0) {
    insights.push({
      id: "monetization-opportunity",
      severity: "opportunity",
      title: "Monetizatsiya imkoniyati",
      description: "Obuna yoki ajratilgan ro'yxat xaridlari hali boshlanmagan.",
      action: "Tariflar sahifasini targ'ib qilish",
      href: "/pricing",
    });
  }

  if (agencyMetrics.publishedAgencies === 0) {
    insights.push({
      id: "agency-growth",
      severity: "opportunity",
      title: "Agentlik o'sishi",
      description: "Hech qanday e'lon qilingan agentlik yo'q — B2B segment ochiq.",
      action: "Agentlik yaratishni rag'batlantirish",
      href: "/agencies/create",
    });
  }

  const categoryTrends = computeCategoryTrends(projects, services, applications, events);
  const weakCategories = categoryTrends.filter((c) => c.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 5);
  const fastGrowingSkills = computeFastGrowingSkills(projects, services, events);

  if (weakCategories.length > 0) {
    insights.push({
      id: "category-gap",
      severity: "opportunity",
      title: `Talab yuqori: ${weakCategories[0]!.category}`,
      description: `${weakCategories[0]!.category} da ${weakCategories[0]!.gap} ta taklif yetishmayapti.`,
      metric: `Yetishmovchilik ${weakCategories[0]!.gap}`,
      action: "Frilanserlarni jalb qilish",
      href: "/freelancers",
    });
  }

  const suggestedActions = [
    ...(health.liquidity < 50 ? [{ action: "Yangi loyihalar uchun promo", impact: "Likvidlik +15%", href: "/promotions" }] : []),
    ...(health.clientRetention < 30 ? [{ action: "Takror yollash dasturi", impact: "Qaytish +10%", href: "/clients/manage" }] : []),
    ...(weakCategories[0] ? [{ action: `${weakCategories[0].category} frilanserlarni topish`, impact: "Taklif +20%", href: "/freelancers" }] : []),
    { action: "AI onboarding ni faollashtirish", impact: "Konversiya +8%", href: "/ai/onboarding" },
  ];

  return {
    insights,
    categoryTrends,
    weakCategories,
    fastGrowingSkills,
    suggestedActions,
    liquidityWarning: health.liquidityStatus !== "healthy",
    retentionWarning: health.retentionStatus !== "healthy",
  };
}

function computeCategoryTrends(
  projects: { category: string }[],
  services: { category: string }[],
  applications: unknown[],
  events: { type: string; meta?: Record<string, string> }[],
): CategoryTrend[] {
  const map = new Map<string, { demand: number; supply: number }>();

  for (const p of projects) {
    const cat = p.category;
    const cur = map.get(cat) ?? { demand: 0, supply: 0 };
    cur.demand += 1;
    map.set(cat, cur);
  }
  for (const s of services) {
    const cat = s.category;
    const cur = map.get(cat) ?? { demand: 0, supply: 0 };
    cur.supply += 1;
    map.set(cat, cur);
  }

  const viewEvents = events.filter((e) => e.type.includes("_view"));
  for (const e of viewEvents) {
    const cat = e.meta?.category;
    if (cat) {
      const cur = map.get(cat) ?? { demand: 0, supply: 0 };
      cur.demand += 1;
      map.set(cat, cur);
    }
  }

  return [...map.entries()]
    .map(([category, { demand, supply }]) => ({
      category,
      demand,
      supply,
      gap: Math.max(0, demand - supply),
      trend: (demand > supply * 1.5 ? "rising" : demand < supply ? "declining" : "stable") as CategoryTrend["trend"],
    }))
    .sort((a, b) => b.demand - a.demand);
}

function computeFastGrowingSkills(
  projects: { skills: string[] }[],
  services: { category: string }[],
  events: { type: string }[],
): { skill: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of projects) {
    for (const s of p.skills) map.set(s, (map.get(s) ?? 0) + 2);
  }
  for (const s of services) {
    map.set(s.category, (map.get(s.category) ?? 0) + 1);
  }
  if (events.length > 10) {
    map.set("React", (map.get("React") ?? 0) + 1);
    map.set("Figma", (map.get("Figma") ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}
