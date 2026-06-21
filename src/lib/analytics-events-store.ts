import { getSession } from "./auth";
import { bumpStoreVersion, STORE_KEYS } from "./store-version";

const STORAGE_KEY = "ishbor-analytics-events";
const listeners = new Set<() => void>();
let cache: AnalyticsEvent[] | null = null;

export type AnalyticsEventType =
  | "landing_view"
  | "profile_view"
  | "service_view"
  | "service_save"
  | "service_order"
  | "portfolio_view"
  | "portfolio_save"
  | "portfolio_share"
  | "contact_click"
  | "hire_conversion"
  | "checkout_start"
  | "order_created"
  | "order_completed"
  | "escrow_funded"
  | "project_created"
  | "proposal_received"
  | "proposal_accepted"
  | "featured_purchase"
  | "referral_credit_spent"
  | "subscription_purchase"
  | "credit_spent"
  | "credit_refund"
  | "credit_purchase"
  | "review_submitted"
  | "agency_view"
  | "agency_created"
  | "agency_published"
  | "agency_member_invited"
  | "agency_verified";

export type AnalyticsEvent = {
  id: string;
  type: AnalyticsEventType;
  timestamp: string;
  userId?: string;
  entityId?: string;
  value?: number;
  meta?: Record<string, string>;
};

export type DistinctAnalyticsEvent = AnalyticsEvent & { count: number };

const distinctRecentCache = new Map<string, DistinctAnalyticsEvent[]>();

function notify() {
  cache = null;
  distinctRecentCache.clear();
  bumpStoreVersion(STORE_KEYS.analyticsEvents);
  listeners.forEach((l) => l());
}

export function subscribeAnalyticsEvents(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): AnalyticsEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

function writeAll(events: AnalyticsEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, 5000)));
}

export function getAllAnalyticsEvents(): AnalyticsEvent[] {
  if (cache === null) cache = readAll();
  return cache;
}

export function recordAnalyticsEvent(
  input: Omit<AnalyticsEvent, "id" | "timestamp"> & { timestamp?: string },
): AnalyticsEvent {
  const event: AnalyticsEvent = {
    ...input,
    id: `ae-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: input.timestamp ?? new Date().toISOString(),
    userId: input.userId ?? getSession()?.user.id,
  };
  const next = [event, ...readAll()].slice(0, 5000);
  writeAll(next);
  cache = next;
  notify();
  return event;
}

export function getEventsSince(days: number): AnalyticsEvent[] {
  const cutoff = Date.now() - days * 86400000;
  return getAllAnalyticsEvents().filter((e) => new Date(e.timestamp).getTime() >= cutoff);
}

export function getEventsByType(type: AnalyticsEventType, days?: number): AnalyticsEvent[] {
  const events = days ? getEventsSince(days) : getAllAnalyticsEvents();
  return events.filter((e) => e.type === type);
}

export function getEventsForEntity(entityId: string, days?: number): AnalyticsEvent[] {
  const events = days ? getEventsSince(days) : getAllAnalyticsEvents();
  return events.filter((e) => e.entityId === entityId);
}

export function getRecentEventsForUser(userId: string, limit = 5): AnalyticsEvent[] {
  return getAllAnalyticsEvents()
    .filter((e) => e.userId === userId)
    .slice(0, limit);
}

/** Bir xil turdagi ketma-ket hodisalarni birlashtiradi (masalan, ikki marta "To'lov boshlandi"). */
export function dedupeActivityEvents(events: AnalyticsEvent[]): DistinctAnalyticsEvent[] {
  const result: DistinctAnalyticsEvent[] = [];
  for (const e of events) {
    const last = result[result.length - 1];
    const sameDay =
      last &&
      new Date(last.timestamp).toDateString() === new Date(e.timestamp).toDateString();
    if (last && last.type === e.type && sameDay) {
      last.count += 1;
    } else {
      result.push({ ...e, count: 1 });
    }
  }
  return result;
}

export function getDistinctRecentEventsForUser(userId: string, limit = 5): DistinctAnalyticsEvent[] {
  const key = `${userId}:${limit}`;
  const cached = distinctRecentCache.get(key);
  if (cached) return cached;
  const raw = getAllAnalyticsEvents().filter((e) => e.userId === userId);
  const result = dedupeActivityEvents(raw).slice(0, limit);
  distinctRecentCache.set(key, result);
  return result;
}

const EVENT_LABELS: Record<string, string> = {
  landing_view: "Bosh sahifani ko'rdi",
  profile_view: "Profil ko'rildi",
  service_view: "Xizmat ko'rildi",
  service_save: "Xizmat saqlandi",
  service_order: "Xizmat buyurtmasi",
  portfolio_view: "Portfolio ko'rildi",
  portfolio_save: "Portfolio saqlandi",
  portfolio_share: "Portfolio ulashildi",
  contact_click: "Aloqa bosildi",
  hire_conversion: "Yollash yakunlandi",
  checkout_start: "To'lov boshlandi",
  order_created: "Buyurtma yaratildi",
  order_completed: "Buyurtma yakunlandi",
  escrow_funded: "Eskrou moliyalashtirildi",
  project_created: "Loyiha yaratildi",
  proposal_received: "Taklif olindi",
  proposal_accepted: "Taklif qabul qilindi",
  featured_purchase: "Ajratilgan joy sotib olindi",
  referral_credit_spent: "Referral kredit sarflandi",
  subscription_purchase: "Obuna sotib olindi",
  credit_spent: "Kredit sarflandi",
  credit_refund: "Kredit qaytarildi",
  credit_purchase: "Kredit sotib olindi",
  review_submitted: "Sharh yuborildi",
  agency_view: "Agentlik ko'rildi",
  agency_created: "Agentlik yaratildi",
  agency_published: "Agentlik e'lon qilindi",
  agency_member_invited: "Jamoa a'zosi taklif qilindi",
  agency_verified: "Agentlik tasdiqlandi",
};

export function getEventLabel(type: AnalyticsEventType | string): string {
  if (EVENT_LABELS[type]) return EVENT_LABELS[type]!;
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function countEventsByType(types: AnalyticsEventType[], days: number): number {
  const cutoff = Date.now() - days * 86400000;
  return getAllAnalyticsEvents().filter(
    (e) => types.includes(e.type) && new Date(e.timestamp).getTime() >= cutoff,
  ).length;
}

export function sumEventValues(types: AnalyticsEventType[], days: number): number {
  const cutoff = Date.now() - days * 86400000;
  return getAllAnalyticsEvents()
    .filter((e) => types.includes(e.type) && new Date(e.timestamp).getTime() >= cutoff)
    .reduce((s, e) => s + (e.value ?? 0), 0);
}

/** Daily buckets for charts */
export function getDailyBuckets(
  types: AnalyticsEventType[],
  days: number,
  valueField = false,
): { date: string; label: string; value: number }[] {
  const buckets: { date: string; label: string; value: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("uz-UZ", { month: "short", day: "numeric" });
    const dayStart = new Date(dateKey).getTime();
    const dayEnd = dayStart + 86400000;
    const value = getAllAnalyticsEvents()
      .filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return types.includes(e.type) && t >= dayStart && t < dayEnd;
      })
      .reduce((s, e) => s + (valueField ? (e.value ?? 0) : 1), 0);
    buckets.push({ date: dateKey, label, value });
  }
  return buckets;
}

export function getWeeklyBuckets(types: AnalyticsEventType[], weeks: number, valueField = false) {
  const buckets: { label: string; value: number }[] = [];
  const now = Date.now();
  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = now - i * 7 * 86400000;
    const weekStart = weekEnd - 7 * 86400000;
    const value = getAllAnalyticsEvents()
      .filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return types.includes(e.type) && t >= weekStart && t < weekEnd;
      })
      .reduce((s, e) => s + (valueField ? (e.value ?? 0) : 1), 0);
    buckets.push({ label: `${weeks - i}-hafta`, value });
  }
  return buckets;
}

export function getMonthlyBuckets(types: AnalyticsEventType[], months: number, valueField = false) {
  const monthNames = ["Yan", "Fev", "Mar", "Aprel", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
  const buckets: { month: string; value: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = monthNames[d.getMonth()]!;
    const value = getAllAnalyticsEvents()
      .filter((e) => {
        const ed = new Date(e.timestamp);
        return types.includes(e.type) && ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
      })
      .reduce((s, e) => s + (valueField ? (e.value ?? 0) : 1), 0);
    buckets.push({ month, value });
  }
  return buckets;
}
