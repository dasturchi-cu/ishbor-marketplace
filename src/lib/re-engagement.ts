import { getSession } from "./auth";
import { getAllAnalyticsEvents } from "./analytics-events-store";
import { queueReEngagementEmail } from "./email-lifecycle";

const LAST_ACTIVE_KEY = "ishbor-last-active";
const REENGAGE_SENT_KEY = "ishbor-reengage-sent";
const INACTIVE_DAYS = 7;

function readLastActive(userId: string): number {
  if (typeof window === "undefined") return Date.now();
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return map[userId] ?? Date.now();
  } catch {
    return Date.now();
  }
}

function writeLastActive(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map[userId] = Date.now();
    localStorage.setItem(LAST_ACTIVE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function wasReengageSent(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(REENGAGE_SENT_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    const sent = map[userId];
    if (!sent) return false;
    const daysSince = (Date.now() - new Date(sent).getTime()) / (86400000);
    return daysSince < 30;
  } catch {
    return false;
  }
}

function markReengageSent(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(REENGAGE_SENT_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[userId] = new Date().toISOString();
    localStorage.setItem(REENGAGE_SENT_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Call on app bootstrap to track activity and queue re-engagement if inactive. */
export function trackUserActivity(): void {
  const session = getSession();
  if (!session) return;

  const userId = session.user.id;
  const lastActive = readLastActive(userId);
  const daysSince = (Date.now() - lastActive) / 86400000;

  if (daysSince >= INACTIVE_DAYS && !wasReengageSent(userId) && session.user.email) {
    queueReEngagementEmail(session.user.email, session.user.fullName ?? "Foydalanuvchi");
    markReengageSent(userId);
  }

  writeLastActive(userId);
}

/** Derive last activity from analytics events (admin/founder use). */
export function getDaysSinceLastActivity(userId: string): number | null {
  const events = getAllAnalyticsEvents().filter((e) => e.userId === userId);
  if (events.length === 0) return null;
  const latest = Math.max(...events.map((e) => new Date(e.timestamp).getTime()));
  return Math.floor((Date.now() - latest) / 86400000);
}
