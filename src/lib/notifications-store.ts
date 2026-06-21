import { getSession } from "./auth";
import { persistRead, persistWrite } from "./store-persist";
import { getUserSettings } from "./settings-store";
import { queueNotificationEmail } from "./email-lifecycle";

const STORAGE_KEY = "ishbor-notifications";
const listeners = new Set<() => void>();
let cache: Map<string, AppNotification[]> | null = null;

export type NotificationKind =
  | "payment"
  | "proposal"
  | "review"
  | "system"
  | "message"
  | "escrow"
  | "order"
  | "portfolio"
  | "admin";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  time: string;
  read: boolean;
  priority: "low" | "normal" | "high";
  href?: string;
  userId?: string;
};

function notify() {
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribeNotifications(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Record<string, AppNotification[]> {
  if (typeof window === "undefined") return {};
  const parsed = persistRead<Record<string, AppNotification[]> | AppNotification[]>(STORAGE_KEY, {});
  if (Array.isArray(parsed)) return {};
  return parsed;
}

function writeAll(data: Record<string, AppNotification[]>) {
  if (typeof window === "undefined") return;
  persistWrite(STORAGE_KEY, data);
}


const EMPTY_NOTIFICATIONS: AppNotification[] = [];

function kindAllowed(kind: NotificationKind, userId: string): boolean {
  const prefs = getUserSettings(userId).notifications;
  if (kind === "system" || kind === "admin") return true;
  if (kind === "escrow" || kind === "payment") return prefs.escrow || prefs.orders;
  if (kind === "proposal") return prefs.proposals;
  if (kind === "order") return prefs.orders;
  if (kind === "review") return prefs.reviews;
  if (kind === "message") return prefs.marketplace;
  if (kind === "portfolio") return prefs.marketplace;
  return prefs.marketplace;
}

export function getNotifications(userId?: string): AppNotification[] {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return EMPTY_NOTIFICATIONS;
  if (!cache) cache = new Map(Object.entries(readAll()));
  const stored = cache.get(uid);
  if (stored) return stored;
  persist(uid, []);
  return EMPTY_NOTIFICATIONS;
}

function persist(uid: string, items: AppNotification[]) {
  if (!cache) cache = new Map(Object.entries(readAll()));
  cache.set(uid, items);
  const all = readAll();
  all[uid] = items;
  writeAll(all);
  notify();
}

export function addNotification(
  input: Omit<AppNotification, "id" | "time" | "read"> & { userId?: string },
): AppNotification | null {
  const uid = input.userId ?? getSession()?.user.id ?? "global";
  const priority = input.priority ?? "normal";
  const isCritical = priority === "high" || input.kind === "escrow" || input.kind === "payment";
  if (!isCritical && !kindAllowed(input.kind, uid)) return null;

  const items = getNotifications(uid);
  const entry: AppNotification = {
    ...input,
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: "Hozirgina",
    read: false,
    userId: uid,
  };
  persist(uid, [entry, ...items].slice(0, 100));

  tryBrowserPush(entry);

  const session = getSession();
  if (isCritical && session?.user.id === uid && session.user.email) {
    queueNotificationEmail(session.user.email, entry.title, entry.body);
  }

  return entry;
}

function tryBrowserPush(entry: AppNotification): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;
  try {
    new Notification(entry.title, { body: entry.body, tag: entry.id });
  } catch {
    /* unsupported */
  }
}

export function markNotificationRead(id: string, userId?: string): void {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return;
  const items = getNotifications(uid).map((n) => (n.id === id ? { ...n, read: true } : n));
  persist(uid, items);
}

export function markAllNotificationsRead(userId?: string): void {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return;
  persist(uid, getNotifications(uid).map((n) => ({ ...n, read: true })));
}

export function getUnreadCount(userId?: string): number {
  return getNotifications(userId).filter((n) => !n.read).length;
}

export function rehydrateFromStorage() {
  notify();
}

export function dismissNotification(id: string, userId?: string): void {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return;
  persist(uid, getNotifications(uid).filter((n) => n.id !== id));
}
