import { getSession } from "./auth";
import { setServiceFeatured } from "./services-store";
import { updateProjectFeatured } from "./projects-store";
import { setPortfolioFeatured } from "./portfolio-store";
import { spendCredits, refundCredits } from "./credits-store";
import { getFeaturedDiscount } from "./subscription-store";
import { recordFeaturedListing } from "./featured-listings-store";
import { addNotification } from "./notifications-store";
import { recordRevenueEntry } from "./revenue-store";
import { recordAnalyticsEvent } from "./analytics-events-store";

const BASE_FEATURED_COST = 100000;
const FEATURED_DAYS = 7;

export type FeaturedTarget = {
  type: "service" | "project" | "profile" | "portfolio";
  slug: string;
  title: string;
};

export function getFeaturedCost(userId?: string): number {
  const discount = getFeaturedDiscount(userId);
  return Math.round(BASE_FEATURED_COST * (1 - discount));
}

export function getFeaturedDurationDays(): number {
  return FEATURED_DAYS;
}

export function purchaseFeaturedListing(
  target: FeaturedTarget,
): { ok: true } | { ok: false; error: string } {
  const session = getSession();
  if (!session) return { ok: false, error: "Tizimga kiring." };

  const cost = getFeaturedCost(session.user.id);
  const start = new Date();
  const end = new Date(start.getTime() + FEATURED_DAYS * 86400000);

  const spent = spendCredits(session.user.id, cost, `Ajratilgan: ${target.title}`, target.slug, {
    targetType: target.type,
  });
  if (!spent.ok) return { ok: false, error: spent.error };

  if (target.type === "service") {
    const updated = setServiceFeatured(target.slug, true, FEATURED_DAYS);
    if (!updated) {
      refundCredits(session.user.id, cost, "Ajratilgan xizmat topilmadi", target.slug);
      return { ok: false, error: "Xizmat topilmadi." };
    }
  } else if (target.type === "project") {
    const updated = updateProjectFeatured(target.slug, true, FEATURED_DAYS);
    if (!updated) {
      refundCredits(session.user.id, cost, "Ajratilgan loyiha topilmadi", target.slug);
      return { ok: false, error: "Loyiha topilmadi." };
    }
  } else if (target.type === "portfolio") {
    const updated = setPortfolioFeatured(target.slug, true, FEATURED_DAYS);
    if (!updated) {
      refundCredits(session.user.id, cost, "Ajratilgan portfolio topilmadi", target.slug);
      return { ok: false, error: "Portfolio topilmadi." };
    }
  } else {
    localStorage.setItem(
      `ishbor-featured-profile-${session.user.id}`,
      JSON.stringify({ until: end.toISOString(), start: start.toISOString() }),
    );
  }

  recordFeaturedListing({
    type: target.type,
    slug: target.slug,
    title: target.title,
    userId: session.user.id,
    creditsSpent: cost,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  });

  recordRevenueEntry({
    type: "featured_purchase",
    amount: cost,
    userId: session.user.id,
    entityId: target.slug,
    meta: { targetType: target.type, title: target.title },
  });

  recordAnalyticsEvent({
    type: "featured_purchase",
    entityId: target.slug,
    value: cost,
    meta: { targetType: target.type },
  });

  addNotification({
    userId: session.user.id,
    kind: "system",
    title: "Ajratilgan ro'yxat faollashdi",
    body: `"${target.title}" ${FEATURED_DAYS} kun davomida ajratib ko'rsatiladi.`,
    priority: "normal",
    href:
      target.type === "service" ? `/services/${target.slug}`
      : target.type === "project" ? `/projects/${target.slug}`
      : target.type === "portfolio" ? `/portfolio/${target.slug}`
      : `/freelancers/${session.user.username ?? ""}`,
  });

  return { ok: true };
}
export function isFeaturedActive(featured?: boolean, featuredUntil?: string): boolean {
  if (!featured) return false;
  if (!featuredUntil) return true;
  return new Date(featuredUntil).getTime() > Date.now();
}

export function isProfileFeatured(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(`ishbor-featured-profile-${userId}`);
    if (!raw) return false;
    const { until } = JSON.parse(raw) as { until: string };
    return new Date(until).getTime() > Date.now();
  } catch {
    return false;
  }
}
