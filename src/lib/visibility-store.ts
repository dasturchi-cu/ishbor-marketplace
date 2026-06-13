import { getAllAnalyticsEvents, getEventsSince } from "./analytics-events-store";

export type VisibilityEntityType = "service" | "profile" | "project" | "portfolio";

export type VisibilityFunnel = {
  views: number;
  clicks: number;
  saves: number;
  contacts: number;
  orders: number;
  viewToContact: number;
  contactToOrder: number;
};

const VIEW_EVENTS: Record<VisibilityEntityType, string[]> = {
  service: ["service_view"],
  profile: ["profile_view"],
  project: ["project_view"],
  portfolio: ["portfolio_view"],
};

export function getVisibilityFunnel(entityType: VisibilityEntityType, entityId: string, days = 30): VisibilityFunnel {
  const events = getEventsSince(days);
  const viewTypes = VIEW_EVENTS[entityType];

  const views = events.filter((e) => viewTypes.includes(e.type) && e.entityId === entityId).length;
  const saves = events.filter(
    (e) =>
      (e.type === "service_save" || e.type === "portfolio_save") &&
      e.entityId === entityId,
  ).length;
  const contacts = events.filter((e) => e.type === "contact_click" && e.entityId === entityId).length;
  const orders = events.filter(
    (e) =>
      (e.type === "service_order" || e.type === "order_created") &&
      (e.entityId === entityId || e.meta?.slug === entityId),
  ).length;
  const clicks = contacts + saves;

  const viewToContact = views > 0 ? Math.round((contacts / views) * 100) : 0;
  const contactToOrder = contacts > 0 ? Math.round((orders / contacts) * 100) : 0;

  return { views, clicks, saves, contacts, orders, viewToContact, contactToOrder };
}

export function getOwnerVisibilitySummary(
  ownerUsername: string,
  slugs: { services?: string[]; portfolios?: string[] },
  days = 30,
): VisibilityFunnel {
  const profile = getVisibilityFunnel("profile", ownerUsername, days);
  let total: VisibilityFunnel = { ...profile };

  for (const slug of slugs.services ?? []) {
    const s = getVisibilityFunnel("service", slug, days);
    total = mergeFunnels(total, s);
  }
  for (const slug of slugs.portfolios ?? []) {
    const p = getVisibilityFunnel("portfolio", slug, days);
    total = mergeFunnels(total, p);
  }

  total.viewToContact = total.views > 0 ? Math.round((total.contacts / total.views) * 100) : 0;
  total.contactToOrder = total.contacts > 0 ? Math.round((total.orders / total.contacts) * 100) : 0;
  return total;
}

function mergeFunnels(a: VisibilityFunnel, b: VisibilityFunnel): VisibilityFunnel {
  return {
    views: a.views + b.views,
    clicks: a.clicks + b.clicks,
    saves: a.saves + b.saves,
    contacts: a.contacts + b.contacts,
    orders: a.orders + b.orders,
    viewToContact: 0,
    contactToOrder: 0,
  };
}

export function getMarketplaceVisibilityOverview(days = 30) {
  const events = getEventsSince(days);
  return {
    totalViews: events.filter((e) => e.type.endsWith("_view") || e.type === "landing_view").length,
    totalContacts: events.filter((e) => e.type === "contact_click").length,
    totalOrders: events.filter((e) => e.type === "order_created" || e.type === "service_order").length,
    totalSaves: events.filter((e) => e.type.endsWith("_save")).length,
  };
}
