import { addNotification, type NotificationKind } from "./notifications-store";

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
    body: `"${project}" uchun ${rating} yulduzli sharh qoldirildi.`,
    priority: "normal",
    href: "/profile",
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
