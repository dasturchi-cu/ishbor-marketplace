import { getSession } from "./auth";
import { saveUserProfile, getUserProfile } from "./profile-store";

const STORAGE_KEY = "ishbor-settings";
const listeners = new Set<() => void>();
let cache: Map<string, UserSettings> | null = null;

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export type SocialLinks = {
  website?: string;
  portfolioUrl?: string;
  github?: string;
  linkedin?: string;
  telegram?: string;
};

export type AccountFormData = {
  fullName: string;
  bio: string;
  username: string;
  headline: string;
  location: string;
  timezone: string;
  social: SocialLinks;
};

export type NotificationPrefs = {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketplace: boolean;
  proposals: boolean;
  orders: boolean;
  escrow: boolean;
  reviews: boolean;
  marketing: boolean;
};

export type AppearancePrefs = {
  theme: "light" | "dark" | "system";
  fontSize: "sm" | "md" | "lg";
  compactMode: boolean;
  animations: boolean;
};

export type LanguagePrefs = {
  default: string;
  marketplace: string;
  notifications: string;
  dateFormat: string;
  currencyFormat: string;
};

export type UserSettings = {
  userId: string;
  autoSave: boolean;
  notifications: NotificationPrefs;
  appearance: AppearancePrefs;
  language: LanguagePrefs;
  social: SocialLinks;
  headline: string;
  coverHue: number;
  updatedAt: string;
};

const defaultNotifications: NotificationPrefs = {
  email: true,
  push: true,
  sms: false,
  marketplace: true,
  proposals: true,
  orders: true,
  escrow: true,
  reviews: true,
  marketing: false,
};

const defaultAppearance: AppearancePrefs = {
  theme: "dark",
  fontSize: "md",
  compactMode: false,
  animations: true,
};

const defaultLanguage: LanguagePrefs = {
  default: "O'zbek",
  marketplace: "O'zbek",
  notifications: "O'zbek",
  dateFormat: "DD.MM.YYYY",
  currencyFormat: "UZS",
};

function notify() {
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribeSettings(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Record<string, UserSettings> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, UserSettings>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, UserSettings>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getUserSettings(userId?: string): UserSettings {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) {
    return {
      userId: "",
      autoSave: false,
      notifications: defaultNotifications,
      appearance: defaultAppearance,
      language: defaultLanguage,
      social: {},
      headline: "",
      coverHue: 250,
      updatedAt: new Date().toISOString(),
    };
  }
  if (!cache) cache = new Map(Object.entries(readAll()));
  const existing = cache.get(uid);
  if (existing) return existing;

  const session = getSession();
  const profile = getUserProfile(uid);
  const settings: UserSettings = {
    userId: uid,
    autoSave: false,
    notifications: defaultNotifications,
    appearance: defaultAppearance,
    language: defaultLanguage,
    social: {},
    headline: profile?.title ?? "",
    coverHue: session?.user.avatarHue ?? 250,
    updatedAt: new Date().toISOString(),
  };
  cache.set(uid, settings);
  const all = readAll();
  all[uid] = settings;
  writeAll(all);
  return settings;
}

function persist(settings: UserSettings) {
  if (!cache) cache = new Map();
  cache.set(settings.userId, settings);
  const all = readAll();
  all[settings.userId] = settings;
  writeAll(all);
  notify();
}

export function updateUserSettings(userId: string, patch: Partial<UserSettings>): UserSettings {
  const current = getUserSettings(userId);
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  persist(next);
  return next;
}

export function updateNotificationPrefs(userId: string, patch: Partial<NotificationPrefs>): NotificationPrefs {
  const settings = getUserSettings(userId);
  const notifications = { ...settings.notifications, ...patch };
  persist({ ...settings, notifications });
  return notifications;
}

export function updateAppearancePrefs(userId: string, patch: Partial<AppearancePrefs>): AppearancePrefs {
  const settings = getUserSettings(userId);
  const appearance = { ...settings.appearance, ...patch };
  persist({ ...settings, appearance });
  return appearance;
}

export function updateLanguagePrefs(userId: string, patch: Partial<LanguagePrefs>): LanguagePrefs {
  const settings = getUserSettings(userId);
  const language = { ...settings.language, ...patch };
  persist({ ...settings, language });
  return language;
}

export function setAutoSave(userId: string, enabled: boolean): void {
  updateUserSettings(userId, { autoSave: enabled });
}

export function buildAccountFormFromSession(userId: string): AccountFormData {
  const session = getSession();
  const user = session?.user;
  const settings = getUserSettings(userId);
  const profile = getUserProfile(userId);
  return {
    fullName: user?.fullName ?? "",
    bio: user?.bio ?? "",
    username: user?.username ?? profile?.username ?? "",
    headline: settings.headline || profile?.title || "",
    location: user?.location ?? "",
    timezone: profile?.availability.timezone ?? "Asia/Tashkent (UTC+5)",
    social: { ...settings.social },
  };
}

export function saveAccountForm(userId: string, form: AccountFormData): void {
  const settings = getUserSettings(userId);
  persist({
    ...settings,
    headline: form.headline,
    social: form.social,
    updatedAt: new Date().toISOString(),
  });
  saveUserProfile(userId, {
    username: form.username,
    title: form.headline,
    availability: {
      available: true,
      hoursPerWeek: getUserProfile(userId)?.availability.hoursPerWeek ?? "",
      timezone: form.timezone,
      responseTime: getUserProfile(userId)?.availability.responseTime ?? "",
    },
  });
}

export function accountFormsEqual(a: AccountFormData, b: AccountFormData): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const TIMEZONE_OPTIONS = [
  "Asia/Tashkent (UTC+5)",
  "Asia/Samarkand (UTC+5)",
  "Europe/Moscow (UTC+3)",
  "Asia/Dubai (UTC+4)",
  "Europe/London (UTC+0)",
  "America/New_York (UTC-5)",
];
