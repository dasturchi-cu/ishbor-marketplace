import type { AuthUser } from "./auth";
import { computeTrustScore } from "./growth-metrics";
import { computeProfileCompletionPercent, getProfileCompletionItems } from "./profile-store";
import { getPublishedPortfoliosByUsername } from "./portfolio-store";
import { getMyPublishedServices } from "./services-store";
import { getAverageRating } from "./reviews-store";

export type TrustCoachInsight = {
  currentTrustScore: number;
  trustLabel: string;
  whyLow: string[];
  howToImprove: {
    action: string;
    impact: string;
    href: string;
    priority: "high" | "medium" | "low";
  }[];
  missingProfileSections: string[];
  missingPortfolioItems: boolean;
  estimatedGain: number;
};

export function getTrustCoachInsights(user: AuthUser): TrustCoachInsight {
  const username = user.username ?? "";
  const userType = user.userType === "client" ? "client" : "freelancer";
  const trust = computeTrustScore(user, username);
  const completion = computeProfileCompletionPercent(user.id, userType);
  const items = getProfileCompletionItems(user.id, userType);
  const missingProfileSections = items.filter((i) => !i.done).map((i) => i.label);
  const portfolios = username ? getPublishedPortfoliosByUsername(username) : [];
  const services = userType === "freelancer" ? getMyPublishedServices(user.id) : [];
  const { count: reviewCount } = username ? getAverageRating(username) : { count: 0 };

  const whyLow: string[] = [];
  if (trust.trustScore < 70) {
    if (completion < 80) whyLow.push(`Profil ${completion}% to'ldirilgan — to'liq profil ishonchni oshiradi`);
    if (portfolios.length === 0 && userType === "freelancer") whyLow.push("Portfolio yo'q — mijozlar natijalarni ko'ra olmaydi");
    if (reviewCount === 0) whyLow.push("Hali sharhlar yo'q — ijtimoiy isbot yetishmaydi");
    if (trust.responseRate < 60) whyLow.push(`Javob foizi ${trust.responseRate}% — tezroq javob bering`);
    if (trust.successScore < 50) whyLow.push(`Muvaffaqiyat balli ${trust.successScore} — buyurtmalarni yakunlang`);
  }
  if (whyLow.length === 0 && trust.trustScore < 90) {
    whyLow.push("Yaxshi holat — portfolio va sharhlarni oshirish bilan Elite darajaga yetasiz");
  }

  const howToImprove: TrustCoachInsight["howToImprove"] = [];

  for (const item of items.filter((i) => !i.done)) {
    howToImprove.push({
      action: item.label,
      impact: `+${item.weight} ball profil to'ldirish`,
      href: item.href,
      priority: item.weight >= 20 ? "high" : "medium",
    });
  }

  if (portfolios.length === 0 && userType === "freelancer") {
    howToImprove.push({
      action: "Portfolio e'lon qiling",
      impact: "Ishonch balli +15–20",
      href: "/portfolio/create",
      priority: "high",
    });
  }

  if (services.length === 0 && userType === "freelancer") {
    howToImprove.push({
      action: "Xizmat yarating",
      impact: "Ishonch balli +8",
      href: "/services/create",
      priority: "medium",
    });
  }

  if (reviewCount === 0) {
    howToImprove.push({
      action: "Birinchi buyurtmani yakunlang va sharh oling",
      impact: "Ishonch balli +10",
      href: "/projects",
      priority: "high",
    });
  }

  const pendingGain = howToImprove.reduce((s, h) => {
    const m = h.impact.match(/\+(\d+)/);
    return s + (m ? parseInt(m[1]!, 10) : 5);
  }, 0);

  return {
    currentTrustScore: trust.trustScore,
    trustLabel: trust.label,
    whyLow,
    howToImprove: howToImprove.slice(0, 6),
    missingProfileSections,
    missingPortfolioItems: portfolios.length === 0,
    estimatedGain: Math.min(100 - trust.trustScore, pendingGain),
  };
}
