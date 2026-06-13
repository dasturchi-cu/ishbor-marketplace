import { mockPortfolioItems } from "./portfolio-mock-data";
import type {
  PortfolioStatus,
  PortfolioAdminStatus,
  CaseStudy,
  PortfolioItem,
  PortfolioFormInput,
  CreatePortfolioContext,
  PortfolioSearchParams,
} from "./portfolio-types";
import { notifyPortfolioApproved } from "./notification-events";

export type {
  PortfolioStatus,
  PortfolioAdminStatus,
  CaseStudy,
  PortfolioMetric,
  PortfolioLinks,
  PortfolioItem,
  PortfolioFormInput,
  CreatePortfolioContext,
  PortfolioSearchParams,
} from "./portfolio-types";

const STORAGE_KEY = "ishbor-user-portfolios";
const listeners = new Set<() => void>();
let cachedAll: PortfolioItem[] | null = null;
let cachedStored: PortfolioItem[] | null = null;
let cachedMyPortfolios: Map<string, PortfolioItem[]> | null = null;
let cachedByUsername: Map<string, PortfolioItem[]> | null = null;

function invalidateCache() {
  cachedAll = null;
  cachedStored = null;
  cachedMyPortfolios = null;
  cachedByUsername = null;
}

function notify() {
  invalidateCache();
  listeners.forEach((l) => l());
}

export function subscribePortfolios(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStored(): PortfolioItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PortfolioItem[]) : [];
  } catch {
    return [];
  }
}

function writeStored(items: PortfolioItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || `portfolio-${Date.now()}`;
}

function uniqueSlug(title: string, existing: PortfolioItem[]): string {
  let slug = slugify(title);
  const slugs = new Set(existing.map((p) => p.slug));
  let i = 1;
  while (slugs.has(slug)) {
    slug = `${slugify(title)}-${i++}`;
  }
  return slug;
}

export function getStoredPortfolios(): PortfolioItem[] {
  if (cachedStored === null) {
    cachedStored = readStored();
  }
  return cachedStored;
}

export function rehydrateFromStorage() {
  notify();
}

export function getAllPortfolios(): PortfolioItem[] {
  if (typeof window === "undefined") {
    const stored = readStored();
    const storedSlugs = new Set(stored.map((p) => p.slug));
    return [...stored, ...mockPortfolioItems.filter((p) => !storedSlugs.has(p.slug))];
  }
  if (!cachedAll) {
    const stored = readStored();
    const storedSlugs = new Set(stored.map((p) => p.slug));
    cachedAll = [...stored, ...mockPortfolioItems.filter((p) => !storedSlugs.has(p.slug))];
  }
  return cachedAll;
}

export function getPortfolioBySlug(slug: string): PortfolioItem | undefined {
  return getAllPortfolios().find((p) => p.slug === slug);
}

export function getMyPortfolios(ownerUserId: string): PortfolioItem[] {
  if (cachedMyPortfolios?.has(ownerUserId)) {
    return cachedMyPortfolios.get(ownerUserId)!;
  }
  if (!cachedMyPortfolios) {
    cachedMyPortfolios = new Map();
  }
  const filtered = getStoredPortfolios().filter((p) => p.ownerUserId === ownerUserId);
  cachedMyPortfolios.set(ownerUserId, filtered);
  return filtered;
}

export function getPublishedPortfoliosByUsername(username: string): PortfolioItem[] {
  if (cachedByUsername?.has(username)) {
    return cachedByUsername.get(username)!;
  }
  if (!cachedByUsername) {
    cachedByUsername = new Map();
  }
  const filtered = getAllPortfolios().filter(
    (p) =>
      p.freelancerUsername === username &&
      p.status === "published" &&
      (p.adminStatus === "approved" || p.adminStatus === "featured"),
  );
  cachedByUsername.set(username, filtered);
  return filtered;
}

export function getPublicPortfolioBySlug(slug: string): PortfolioItem | undefined {
  const item = getPortfolioBySlug(slug);
  if (!item) return undefined;
  if (item.status !== "published") {
    return undefined;
  }
  if (item.adminStatus === "rejected" || item.adminStatus === "hidden") {
    return undefined;
  }
  return item;
}

const emptyCaseStudy: CaseStudy = {
  clientProblem: "",
  research: "",
  strategy: "",
  designProcess: "",
  developmentProcess: "",
  finalResult: "",
  lessonsLearned: "",
};

function buildPortfolio(
  input: PortfolioFormInput,
  ctx: CreatePortfolioContext,
  status: PortfolioStatus,
  existing?: PortfolioItem,
): PortfolioItem {
  const all = getAllPortfolios();
  const slug = existing?.slug ?? uniqueSlug(input.title, all);
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? `pf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    slug,
    title: input.title.trim(),
    category: input.category,
    description: input.description.trim(),
    objectives: input.objectives.trim(),
    challenges: input.challenges.trim(),
    solutions: input.solutions.trim(),
    skills: input.skills,
    technologies: input.technologies,
    clientName: input.clientName?.trim() || undefined,
    duration: input.duration.trim(),
    teamSize: input.teamSize.trim(),
    budgetRange: input.budgetRange.trim(),
    completionDate: input.completionDate,
    coverImage: input.coverImage,
    galleryImages: input.galleryImages.slice(0, 10),
    videoUrl: input.videoUrl?.trim() || undefined,
    links: {
      github: input.links.github?.trim() || undefined,
      gitlab: input.links.gitlab?.trim() || undefined,
      behance: input.links.behance?.trim() || undefined,
      dribbble: input.links.dribbble?.trim() || undefined,
      liveDemo: input.links.liveDemo?.trim() || undefined,
      figma: input.links.figma?.trim() || undefined,
    },
    caseStudy: input.caseStudy,
    metrics: input.metrics.filter((m) => m.label.trim() && m.value.trim()),
    outcomes: input.outcomes.trim(),
    hue: input.hue,
    ownerUserId: ctx.ownerUserId,
    freelancerUsername: ctx.freelancerUsername,
    freelancerName: ctx.freelancerName,
    freelancerHue: ctx.freelancerHue,
    status,
    adminStatus: existing?.adminStatus ?? "pending",
    featured: input.featured ?? existing?.featured ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function savePortfolioDraft(
  input: PortfolioFormInput,
  ctx: CreatePortfolioContext,
  existingSlug?: string,
): PortfolioItem {
  const stored = readStored();
  const existing = existingSlug ? stored.find((p) => p.slug === existingSlug) : undefined;
  const item = buildPortfolio(input, ctx, "draft", existing);
  const next = existing
    ? stored.map((p) => (p.slug === existingSlug ? item : p))
    : [item, ...stored];
  writeStored(next);
  notify();
  return item;
}

export function publishPortfolio(
  input: PortfolioFormInput,
  ctx: CreatePortfolioContext,
  existingSlug?: string,
): PortfolioItem {
  const stored = readStored();
  const existing = existingSlug ? stored.find((p) => p.slug === existingSlug) : undefined;
  const item = buildPortfolio(input, ctx, "published", existing);
  if (!existing) {
    item.adminStatus = "pending";
  }
  const next = existing
    ? stored.map((p) => (p.slug === existingSlug ? item : p))
    : [item, ...stored];
  writeStored(next);
  notify();
  return item;
}

export function updatePortfolioStatus(slug: string, status: PortfolioStatus): PortfolioItem | undefined {
  const stored = readStored();
  const idx = stored.findIndex((p) => p.slug === slug);
  if (idx === -1) return undefined;
  const updated = { ...stored[idx]!, status, updatedAt: new Date().toISOString() };
  const next = [...stored];
  next[idx] = updated;
  writeStored(next);
  notify();
  return updated;
}

export function setPortfolioFeatured(slug: string, featured: boolean, days = 7): PortfolioItem | undefined {
  const stored = readStored();
  const idx = stored.findIndex((p) => p.slug === slug);
  if (idx === -1) return undefined;
  const until = featured ? new Date(Date.now() + days * 86400000).toISOString() : undefined;
  const updated = {
    ...stored[idx]!,
    featured,
    featuredUntil: until,
    adminStatus: featured ? ("featured" as const) : stored[idx]!.adminStatus,
    updatedAt: new Date().toISOString(),
  };
  const next = [...stored];
  next[idx] = updated;
  writeStored(next);
  notify();
  return updated;
}

export function archivePortfolio(slug: string): PortfolioItem | undefined {
  return updatePortfolioStatus(slug, "archived");
}

export function deletePortfolio(slug: string): boolean {
  const stored = readStored();
  const next = stored.filter((p) => p.slug !== slug);
  if (next.length === stored.length) return false;
  writeStored(next);
  notify();
  return true;
}

export function isPortfolioOwner(slug: string, userId: string): boolean {
  const item = readStored().find((p) => p.slug === slug);
  return item?.ownerUserId === userId;
}

export function updatePortfolioAdminStatus(
  slug: string,
  adminStatus: PortfolioAdminStatus,
  featured?: boolean,
): PortfolioItem | undefined {
  const stored = readStored();
  const mockIdx = mockPortfolioItems.findIndex((p) => p.slug === slug);
  if (mockIdx !== -1) {
    mockPortfolioItems[mockIdx] = {
      ...mockPortfolioItems[mockIdx]!,
      adminStatus,
      featured: featured ?? mockPortfolioItems[mockIdx]!.featured,
    };
    notify();
    return mockPortfolioItems[mockIdx];
  }
  const idx = stored.findIndex((p) => p.slug === slug);
  if (idx === -1) return undefined;
  const updated = {
    ...stored[idx]!,
    adminStatus,
    featured: featured ?? stored[idx]!.featured,
    updatedAt: new Date().toISOString(),
  };
  const next = [...stored];
  next[idx] = updated;
  writeStored(next);
  notify();
  return updated;
}

export function deletePortfolioAdmin(slug: string): boolean {
  const stored = readStored();
  const mockIdx = mockPortfolioItems.findIndex((p) => p.slug === slug);
  if (mockIdx !== -1) {
    mockPortfolioItems.splice(mockIdx, 1);
    notify();
    return true;
  }
  return deletePortfolio(slug);
}

export function searchPortfolios(params: PortfolioSearchParams): PortfolioItem[] {
  const q = params.keywords?.toLowerCase().trim();
  return getAllPortfolios().filter((p) => {
    if (p.status !== "published") return false;
    if (p.adminStatus === "rejected" || p.adminStatus === "hidden") return false;
    if (params.category && p.category !== params.category) return false;
    if (params.freelancer && p.freelancerUsername !== params.freelancer) return false;
    if (params.skills?.length && !params.skills.some((s) => p.skills.includes(s))) return false;
    if (params.technologies?.length && !params.technologies.some((t) => p.technologies.includes(t))) return false;
    if (q) {
      const haystack = [
        p.title,
        p.description,
        p.category,
        ...p.skills,
        ...p.technologies,
        p.freelancerName,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function getTopPerformingPortfolios(ownerUserId: string, limit = 5): PortfolioItem[] {
  const mine = getMyPortfolios(ownerUserId);
  if (mine.length === 0) return [];
  return mine
    .filter((p) => p.status === "published")
    .slice(0, limit);
}

export const portfolioCategoryOptions = [
  "Product Design",
  "Web Design",
  "Mobile Design",
  "Branding",
  "Brand System",
  "Fintech",
  "E-commerce",
  "Strategy",
  "Growth",
  "GTM",
  "Motion",
  "3D Viz",
  "Illustration",
  "Pattern",
  "Mobile",
  "Legal",
  "Heritage",
  "Interior",
  "Marketing",
  "Consulting",
  "Architecture",
  "Localization",
];

export function createEmptyFormInput(hue = 250): PortfolioFormInput {
  return {
    title: "",
    category: portfolioCategoryOptions[0]!,
    description: "",
    objectives: "",
    challenges: "",
    solutions: "",
    skills: [],
    technologies: [],
    clientName: "",
    duration: "",
    teamSize: "",
    budgetRange: "",
    completionDate: new Date().toISOString().slice(0, 10),
    coverImage: "",
    galleryImages: [],
    videoUrl: "",
    links: {},
    caseStudy: { ...emptyCaseStudy },
    metrics: [{ label: "", value: "" }],
    outcomes: "",
    hue,
    featured: false,
  };
}

export function portfolioToFormInput(item: PortfolioItem): PortfolioFormInput {
  return {
    title: item.title,
    category: item.category,
    description: item.description,
    objectives: item.objectives,
    challenges: item.challenges,
    solutions: item.solutions,
    skills: item.skills,
    technologies: item.technologies,
    clientName: item.clientName ?? "",
    duration: item.duration,
    teamSize: item.teamSize,
    budgetRange: item.budgetRange,
    completionDate: item.completionDate,
    coverImage: item.coverImage,
    galleryImages: item.galleryImages,
    videoUrl: item.videoUrl ?? "",
    links: { ...item.links },
    caseStudy: { ...item.caseStudy },
    metrics: item.metrics.length > 0 ? item.metrics : [{ label: "", value: "" }],
    outcomes: item.outcomes,
    hue: item.hue,
    featured: item.featured,
  };
}
