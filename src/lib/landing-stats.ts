import { freelancers, projects as mockProjects, services as mockServices } from "./mock-data";
import { getPublishedProjects } from "./projects-store";
import { getStoredServices } from "./services-store";
import { getMarketplaceStatistics } from "./marketplace-signals";

export type LandingStat = {
  label: string;
  value: string;
  isLive: boolean;
};

const CATEGORY_KEYWORDS: Record<string, RegExp> = {
  design: /design|dizayn|brand|brend|figma|ui|ux/i,
  development: /develop|dasturlash|web|mobile|ios|api|code/i,
  marketing: /market|growth|seo|smm|reklama|o'sish/i,
  video: /video|3d|motion|animatsiya|montaj/i,
  consulting: /consult|legal|strategy|maslahat|huquq/i,
  writing: /writing|copy|content|matn|tarjima/i,
};

/** Count real catalog items per category — no inflated marketing numbers. */
export function getCategoryLiveCount(slug: string): number {
  const pattern = CATEGORY_KEYWORDS[slug];
  if (!pattern) return 0;
  const services =
    typeof window !== "undefined"
      ? getStoredServices().filter((s) => s.status === "published" && pattern.test(`${s.title} ${s.category}`))
      : mockServices.filter((s) => pattern.test(`${s.title} ${s.category}`));
  const talent = freelancers.filter(
    (f) => pattern.test(`${f.title} ${f.skills.join(" ")}`),
  );
  return services.length + talent.length;
}

export function getLandingStats(): LandingStat[] {
  const liveProjects = typeof window !== "undefined" ? getPublishedProjects().length : 0;
  const stats = typeof window !== "undefined" ? getMarketplaceStatistics() : null;
  const liveServices = stats?.publishedServices ?? 0;
  const projectCount = liveProjects > 0 ? liveProjects : mockProjects.length;
  const talentCount = freelancers.length;
  const reviewCount = stats?.totalReviews ?? 0;
  const completedCount = stats?.completedOrders ?? 0;

  return [
    {
      label: "Ochiq loyihalar",
      value: `${projectCount}+`,
      isLive: liveProjects > 0,
    },
    {
      label: "Tekshirilgan mutaxassislar",
      value: `${talentCount}+`,
      isLive: false,
    },
    {
      label: "Faol xizmatlar",
      value: liveServices > 0 ? `${liveServices}+` : "50+",
      isLive: liveServices > 0,
    },
    {
      label: completedCount > 0 ? "Yakunlangan ishlar" : "Eskrou himoyasi",
      value: completedCount > 0 ? `${completedCount}+` : "100%",
      isLive: completedCount > 0 || reviewCount > 0,
    },
  ];
}
