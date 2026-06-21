/** Page- and order-level journey guidance — one primary action per context. */

import type { Order } from "./mock-data";
import type { AuthUser } from "./auth";
import type { WorkspaceRole } from "./active-role-store";
import {
  getPendingReviewOrders,
  getClientRepeatHireStats,
  getSavedFavoriteFreelancers,
  countPendingReviews,
} from "./ecosystem-progress";
import {
  resolveContextualNextAction,
  type NextAction,
} from "./next-action-resolver";
import { enrichOnboardingPlan } from "./ai-onboarding-wizard";
import {
  computeProfileCompletionPercent,
  getProfileCompletionItems,
} from "./profile-store";
import { getOrderReviewDirection, hasUserReviewedOrder } from "./reviews-store";
import { readStoredOrders } from "./orders-store";

export type JourneyBanner = {
  purpose: string;
  nextStep: string;
  href: string;
  search?: Record<string, string>;
  cta: string;
  variant?: "default" | "urgent" | "success";
};

export type NextActionWithPriority = NextAction & { urgent?: boolean };

/** Merge onboarding, profile, and live work — urgent work always wins. */
export function resolvePrimaryNextAction(
  user: AuthUser,
  role: WorkspaceRole,
): NextActionWithPriority | null {
  const contextual = resolveContextualNextAction(user, role);
  const urgentContext =
    contextual &&
    (contextual.urgent ||
      countPendingReviews(user) > 0 ||
      contextual.title.includes("taklif") ||
      contextual.title.includes("yakunlang") ||
      contextual.title.includes("bajaring") ||
      contextual.title.includes("Sharh"));

  if (urgentContext && contextual) {
    return { ...contextual, urgent: true };
  }

  const plan = enrichOnboardingPlan(user);
  const nextWizardStep = plan.steps.find((s) => !s.done);
  if (nextWizardStep && plan.progress < 100) {
    return {
      title: nextWizardStep.title,
      description: nextWizardStep.description,
      href: nextWizardStep.href,
      cta: nextWizardStep.cta,
    };
  }

  const completionPercent = computeProfileCompletionPercent(user.id, role);
  const nextProfileItem = getProfileCompletionItems(user.id, role).find((i) => !i.done);
  if (nextProfileItem && completionPercent < 100) {
    return {
      title: nextProfileItem.label,
      description: "Profil to'ldirish — ishonch ballingiz oshadi va ko'rinish oshadi.",
      href: nextProfileItem.href,
      cta: "Davom etish",
    };
  }

  return contextual;
}

export function resolveOrderJourneyBanner(order: Order, user: AuthUser): JourneyBanner | null {
  const isClient =
    user.id === order.ownerUserId ||
    order.clientSlug === user.companySlug ||
    order.client === user.fullName ||
    (user.company && order.client === user.company);
  const isFreelancer = order.freelancerUsername === user.username;
  const direction = getOrderReviewDirection(user, order);
  const needsReview =
    order.status === "completed" &&
    direction &&
    !hasUserReviewedOrder(order.id, direction);

  if (needsReview) {
    return {
      purpose: "Buyurtma yakunlandi",
      nextStep: "Sharh qoldiring — keyingi yollashda ishonchingiz oshadi.",
      href: `/orders/${order.id}`,
      cta: "Sharh yozish",
      variant: "success",
    };
  }

  if (order.status === "review" && isClient) {
    return {
      purpose: "Yetkazib berishni tekshiring",
      nextStep: "Ish qoniqarli bo'lsa tasdiqlang — to'lov frilanserga o'tadi.",
      href: `/orders/${order.id}`,
      cta: "Tasdiqlash",
      variant: "urgent",
    };
  }

  if (order.status === "in_progress" && isFreelancer) {
    return {
      purpose: "Buyurtma jarayonda",
      nextStep: "Muddatga rioya qiling va natijani yuboring — mijoz tasdiqlashini kutadi.",
      href: `/orders/${order.id}`,
      cta: "Jarayonni ko'rish",
      variant: "default",
    };
  }

  if (order.status === "in_progress" && isClient && order.freelancerUsername) {
    return {
      purpose: "Buyurtma jarayonda",
      nextStep: "Frilanser bilan aloqada bo'ling — savollar bo'lsa xabar yozing.",
      href: "/messages",
      search: { with: order.freelancerUsername },
      cta: "Xabar yozish",
      variant: "default",
    };
  }

  if (order.status === "revision" && isFreelancer) {
    return {
      purpose: "Tuzatish talab qilindi",
      nextStep: "Mijoz fikrlarini hisobga olib yangilangan natijani yuboring.",
      href: `/orders/${order.id}`,
      cta: "Tuzatishni davom ettirish",
      variant: "urgent",
    };
  }

  return null;
}

export function resolveOrdersListBanner(user: AuthUser, role: WorkspaceRole): JourneyBanner {
  const pendingReviews = getPendingReviewOrders(user);
  if (pendingReviews.length > 0) {
    const o = pendingReviews[0]!;
    return {
      purpose: "Sharh kutilmoqda",
      nextStep: `"${o.title}" yakunlandi — 1 daqiqada sharh qoldiring.`,
      href: `/orders/${o.id}`,
      cta: "Sharh yozish",
      variant: "success",
    };
  }

  if (role === "client") {
    const repeat = getClientRepeatHireStats(user);
    if (repeat.priorFreelancerUsernames.length > 0) {
      return {
        purpose: "Qayta yollash",
        nextStep: "Oldingi hamkoringiz bilan tezroq yangi buyurtma oching.",
        href: `/freelancers/${repeat.priorFreelancerUsernames[0]}`,
        cta: "Qayta yollash",
      };
    }
    const saved = getSavedFavoriteFreelancers(user.id);
    if (saved.length > 0) {
      return {
        purpose: "Saqlangan mutaxassislar",
        nextStep: "Saqlagan frilanserlaringizdan birini tanlang.",
        href: `/freelancers/${saved[0]!.id}`,
        cta: "Profilni ko'rish",
      };
    }
    return {
      purpose: "Buyurtmalaringiz",
      nextStep: "Yangi ish boshlash uchun loyiha joylang yoki mutaxassis qidiring.",
      href: "/search",
      cta: "Bozordan qidirish",
    };
  }

  return {
    purpose: "Buyurtmalaringiz",
    nextStep: "Faol buyurtmalarni bajaring — yakunlangan ishlar reytingingizni oshiradi.",
    href: "/projects",
    cta: "Yangi ish topish",
  };
}

export function resolveMessagesJourneyBanner(user: AuthUser, role: WorkspaceRole): JourneyBanner {
  const pendingReviews = getPendingReviewOrders(user);
  if (pendingReviews.length > 0) {
    const o = pendingReviews[0]!;
    return {
      purpose: "Sharh kutilmoqda",
      nextStep: `"${o.title}" yakunlandi — sharh qoldiring.`,
      href: `/orders/${o.id}`,
      cta: "Sharh yozish",
      variant: "success",
    };
  }

  const activeOrders = readStoredOrders().filter((o) => {
    if (o.status !== "in_progress" && o.status !== "review") return false;
    if (role === "client") {
      return (
        o.ownerUserId === user.id ||
        o.clientSlug === user.companySlug ||
        o.client === user.fullName ||
        o.client === user.company
      );
    }
    return o.freelancerUsername === user.username;
  });

  if (activeOrders.length > 0) {
    return {
      purpose: "Faol buyurtmalar",
      nextStep: `${activeOrders.length} ta faol buyurtma — tez javob reytingingizni oshiradi.`,
      href: "/orders",
      cta: "Buyurtmalarni ko'rish",
      variant: "urgent",
    };
  }

  return {
    purpose: "Xabarlar markazi",
    nextStep: "Hamkorlar bilan aloqa — taklif va buyurtmalar shu yerda davom etadi.",
    href: "/search",
    cta: "Yangi hamkor topish",
  };
}
