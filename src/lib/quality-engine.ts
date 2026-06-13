import type { AuthUser } from "./auth";
import { computeProfileCompletionPercent, getUserProfile } from "./profile-store";
import { getPublishedPortfoliosByUsername } from "./portfolio-store";
import { getMyPublishedServices } from "./services-store";
import { computeResponseRate, computeSuccessScore } from "./growth-metrics";
import { getAverageRating } from "./reviews-store";
import { getAllServices } from "./services-store";

export type QualityIssue = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  href: string;
};

export function getFreelancerQualityIssues(user: AuthUser): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const username = user.username ?? "";
  const profileCompletion = computeProfileCompletionPercent(user.id, "freelancer");
  const portfolios = username ? getPublishedPortfoliosByUsername(username) : [];
  const services = getMyPublishedServices(user.id);
  const { count: reviewCount } = username ? getAverageRating(username) : { count: 0 };
  const response = username ? computeResponseRate(username) : { rate: 0, totalIncoming: 0 };
  const success = username ? computeSuccessScore(username) : { completedJobs: 0 };

  if (profileCompletion < 70) {
    issues.push({
      id: "incomplete-profile",
      severity: "high",
      title: "Profil to'liq emas",
      description: `Profil ${profileCompletion}% to'ldirilgan. To'liq profil ko'proq yollash oladi.`,
      action: "Profilni to'ldirish",
      href: "/settings",
    });
  }

  if (portfolios.length === 0) {
    issues.push({
      id: "no-portfolio",
      severity: "high",
      title: "Portfolio yo'q",
      description: "Portfolio ishlarini qo'shing — mijozlar ishonchni shu orqali ko'radi.",
      action: "Portfolio yaratish",
      href: "/portfolio/create",
    });
  }

  if (reviewCount === 0 && success.completedJobs === 0) {
    issues.push({
      id: "no-reviews",
      severity: "medium",
      title: "Hali sharhlar yo'q",
      description: "Birinchi buyurtmani yakunlang va sharh oling — reyting o'sadi.",
      action: "Ish topish",
      href: "/projects",
    });
  }

  if (response.totalIncoming >= 3 && response.rate < 50) {
    issues.push({
      id: "low-response",
      severity: "high",
      title: "Past javob berish darajasi",
      description: `Javob darajasi ${response.rate}%. 24 soat ichida javob bering.`,
      action: "Xabarlarni ochish",
      href: "/messages",
    });
  }

  if (services.length === 0) {
    issues.push({
      id: "no-services",
      severity: "medium",
      title: "Xizmat e'lon qilinmagan",
      description: "Tayyor xizmat taklif qiling — passiv daromad oling.",
      action: "Xizmat yaratish",
      href: "/services/create",
    });
  }

  const expiredServices = services.filter((s) => {
    if (!s.featuredUntil) return false;
    return new Date(s.featuredUntil).getTime() < Date.now() && s.featured;
  });
  if (expiredServices.length > 0) {
    issues.push({
      id: "expired-featured",
      severity: "low",
      title: "Ajratilgan muddati tugagan",
      description: `${expiredServices.length} ta xizmat featured muddati tugagan.`,
      action: "Xizmatlarni yangilash",
      href: "/my-services",
    });
  }

  return issues;
}

export function getClientQualityIssues(user: AuthUser): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const profileCompletion = computeProfileCompletionPercent(user.id, "client");
  const profile = getUserProfile(user.id);

  if (profileCompletion < 60) {
    issues.push({
      id: "incomplete-client-profile",
      severity: "high",
      title: "Kompaniya profili to'liq emas",
      description: "To'liq profil frilanserlarning ishonchini oshiradi.",
      action: "Profilni to'ldirish",
      href: "/settings",
    });
  }

  if (!profile?.company && !user.company) {
    issues.push({
      id: "no-company",
      severity: "medium",
      title: "Kompaniya nomi yo'q",
      description: "Kompaniya ma'lumotini qo'shing.",
      action: "Sozlamalar",
      href: "/settings",
    });
  }

  return issues;
}

export function getMarketplaceQualitySummary() {
  const services = getAllServices().filter((s) => s.status === "published");
  const expiredFeatured = services.filter(
    (s) => s.featured && s.featuredUntil && new Date(s.featuredUntil).getTime() < Date.now(),
  ).length;

  return {
    publishedServices: services.length,
    expiredFeatured,
    lowQualityServices: services.filter((s) => s.rating < 4 && s.reviews === 0).length,
  };
}
