import type { Agency } from "./agency-types";
import { computeAgencyMetrics } from "./agency-metrics-store";
import { getEntityEventCount } from "./analytics-utils";

export type AgencyRankingInput = {
  agency: Agency;
  metrics?: ReturnType<typeof computeAgencyMetrics>;
};

/** Agency ranking 0–100 from real stored actions only */
export function computeAgencyRankingScore(input: AgencyRankingInput): number {
  const metrics = input.metrics ?? computeAgencyMetrics(input.agency);
  const agency = input.agency;

  const trustComponent = metrics.trustScore * 0.25;
  const successComponent = metrics.successScore * 0.25;
  const reviewScore = metrics.reviewCount > 0 ? Math.min(10, metrics.rating * 2) : 0;
  const responseComponent = metrics.responseRate * 0.15;

  const activeMembers = agency.members.filter((m) => m.status === "active").length;
  const teamSizeScore = Math.min(10, activeMembers * 1.5);

  const views = getEntityEventCount("agency_view", agency.slug);
  const activityScore = Math.min(15, views);

  let verificationBoost = 0;
  if (agency.verificationLevel === "enterprise") verificationBoost = 15;
  else if (agency.verificationLevel === "premium") verificationBoost = 10;
  else if (agency.verificationLevel === "verified") verificationBoost = 5;

  const raw =
    trustComponent +
    successComponent +
    responseComponent +
    reviewScore +
    teamSizeScore +
    activityScore +
    verificationBoost;

  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function rankAgencies(agencies: Agency[]): (Agency & { rankingScore: number; metrics: ReturnType<typeof computeAgencyMetrics> })[] {
  return agencies
    .map((agency) => {
      const metrics = computeAgencyMetrics(agency);
      return {
        ...agency,
        metrics,
        rankingScore: computeAgencyRankingScore({ agency, metrics }),
      };
    })
    .sort((a, b) => b.rankingScore - a.rankingScore);
}
