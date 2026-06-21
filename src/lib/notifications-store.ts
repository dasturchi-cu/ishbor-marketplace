import { notifications as seedNotifications } from "./mock-data";
import { getSession } from "./auth";
import { persistRead, persistWrite } from "./store-persist";

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

function seedForUser(userId: string): AppNotification[] {
  return seedNotifications.map((n) => ({ ...n, userId }));
}

const GUEST_NOTIFICATIONS: AppNotification[] = seedNotifications.map((n) => ({ ...n }));
const EMPTY_NOTIFICATIONS: AppNotification[] = [];

export function getNotifications(userId?: string): AppNotification[] {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return EMPTY_NOTIFICATIONS;
  if (!cache) cache = new Map(Object.entries(readAll()));
  const stored = cache.get(uid);
  if (stored) return stored;
  const seeded = seedForUser(uid);
  persist(uid, seeded);
  return seeded;
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
): AppNotification {
  const uid = input.userId ?? getSession()?.user.id ?? "global";
  const items = getNotifications(uid);
  const entry: AppNotification = {
    ...input,
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: "Hozirgina",
    read: false,
    userId: uid,
  };
  persist(uid, [entry, ...items].slice(0, 100));
  return entry;
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
