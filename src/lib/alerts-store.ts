import { getSession } from "./auth";
import { addNotification } from "./notifications-store";
import { getUserProfile } from "./profile-store";

const STORAGE_KEY = "ishbor-alerts";
const listeners = new Set<() => void>();
let cache: Map<string, UserAlerts> | null = null;

export type JobAlertPrefs = {
  enabled: boolean;
  skills: string[];
  categories: string[];
  minBudget: number;
  maxBudget: number;
};

export type SavedSearchAlert = {
  id: string;
  label: string;
  type: "projects" | "services" | "freelancers";
  query: string;
  category?: string;
  filter?: string;
  enabled: boolean;
  createdAt: string;
  lastNotifiedAt?: string;
};

export type UserAlerts = {
  userId: string;
  jobAlerts: JobAlertPrefs;
  savedSearches: SavedSearchAlert[];
};

const defaultJobAlerts: JobAlertPrefs = {
  enabled: true,
  skills: [],
  categories: [],
  minBudget: 0,
  maxBudget: 999999,
};

function notify() {
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribeAlerts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Record<string, UserAlerts> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, UserAlerts>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, UserAlerts>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function readAllProfiles(): Record<string, import("./profile-store").UserProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("ishbor-user-profiles");
    return raw ? (JSON.parse(raw) as Record<string, import("./profile-store").UserProfile>) : {};
  } catch {
    return {};
  }
}

export function getUserAlerts(userId?: string): UserAlerts {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) {
    return { userId: "", jobAlerts: defaultJobAlerts, savedSearches: [] };
  }
  if (!cache) cache = new Map(Object.entries(readAll()));
  const existing = cache.get(uid);
  if (existing) return existing;

  const profile = getUserProfile(uid);
  const seeded: UserAlerts = {
    userId: uid,
    jobAlerts: {
      ...defaultJobAlerts,
      skills: profile?.skills ?? [],
      categories: profile?.categories ?? [],
    },
    savedSearches: [],
  };
  cache.set(uid, seeded);
  return seeded;
}

function persist(uid: string, alerts: UserAlerts) {
  if (!cache) cache = new Map();
  cache.set(uid, alerts);
  writeAll(Object.fromEntries(cache));
  notify();
}

export function updateJobAlertPrefs(userId: string, patch: Partial<JobAlertPrefs>): JobAlertPrefs {
  const alerts = getUserAlerts(userId);
  const next = { ...alerts.jobAlerts, ...patch };
  persist(userId, { ...alerts, jobAlerts: next });
  return next;
}

export function addSavedSearchAlert(
  userId: string,
  input: Omit<SavedSearchAlert, "id" | "createdAt" | "enabled">,
): SavedSearchAlert {
  const alerts = getUserAlerts(userId);
  const entry: SavedSearchAlert = {
    ...input,
    id: `ss-${Date.now()}`,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  persist(userId, { ...alerts, savedSearches: [entry, ...alerts.savedSearches] });
  return entry;
}

export function removeSavedSearchAlert(userId: string, id: string): void {
  const alerts = getUserAlerts(userId);
  persist(userId, { ...alerts, savedSearches: alerts.savedSearches.filter((s) => s.id !== id) });
}

export function toggleSavedSearchAlert(userId: string, id: string, enabled: boolean): void {
  const alerts = getUserAlerts(userId);
  persist(userId, {
    ...alerts,
    savedSearches: alerts.savedSearches.map((s) => (s.id === id ? { ...s, enabled } : s)),
  });
}

export type NewListingPayload = {
  title: string;
  slug: string;
  category: string;
  skills: string[];
  budget?: number;
  href: string;
  type: "project" | "service";
};

/** Match freelancers by skills/categories when new project/service published. */
export function checkJobAlertsForProject(payload: NewListingPayload): number {
  const profiles = readAllProfiles();
  let notified = 0;

  for (const [userId, profile] of Object.entries(profiles)) {
    const alerts = getUserAlerts(userId);
    if (!alerts.jobAlerts.enabled) continue;

    const skillMatch = payload.skills.some((s) =>
      profile.skills.some((ps) => ps.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ps.toLowerCase())),
    );
    const categoryMatch =
      alerts.jobAlerts.categories.length === 0 ||
      alerts.jobAlerts.categories.some((c) => payload.category.toLowerCase().includes(c.toLowerCase())) ||
      profile.categories.some((c) => payload.category.toLowerCase().includes(c.toLowerCase()));

    const budgetOk =
      payload.budget === undefined ||
      (payload.budget >= alerts.jobAlerts.minBudget && payload.budget <= alerts.jobAlerts.maxBudget);

    if ((skillMatch || categoryMatch) && budgetOk) {
      addNotification({
        userId,
        kind: "proposal",
        title: payload.type === "project" ? "Yangi mos loyiha" : "Yangi mos xizmat",
        body: `"${payload.title}" — ko'nikmalaringizga mos.`,
        priority: "high",
        href: payload.href,
      });
      notified++;
    }
  }

  return notified;
}

/** Check saved search alerts against new listing. */
export function checkSavedSearchAlerts(payload: NewListingPayload): number {
  const allAlerts = readAll();
  let notified = 0;

  for (const [userId, userAlerts] of Object.entries(allAlerts)) {
    for (const search of userAlerts.savedSearches) {
      if (!search.enabled) continue;
      const typeMatch =
        (search.type === "projects" && payload.type === "project") ||
        (search.type === "services" && payload.type === "service");
      if (!typeMatch) continue;

      const qMatch =
        !search.query ||
        payload.title.toLowerCase().includes(search.query.toLowerCase()) ||
        payload.category.toLowerCase().includes(search.query.toLowerCase());
      const catMatch = !search.category || payload.category.toLowerCase().includes(search.category.toLowerCase());

      if (qMatch && catMatch) {
        addNotification({
          userId,
          kind: "system",
          title: "Saqlangan qidiruv: yangi natija",
          body: `"${payload.title}" qidiruvingizga mos keldi.`,
          priority: "normal",
          href: payload.href,
        });
        notified++;
      }
    }
  }

  return notified;
}

export function notifyNewListing(payload: NewListingPayload): void {
  checkJobAlertsForProject(payload);
  checkSavedSearchAlerts(payload);
}
