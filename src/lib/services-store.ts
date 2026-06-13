import type { Service, ServicePackage, ServiceFaq } from "./mock-data";
import { services as mockServices } from "./mock-data";
import { notifyNewListing } from "./alerts-store";
import { completeReferral } from "./referral-store";
import { getSession } from "./auth";
import { canCreateService, getPlan } from "./subscription-store";

const STORAGE_KEY = "ishbor-user-services";
const listeners = new Set<() => void>();
let cachedServices: StoredService[] | null = null;
let cachedPublished: StoredService[] | null = null;
let cachedPublishedSource: StoredService[] | null = null;
let cachedStored: StoredService[] | null = null;
let cachedMyServices: Map<string, StoredService[]> | null = null;

const SSR_ALL_SERVICES: StoredService[] = mockServices;
const SSR_PUBLISHED_SERVICES = SSR_ALL_SERVICES.filter(
  (s) => !s.status || s.status === "published",
);

export type ServiceStatus = "draft" | "published" | "paused" | "archived";

export type StoredService = Service & {
  status?: ServiceStatus;
  ownerUserId?: string;
  createdAt?: string;
  featured?: boolean;
  featuredUntil?: string;
};

const listeners2 = listeners;

function invalidateCache() {
  cachedServices = null;
  cachedPublished = null;
  cachedPublishedSource = null;
  cachedStored = null;
  cachedMyServices = null;
}

function getStoredSnapshot(): StoredService[] {
  if (cachedStored === null) {
    cachedStored = readStored();
  }
  return cachedStored;
}

function notify() {
  invalidateCache();
  listeners.forEach((l) => l());
}

export function subscribeServices(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStored(): StoredService[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredService[]) : [];
  } catch {
    return [];
  }
}

function writeStored(services: StoredService[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04FF]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || `service-${Date.now()}`;
}

function uniqueSlug(title: string, existing: StoredService[]): string {
  let slug = slugify(title);
  const slugs = new Set(existing.map((s) => s.slug));
  let i = 1;
  while (slugs.has(slug)) {
    slug = `${slugify(title)}-${i++}`;
  }
  return slug;
}

export function getStoredServices(): StoredService[] {
  return readStored();
}

export function getAllServices(): StoredService[] {
  if (typeof window === "undefined") {
    return SSR_ALL_SERVICES;
  }
  if (!cachedServices) {
    const stored = readStored();
    const storedSlugs = new Set(stored.map((s) => s.slug));
    cachedServices = [...stored, ...mockServices.filter((s) => !storedSlugs.has(s.slug))];
  }
  return cachedServices;
}

export function getPublishedServices(): StoredService[] {
  if (typeof window === "undefined") {
    return SSR_PUBLISHED_SERVICES;
  }
  const all = getAllServices();
  if (cachedPublished && cachedPublishedSource === all) {
    return cachedPublished;
  }
  cachedPublished = all.filter((s) => !s.status || s.status === "published");
  cachedPublishedSource = all;
  return cachedPublished;
}

export function rehydrateFromStorage() {
  notify();
}

export function getServiceBySlug(slug: string): StoredService | undefined {
  return getAllServices().find((s) => s.slug === slug);
}

export function getMyServices(ownerUserId: string): StoredService[] {
  if (cachedMyServices?.has(ownerUserId)) {
    return cachedMyServices.get(ownerUserId)!;
  }
  if (!cachedMyServices) {
    cachedMyServices = new Map();
  }
  const filtered = getStoredSnapshot().filter((s) => s.ownerUserId === ownerUserId);
  cachedMyServices.set(ownerUserId, filtered);
  return filtered;
}

export function getMyPublishedServices(ownerUserId: string): StoredService[] {
  const key = `${ownerUserId}:published`;
  if (cachedMyServices?.has(key)) {
    return cachedMyServices.get(key)!;
  }
  if (!cachedMyServices) {
    cachedMyServices = new Map();
  }
  const filtered = getMyServices(ownerUserId).filter((s) => s.status === "published");
  cachedMyServices.set(key, filtered);
  return filtered;
}

export type ServiceFormInput = {
  title: string;
  category: string;
  description: string;
  descriptionExtended?: string;
  price: number;
  delivery: string;
  included?: string[];
  packages?: ServicePackage[];
  faqs?: ServiceFaq[];
};

export type CreateServiceContext = {
  ownerUserId: string;
  seller: string;
  sellerUsername: string;
  sellerHue: number;
  sellerIdentityVerified: boolean;
};

function buildService(
  input: ServiceFormInput,
  ctx: CreateServiceContext,
  status: ServiceStatus,
  existing?: StoredService,
): StoredService {
  const all = getAllServices();
  const slug = existing?.slug ?? uniqueSlug(input.title, all);
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    slug,
    title: input.title.trim(),
    seller: ctx.seller,
    sellerHue: ctx.sellerHue,
    sellerUsername: ctx.sellerUsername,
    sellerLevel: "Verified",
    sellerSuccessScore: 0,
    sellerCompletionRate: 0,
    sellerOnTime: 0,
    sellerResponseTime: "—",
    sellerIdentityVerified: ctx.sellerIdentityVerified,
    sellerRepeatClients: 0,
    sellerTotalEarned: 0,
    category: input.category,
    price: input.price,
    rating: existing?.rating ?? 0,
    reviews: existing?.reviews ?? 0,
    delivery: input.delivery,
    hue: ctx.sellerHue,
    inProgress: existing?.inProgress ?? 0,
    queuePosition: existing?.queuePosition ?? 0,
    description: input.description.trim(),
    descriptionExtended: input.descriptionExtended,
    included: input.included,
    packages: input.packages ?? [
      {
        tier: "Essential",
        price: input.price,
        delivery: input.delivery,
        revisions: 2,
        features: input.included ?? [],
        description: input.description.trim(),
      },
    ],
    faqs: input.faqs,
    status,
    ownerUserId: ctx.ownerUserId,
    createdAt: existing?.createdAt ?? now,
    featured: existing?.featured ?? false,
    featuredUntil: existing?.featuredUntil,
  };
}

export function saveServiceDraft(
  input: ServiceFormInput,
  ctx: CreateServiceContext,
  existingSlug?: string,
): StoredService {
  const stored = readStored();
  const existing = existingSlug ? stored.find((s) => s.slug === existingSlug) : undefined;
  const service = buildService(input, ctx, "draft", existing);
  const next = existing
    ? stored.map((s) => (s.slug === existingSlug ? service : s))
    : [service, ...stored];
  writeStored(next);
  notify();
  return service;
}

export function publishService(
  input: ServiceFormInput,
  ctx: CreateServiceContext,
  existingSlug?: string,
): StoredService | { error: string } {
  const stored = readStored();
  const existing = existingSlug ? stored.find((s) => s.slug === existingSlug) : undefined;
  const session = getSession();
  if (session && !existing) {
    const publishedCount = stored.filter(
      (s) => s.ownerUserId === session.user.id && s.status === "published",
    ).length;
    if (!canCreateService(session.user.id, publishedCount)) {
      const max = getPlan(session.user.id).maxServices ?? 0;
      return {
        error: `Xizmat limiti tugadi (${publishedCount}/${max}). Pro yoki Elite rejaga o'ting.`,
      };
    }
  }
  const service = buildService(input, ctx, "published", existing);
  const next = existing
    ? stored.map((s) => (s.slug === existingSlug ? service : s))
    : [service, ...stored];
  writeStored(next);
  notify();
  notifyNewListing({
    title: service.title,
    slug: service.slug,
    category: service.category,
    skills: [service.category],
    href: `/services/${service.slug}`,
    type: "service",
  });
  if (session) completeReferral(session.user.id);
  return service;
}

export function deleteService(slug: string): boolean {
  const stored = readStored();
  const next = stored.filter((s) => s.slug !== slug);
  if (next.length === stored.length) return false;
  writeStored(next);
  notify();
  return true;
}

export function setServiceFeatured(slug: string, featured: boolean, days = 7): StoredService | undefined {
  const stored = readStored();
  const idx = stored.findIndex((s) => s.slug === slug);
  if (idx === -1) return undefined;
  const until = featured ? new Date(Date.now() + days * 86400000).toISOString() : undefined;
  const updated = { ...stored[idx]!, featured, featuredUntil: until };
  const next = [...stored];
  next[idx] = updated;
  writeStored(next);
  notify();
  return updated;
}

export function isServiceOwner(slug: string, userId: string): boolean {
  return readStored().some((s) => s.slug === slug && s.ownerUserId === userId);
}

export function updateServiceStatus(slug: string, status: ServiceStatus): StoredService | undefined {
  const stored = readStored();
  const idx = stored.findIndex((s) => s.slug === slug);
  if (idx === -1) return undefined;
  const updated = { ...stored[idx]!, status };
  const next = [...stored];
  next[idx] = updated;
  writeStored(next);
  notify();
  return updated;
}

export function duplicateService(slug: string): StoredService | undefined {
  const stored = readStored();
  const original = stored.find((s) => s.slug === slug);
  if (!original) return undefined;
  const copy: StoredService = {
    ...original,
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    slug: uniqueSlug(`${original.title} nusxa`, getAllServices()),
    title: `${original.title} (nusxa)`,
    status: "draft",
    featured: false,
    featuredUntil: undefined,
    createdAt: new Date().toISOString(),
  };
  writeStored([copy, ...stored]);
  notify();
  return copy;
}
