import type { AuthUser } from "./auth";
import { getSession } from "./auth";
import type { UserProfile } from "./profile-store";
import { getProfileByUsername, getUserProfile, getAllProfiles, subscribeProfiles } from "./profile-store";
import {
  enrichFreelancer,
  freelancers,
  type EnrichedFreelancer,
  type Freelancer,
} from "./mock-data";

const mockFreelancerCache = new Map<string, EnrichedFreelancer>();
let dynamicFreelancerCacheVersion = 0;
const dynamicFreelancerCache = new Map<string, { version: number; value: EnrichedFreelancer | null }>();

function usernameToDisplayName(username: string): string {
  return username
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildFreelancerFromProfile(
  username: string,
  profile: UserProfile,
  user?: AuthUser | null,
): EnrichedFreelancer {
  const template = enrichFreelancer(freelancers[0]!);
  const skills = profile.skills.length > 0 ? profile.skills : template.skills.slice(0, 3);
  const base: Freelancer = {
    ...template,
    id: profile.userId,
    username,
    name: user?.fullName ?? usernameToDisplayName(username),
    title: profile.title ?? "Frilanser",
    city: user?.location ?? "Toshkent",
    rate: profile.rate ?? 25,
    rating: 0,
    reviews: 0,
    level: "Rising",
    skills,
    bio: user?.bio ?? (skills.length ? `${skills.slice(0, 3).join(", ")} bo'yicha mutaxassis.` : template.bio),
    available: profile.availability.available,
    hue: user?.avatarHue ?? 250,
    earned: 0,
    jobs: 0,
    memberSince: new Date().getFullYear().toString(),
    successScore: 0,
    completionRate: 0,
    onTimeDelivery: 0,
    responseTime: profile.availability.responseTime || "< 24 soat",
    repeatClients: 0,
    identityVerified: user?.verified ?? false,
    businessVerified: false,
    languages: profile.languages.length > 0 ? profile.languages : template.languages,
    portfolio: [],
    caseStudies: [],
  };
  return enrichFreelancer(base);
}

export function findMockFreelancerByUsername(username: string): EnrichedFreelancer | null {
  const cached = mockFreelancerCache.get(username);
  if (cached) return cached;
  const raw = freelancers.find((x) => x.username === username);
  if (!raw) return null;
  const enriched = enrichFreelancer(raw);
  mockFreelancerCache.set(username, enriched);
  return enriched;
}

function buildFreelancerFromSession(username: string, user: AuthUser): EnrichedFreelancer {
  const template = enrichFreelancer(freelancers[0]!);
  const base: Freelancer = {
    ...template,
    id: user.id,
    username,
    name: user.fullName,
    title: "Frilanser",
    city: user.location ?? "Toshkent",
    rate: 25,
    rating: 0,
    reviews: 0,
    level: "Rising",
    skills: template.skills.slice(0, 3),
    bio: user.bio ?? "Ishbor frilanseri.",
    available: true,
    hue: user.avatarHue,
    earned: 0,
    jobs: 0,
    memberSince: new Date().getFullYear().toString(),
    successScore: 0,
    completionRate: 0,
    onTimeDelivery: 0,
    responseTime: "< 24 soat",
    repeatClients: 0,
    identityVerified: user.verified,
    businessVerified: false,
    portfolio: [],
    caseStudies: [],
  };
  return enrichFreelancer(base);
}

/** Client-side: mock catalog yoki ro'yxatdan o'tgan foydalanuvchi profili. */
export function resolveFreelancerByUsername(username: string): EnrichedFreelancer | null {
  const mock = findMockFreelancerByUsername(username);
  if (mock) return mock;

  const cached = dynamicFreelancerCache.get(username);
  if (cached && cached.version === dynamicFreelancerCacheVersion) {
    return cached.value;
  }

  if (typeof window === "undefined") {
    dynamicFreelancerCache.set(username, { version: dynamicFreelancerCacheVersion, value: null });
    return null;
  }

  const session = getSession();
  const sessionUser = session?.user.username === username ? session.user : null;

  const profile = getProfileByUsername(username);
  let resolved: EnrichedFreelancer | null = null;
  if (profile) {
    resolved = buildFreelancerFromProfile(username, profile, sessionUser);
  } else if (sessionUser) {
    resolved = buildFreelancerFromSession(username, sessionUser);
  }

  dynamicFreelancerCache.set(username, { version: dynamicFreelancerCacheVersion, value: resolved });
  return resolved;
}

export function resolveFreelancerForUser(user: AuthUser): EnrichedFreelancer {
  if (user.username) {
    const resolved = resolveFreelancerByUsername(user.username);
    if (resolved) return resolved;
  }
  const username =
    user.username ?? user.fullName.toLowerCase().replace(/\s+/g, "-").slice(0, 20);
  const profile = getUserProfile(user.id);
  if (profile) {
    return buildFreelancerFromProfile(username, profile, user);
  }
  const fallback = enrichFreelancer(freelancers[0]!);
  return {
    ...fallback,
    id: user.id,
    name: user.fullName,
    hue: user.avatarHue,
    username,
    bio: user.bio ?? fallback.bio,
  };
}

export function subscribeFreelancerProfile(username: string, onChange: () => void): () => void {
  return subscribeProfiles(() => {
    dynamicFreelancerCacheVersion += 1;
    dynamicFreelancerCache.delete(username);
    onChange();
  });
}

/** Mock katalog + ro'yxatdan o'tgan frilanserlar — qidiruv va ro'yxat uchun. */
export function getAllDiscoverableFreelancers(): EnrichedFreelancer[] {
  const seen = new Set<string>();
  const list: EnrichedFreelancer[] = [];

  for (const raw of freelancers) {
    const enriched = findMockFreelancerByUsername(raw.username);
    if (enriched) {
      list.push(enriched);
      seen.add(raw.username);
    }
  }

  if (typeof window === "undefined") return list;

  for (const profile of getAllProfiles()) {
    const uname = profile.username?.trim();
    if (!uname || seen.has(uname)) continue;
    if (!profile.onboardingComplete && profile.skills.length < 2) continue;
    const resolved = resolveFreelancerByUsername(uname);
    if (resolved) {
      list.push(resolved);
      seen.add(uname);
    }
  }

  return list;
}

export function subscribeDiscoverableFreelancers(listener: () => void): () => void {
  return subscribeProfiles(listener);
}
