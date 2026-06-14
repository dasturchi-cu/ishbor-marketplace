import type { LanguageEntry, AvailabilitySettings } from "./auth-constants";
import { loadOnboardingState } from "./auth-constants";
import type { WorkspaceRole } from "./active-role-store";
import { toProfileUserType } from "./active-role-store";
import { getSession, updateSessionUser } from "./auth";
import { getPublishedPortfoliosByUsername } from "./portfolio-store";
import { getMyPublishedProjects } from "./projects-store";
import { publishPortfolio, createEmptyFormInput } from "./portfolio-store";

const SERVICES_STORAGE_KEY = "ishbor-user-services";

function countPublishedServices(userId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(SERVICES_STORAGE_KEY);
    if (!raw) return 0;
    const stored = JSON.parse(raw) as { ownerUserId?: string; status?: string }[];
    return stored.filter((s) => s.ownerUserId === userId && s.status === "published").length;
  } catch {
    return 0;
  }
}

const STORAGE_KEY = "ishbor-user-profiles";
const listeners = new Set<() => void>();
let cache: Map<string, UserProfile> | null = null;

export type UserProfile = {
  userId: string;
  username?: string;
  title?: string;
  skills: string[];
  categories: string[];
  languages: LanguageEntry[];
  availability: AvailabilitySettings;
  rate?: number;
  company?: string;
  industry?: string;
  teamSize?: string;
  hiringGoals: string[];
  onboardingComplete: boolean;
  updatedAt: string;
};

const defaultAvailability: AvailabilitySettings = {
  available: true,
  hoursPerWeek: "",
  timezone: "Asia/Tashkent (UTC+5)",
  responseTime: "",
};

function notify() {
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribeProfiles(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Record<string, UserProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, UserProfile>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, UserProfile>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getUserProfile(userId: string): UserProfile | null {
  if (!cache) cache = new Map(Object.entries(readAll()));
  return cache.get(userId) ?? null;
}

export function saveUserProfile(userId: string, patch: Partial<UserProfile>): UserProfile {
  const existing = getUserProfile(userId);
  const next: UserProfile = {
    userId,
    username: patch.username ?? existing?.username,
    title: patch.title ?? existing?.title,
    skills: patch.skills ?? existing?.skills ?? [],
    categories: patch.categories ?? existing?.categories ?? [],
    languages: patch.languages ?? existing?.languages ?? [],
    availability: { ...defaultAvailability, ...existing?.availability, ...patch.availability },
    rate: patch.rate ?? existing?.rate,
    company: patch.company ?? existing?.company,
    industry: patch.industry ?? existing?.industry,
    teamSize: patch.teamSize ?? existing?.teamSize,
    hiringGoals: patch.hiringGoals ?? existing?.hiringGoals ?? [],
    onboardingComplete: patch.onboardingComplete ?? existing?.onboardingComplete ?? false,
    updatedAt: new Date().toISOString(),
  };
  if (!cache) cache = new Map();
  cache.set(userId, next);
  writeAll(Object.fromEntries(cache));
  notify();
  return next;
}

/** Sync onboarding sessionStorage → persistent profile + auth session. */
export function persistOnboardingToProfile(userId: string): UserProfile {
  const onboarding = loadOnboardingState();
  const session = getSession();
  const profile = saveUserProfile(userId, {
    username: session?.user.username,
    title: onboarding.fullName ? `${onboarding.skills[0] ?? "Frilanser"} mutaxassisi` : undefined,
    skills: onboarding.skills,
    categories: onboarding.categories,
    languages: onboarding.languages,
    availability: onboarding.availability,
    company: onboarding.company,
    industry: onboarding.industry,
    teamSize: onboarding.teamSize,
    hiringGoals: onboarding.hiringGoals,
    onboardingComplete: true,
  });
  if (session?.user.id === userId) {
    updateSessionUser({
      bio: session.user.bio || (onboarding.skills.length ? onboarding.skills.slice(0, 3).join(", ") + " mutaxassisi" : undefined),
      company: onboarding.company || session.user.company,
      location: session.user.location ?? "Tashkent, Uzbekistan",
    });
  }
  return profile;
}

const DEMO_PROFILE_SEEDS: Record<string, Partial<UserProfile>> = {
  "u-client-1": {
    company: "Asaka Capital",
    industry: "Fintex",
    teamSize: "51–200",
    hiringGoals: ["design", "engineering", "one-off"],
    categories: ["Branding", "Development", "Design"],
  },
  "u-freelancer-1": {
    username: "nargiza",
    title: "Brend strategi va UI dizayner",
    skills: ["Figma", "Brendlash", "UI/UX dizayn", "Next.js"],
    categories: ["Branding", "Design", "UI/UX dizayn"],
    languages: [{ language: "O'zbek", level: "Ona tili" }, { language: "Ingliz", level: "Professional" }],
    availability: { available: true, hoursPerWeek: "30–40 soat", timezone: "Asia/Tashkent (UTC+5)", responseTime: "< 1 soat" },
  },
  "u-admin-1": {
    company: "Ishbor Platform",
    industry: "SaaS",
    teamSize: "11–50",
    hiringGoals: ["engineering", "agency"],
    categories: ["Development", "Strategy"],
  },
};

/** Ensure known demo accounts have interest data when onboarding session is empty. */
export function seedDemoProfileIfNeeded(userId: string): UserProfile | null {
  const seed = DEMO_PROFILE_SEEDS[userId];
  if (!seed) return null;
  const existing = getUserProfile(userId);
  const hasInterestData =
    (existing?.skills.length ?? 0) > 0 ||
    (existing?.hiringGoals.length ?? 0) > 0 ||
    (existing?.categories.length ?? 0) > 0;
  if (hasInterestData) return existing;
  return saveUserProfile(userId, { ...seed, onboardingComplete: true });
}

/** Create draft portfolios from onboarding sessionStorage items. */
export function persistOnboardingPortfolios(userId: string): number {
  const onboarding = loadOnboardingState();
  const session = getSession();
  if (!session || onboarding.userType !== "freelancer" || onboarding.portfolio.length === 0) return 0;

  const username = session.user.username ?? `user-${userId.slice(-6)}`;
  const existing = getPublishedPortfoliosByUsername(username);
  const existingTitles = new Set(existing.map((p) => p.title.toLowerCase()));
  let created = 0;

  for (const [i, item] of onboarding.portfolio.entries()) {
    if (!item.title.trim() || existingTitles.has(item.title.toLowerCase())) continue;
    const input = createEmptyFormInput(250 + i * 20);
    input.title = item.title.trim();
    input.category = item.category.trim() || input.category;
    input.description = `${item.title} — onboarding orqali yaratilgan portfolio namunasi.`;
    input.objectives = "Mijoz ehtiyojlarini qondirish va natijani ko'rsatish.";
    publishPortfolio(input, {
      ownerUserId: userId,
      freelancerUsername: username,
      freelancerName: session.user.fullName,
      freelancerHue: session.user.avatarHue,
    });
    created++;
  }
  return created;
}

export type ProfileCompletionItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  weight: number;
};

export function getProfileCompletionItems(userId: string, role: WorkspaceRole): ProfileCompletionItem[] {
  const userType = toProfileUserType(role);
  const session = getSession();
  const user = session?.user;
  const profile = getUserProfile(userId);

  if (userType === "client") {
    const projects = getMyPublishedProjects(userId);
    return [
      { id: "name", label: "To'liq ism", done: !!user?.fullName, href: "/settings", weight: 15 },
      { id: "company", label: "Kompaniya nomi", done: !!(user?.company || profile?.company), href: "/settings", weight: 20 },
      { id: "bio", label: "Kompaniya tavsifi", done: !!user?.bio, href: "/settings", weight: 15 },
      { id: "verified", label: "Shaxsni tasdiqlash", done: !!user?.verified, href: "/settings", weight: 25 },
      { id: "location", label: "Joylashuv", done: !!user?.location, href: "/settings", weight: 15 },
      { id: "project", label: "Birinchi loyiha joylash", done: projects.length >= 1, href: "/projects/create", weight: 10 },
    ];
  }

  const username = user?.username ?? profile?.username;
  const portfolios = username ? getPublishedPortfoliosByUsername(username) : [];
  const servicesCount = countPublishedServices(userId);

  return [
    { id: "name", label: "To'liq ism", done: !!user?.fullName, href: "/settings", weight: 10 },
    { id: "bio", label: "Professional tavsif", done: !!user?.bio, href: "/settings", weight: 10 },
    { id: "skills", label: "Kamida 3 ta ko'nikma", done: (profile?.skills.length ?? 0) >= 3, href: "/onboarding/skills", weight: 15 },
    { id: "location", label: "Joylashuv", done: !!user?.location, href: "/settings", weight: 10 },
    { id: "portfolio", label: "Portfolio e'lon qilish", done: portfolios.length >= 1, href: "/portfolio/create", weight: 20 },
    { id: "service", label: "Xizmat yaratish", done: servicesCount >= 1, href: "/services/create", weight: 15 },
    { id: "languages", label: "Tillar qo'shish", done: (profile?.languages.length ?? 0) >= 1, href: "/onboarding/languages", weight: 10 },
    { id: "availability", label: "Mavjudlik belgilash", done: !!profile?.availability.hoursPerWeek, href: "/dashboard/freelancer", weight: 10 },
  ];
}

export function computeProfileCompletionPercent(userId: string, role: WorkspaceRole): number {
  const items = getProfileCompletionItems(userId, role);
  const total = items.reduce((s, i) => s + i.weight, 0);
  const done = items.filter((i) => i.done).reduce((s, i) => s + i.weight, 0);
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export function updateAvailability(
  userId: string,
  patch: Partial<AvailabilitySettings & { status?: "available" | "busy" | "away" }>,
): UserProfile {
  const profile = getUserProfile(userId);
  const available = patch.status
    ? patch.status === "available"
    : patch.available ?? profile?.availability.available ?? true;
  return saveUserProfile(userId, {
    availability: {
      ...defaultAvailability,
      ...profile?.availability,
      ...patch,
      available,
    },
  });
}

export function getAvailabilityStatus(userId: string): "available" | "busy" | "away" {
  const profile = getUserProfile(userId);
  if (!profile?.availability.available) return "away";
  if (profile.availability.hoursPerWeek === "40+ soat") return "busy";
  return "available";
}
