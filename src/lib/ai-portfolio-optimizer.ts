import type { AuthUser } from "./auth";
import { getPublishedPortfoliosByUsername } from "./portfolio-store";
import { getUserProfile } from "./profile-store";
import { getMyPublishedServices } from "./services-store";
import { getFreelancerQualityIssues } from "./quality-engine";

export type PortfolioOptimization = {
  portfolioCount: number;
  caseStudyCount: number;
  missingSkills: string[];
  weakAreas: string[];
  suggestions: {
    id: string;
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    impact: string;
    href: string;
  }[];
  score: number;
};

const MARKETPLACE_SKILLS = [
  "Figma", "React", "Next.js", "UI/UX", "Brand Identity",
  "TypeScript", "Node.js", "SEO", "Content Strategy", "Motion Graphics",
];

export function analyzePortfolio(user: AuthUser): PortfolioOptimization {
  const username = user.username ?? "";
  const portfolios = username ? getPublishedPortfoliosByUsername(username) : [];
  const profile = getUserProfile(user.id);
  const userSkills = profile?.skills ?? [];
  const services = getMyPublishedServices(user.id);
  const qualityIssues = getFreelancerQualityIssues(user);

  const caseStudyCount = portfolios.filter((p) => p.caseStudy?.finalResult?.trim()).length;
  const missingSkills = MARKETPLACE_SKILLS.filter(
    (ms) => !userSkills.some((us) => us.toLowerCase().includes(ms.toLowerCase())),
  ).slice(0, 5);

  const weakAreas: string[] = [];
  if (portfolios.length === 0) weakAreas.push("Portfolio yo'q");
  if (caseStudyCount === 0 && portfolios.length > 0) weakAreas.push("Loyiha hikoyasi to'liq emas");
  if (portfolios.length > 0 && portfolios.every((p) => !p.metrics?.length)) weakAreas.push("Metrikalar qo'shilmagan");
  if (services.length === 0) weakAreas.push("Xizmat e'lon qilinmagan");
  if (userSkills.length < 3) weakAreas.push("Ko'nikmalar yetarli emas");

  const suggestions: PortfolioOptimization["suggestions"] = [];

  if (portfolios.length === 0) {
    suggestions.push({
      id: "add-portfolio",
      priority: "high",
      title: "Birinchi portfolio qo'shing",
      description: "Portfolio bo'lmasa mijozlar ishonch bildirmaydi.",
      impact: "Ishonch balli +15–20",
      href: "/portfolio/create",
    });
  } else if (portfolios.length < 3) {
    suggestions.push({
      id: "more-portfolio",
      priority: "medium",
      title: `${3 - portfolios.length} ta portfolio qo'shing`,
      description: "3+ portfolio ko'rishlar va yollash ehtimolini oshiradi.",
      impact: "Imkoniyat balli +10",
      href: "/portfolio/create",
    });
  }

  if (caseStudyCount < portfolios.length) {
    suggestions.push({
      id: "case-studies",
      priority: "high",
      title: "Loyiha hikoyasini to'ldiring",
      description: `${portfolios.length - caseStudyCount} ta loyihada loyiha hikoyasi to'liq emas.`,
      impact: "Ishonch balli +8",
      href: portfolios[0] ? `/portfolio/edit/${portfolios[0]!.slug}` : "/portfolio/create",
    });
  }

  for (const issue of qualityIssues.slice(0, 3)) {
    suggestions.push({
      id: issue.id,
      priority: issue.severity,
      title: issue.title,
      description: issue.description,
      impact: issue.severity === "high" ? "Ishonch balli +10" : "Imkoniyat balli +5",
      href: issue.href,
    });
  }

  if (missingSkills.length > 0 && userSkills.length > 0) {
    suggestions.push({
      id: "trending-skills",
      priority: "low",
      title: "Trend ko'nikmalarni qo'shing",
      description: `Bozorda talab: ${missingSkills.slice(0, 3).join(", ")}`,
      impact: "Moslik balli +12",
      href: "/onboarding/skills",
    });
  }

  let score = 0;
  score += Math.min(30, portfolios.length * 10);
  score += Math.min(25, caseStudyCount * 12);
  score += Math.min(20, userSkills.length * 4);
  score += services.length > 0 ? 15 : 0;
  score += qualityIssues.filter((i) => i.severity === "high").length === 0 ? 10 : 0;

  return {
    portfolioCount: portfolios.length,
    caseStudyCount,
    missingSkills,
    weakAreas,
    suggestions,
    score: Math.min(100, score),
  };
}
