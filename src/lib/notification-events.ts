import { addNotification, type NotificationKind } from "./notifications-store";
import { getSession } from "./auth";
import { queueReviewRequestEmail, flushEmailOutbox } from "./email-lifecycle";

export function notifyUser(
  userId: string,
  input: {
    kind: NotificationKind;
    title: string;
    body: string;
    priority?: "low" | "normal" | "high";
    href?: string;
  },
) {
  addNotification({ ...input, userId, priority: input.priority ?? "normal" });
}

export function notifyProposalReceived(userId: string, projectTitle: string, projectSlug: string) {
  notifyUser(userId, {
    kind: "proposal",
    title: "Yangi taklif olindi",
    body: `"${projectTitle}" loyihangiz uchun yangi taklif keldi.`,
    priority: "high",
    href: `/projects/${projectSlug}`,
  });
}

export function notifyProposalAccepted(userId: string, projectTitle: string, orderId: string) {
  notifyUser(userId, {
    kind: "proposal",
    title: "Taklif qabul qilindi",
    body: `"${projectTitle}" taklifingiz qabul qilindi. Buyurtma yaratildi.`,
    priority: "high",
    href: `/orders/${orderId}`,
  });
}

export function notifyProjectClosed(userId: string, projectTitle: string) {
  notifyUser(userId, {
    kind: "system",
    title: "Loyiha yopildi",
    body: `"${projectTitle}" loyihasi yopildi.`,
    priority: "normal",
    href: "/my-projects",
  });
}

export function notifyOrderCreated(userId: string, orderTitle: string, orderId: string) {
  notifyUser(userId, {
    kind: "order",
    title: "Buyurtma yaratildi",
    body: `"${orderTitle}" buyurtmasi yaratildi.`,
    priority: "high",
    href: `/orders/${orderId}`,
  });
}

export function notifyEscrowFunded(userId: string, amount: number, orderTitle: string, escrowId: string) {
  notifyUser(userId, {
    kind: "escrow",
    title: "Eskrou moliyalashtirildi",
    body: `$${amount.toLocaleString()} eskrouda saqlanmoqda — ${orderTitle}.`,
    priority: "high",
    href: `/escrow/${escrowId}`,
  });
}

export function notifyEscrowReleased(userId: string, amount: number, project: string, escrowId: string) {
  notifyUser(userId, {
    kind: "escrow",
    title: "Eskrou mablag'i chiqarildi",
    body: `$${amount.toLocaleString()} "${project}" uchun chiqarildi.`,
    priority: "high",
    href: `/escrow/${escrowId}`,
  });
}

export function notifyReviewReceived(userId: string, project: string, rating: number) {
  notifyUser(userId, {
    kind: "review",
    title: "Yangi sharh olindi",
    body: `"${project}" uchun ${rating} yulduzli sharh qoldirildi. Ishonch va qidiruv reytingi yangilandi.`,
    priority: "normal",
    href: "/profile",
  });
}

export function notifyReviewPrompt(userId: string, orderTitle: string, orderId: string) {
  notifyUser(userId, {
    kind: "review",
    title: "Sharh qoldiring — ishonch oshadi",
    body: `"${orderTitle}" yakunlandi. Sharhingiz reyting va qidiruv ko'rinishiga ta'sir qiladi.`,
    priority: "high",
    href: `/orders/${orderId}`,
  });

  const session = getSession();
  if (session?.user.id === userId && session.user.email) {
    queueReviewRequestEmail(session.user.email, orderTitle);
    void flushEmailOutbox();
  }
}

export function notifyReputationGrowth(
  userId: string,
  title: string,
  body: string,
  href = "/dashboard",
) {
  notifyUser(userId, {
    kind: "system",
    title,
    body,
    priority: "normal",
    href,
  });
}

export function notifyProfileMilestone(userId: string, percent: number) {
  notifyUser(userId, {
    kind: "system",
    title: percent >= 100 ? "Profil to'liq tayyor!" : "Profil deyarli tayyor",
    body:
      percent >= 100
        ? "100% profil — ishonch balli va qidiruvda ko'rinish yaxshilandi. Endi faol buyurtmalar oling."
        : `${percent}% profil — yana bir qadam qoldi. To'ldirish ishonch ballingizni oshiradi.`,
    priority: "normal",
    href: "/settings",
  });
}

export function notifyRepeatClient(freelancerUserId: string, clientName: string, repeatRate: number) {
  notifyUser(freelancerUserId, {
    kind: "order",
    title: "Takror mijoz!",
    body: `${clientName} siz bilan yana ishladi. Takror mijozlar: ${repeatRate}%.`,
    priority: "normal",
    href: "/dashboard/freelancer",
  });
}

export function notifyPortfolioApproved(userId: string, title: string, slug: string) {
  notifyUser(userId, {
    kind: "portfolio",
    title: "Portfolio tasdiqlandi",
    body: `"${title}" portfoliongiz e'lon qilindi.`,
    priority: "normal",
    href: `/portfolio/${slug}`,
  });
}

export function notifyAdminAction(userId: string, title: string, body: string, href?: string) {
  notifyUser(userId, {
    kind: "admin",
    title,
    body,
    priority: "high",
    href: href ?? "/admin",
  });
}
