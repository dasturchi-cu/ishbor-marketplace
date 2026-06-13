import {
  getAllAnalyticsEvents,
  getEventsSince,
  recordAnalyticsEvent,
  type AnalyticsEventType,
} from "./analytics-events-store";

export type ConversionFunnelStep =
  | "landing_view"
  | "profile_view"
  | "service_view"
  | "contact_click"
  | "checkout_start"
  | "order_created"
  | "order_completed";

const FUNNEL_STEPS: ConversionFunnelStep[] = [
  "landing_view",
  "profile_view",
  "service_view",
  "contact_click",
  "checkout_start",
  "order_created",
  "order_completed",
];

export function recordConversionEvent(
  step: ConversionFunnelStep,
  entityId?: string,
  value?: number,
): void {
  recordAnalyticsEvent({ type: step, entityId, value });
}

export function getFunnelCounts(days = 30): Record<ConversionFunnelStep, number> {
  const events = getEventsSince(days);
  const result = {} as Record<ConversionFunnelStep, number>;
  for (const step of FUNNEL_STEPS) {
    result[step] = events.filter((e) => e.type === step).length;
  }
  return result;
}

export function getConversionRates(days = 30) {
  const counts = getFunnelCounts(days);
  const rate = (from: number, to: number) => (from > 0 ? Math.round((to / from) * 100) : 0);

  return {
    viewToContact: rate(counts.service_view + counts.profile_view, counts.contact_click),
    contactToHire: rate(counts.contact_click, counts.checkout_start),
    hireToOrder: rate(counts.checkout_start, counts.order_created),
    orderToComplete: rate(counts.order_created, counts.order_completed),
    overallConversion: rate(counts.landing_view, counts.order_completed),
    counts,
  };
}

export function getConversionHealth(days = 30): "healthy" | "watch" | "critical" {
  const rates = getConversionRates(days);
  if (rates.overallConversion >= 5 || rates.orderToComplete >= 50) return "healthy";
  if (rates.overallConversion >= 2 || rates.orderToComplete >= 25) return "watch";
  return "critical";
}

export const funnelStepLabels: Record<ConversionFunnelStep, string> = {
  landing_view: "Bosh sahifa ko'rishlari",
  profile_view: "Profil ko'rishlari",
  service_view: "Xizmat ko'rishlari",
  contact_click: "Aloqa bosishlari",
  checkout_start: "To'lov boshlandi",
  order_created: "Buyurtmalar yaratildi",
  order_completed: "Buyurtmalar yakunlandi",
};

export { FUNNEL_STEPS };
