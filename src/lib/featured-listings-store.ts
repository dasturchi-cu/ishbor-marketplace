import { getSession } from "./auth";

const STORAGE_KEY = "ishbor-featured-listings";
const listeners = new Set<() => void>();

export type FeaturedListingType = "service" | "project" | "profile" | "portfolio";

export type FeaturedListing = {
  id: string;
  type: FeaturedListingType;
  slug: string;
  title: string;
  userId: string;
  creditsSpent: number;
  startDate: string;
  endDate: string;
  active: boolean;
};

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeFeaturedListings(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): FeaturedListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FeaturedListing[]) : [];
  } catch {
    return [];
  }
}

function writeAll(listings: FeaturedListing[]) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const updated = listings.map((l) => ({
    ...l,
    active: new Date(l.endDate).getTime() > now,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 500)));
  notify();
}

export function recordFeaturedListing(input: Omit<FeaturedListing, "id" | "active">): FeaturedListing {
  const listing: FeaturedListing = {
    ...input,
    id: `fl-${Date.now()}`,
    active: new Date(input.endDate).getTime() > Date.now(),
  };
  writeAll([listing, ...readAll()]);
  return listing;
}

export function getFeaturedListings(userId?: string): FeaturedListing[] {
  const uid = userId ?? getSession()?.user.id;
  const all = readAll();
  const now = Date.now();
  return all.filter((l) => {
    const active = new Date(l.endDate).getTime() > now;
    if (!uid) return active;
    return l.userId === uid || active;
  });
}

export function getActiveFeaturedListings(type?: FeaturedListingType): FeaturedListing[] {
  const now = Date.now();
  return readAll().filter(
    (l) => new Date(l.endDate).getTime() > now && (!type || l.type === type),
  );
}

export function isListingFeatured(type: FeaturedListingType, slug: string): boolean {
  const now = Date.now();
  return readAll().some(
    (l) => l.type === type && l.slug === slug && new Date(l.endDate).getTime() > now,
  );
}

export function getFeaturedPerformance(userId: string, days = 30) {
  const listings = getFeaturedListings(userId).filter((l) => l.userId === userId);
  const cutoff = Date.now() - days * 86400000;
  const recent = listings.filter((l) => new Date(l.startDate).getTime() >= cutoff);
  return {
    totalListings: listings.length,
    activeListings: listings.filter((l) => l.active).length,
    creditsSpent: listings.reduce((s, l) => s + l.creditsSpent, 0),
    recentCount: recent.length,
  };
}
