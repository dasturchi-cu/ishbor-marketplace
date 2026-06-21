import type { Project, ProjectStatus } from "./mock-data";
import { projects as mockProjects } from "./mock-data";
import { isMarketplaceReady } from "./project-validation";
import { notifyNewListing } from "./alerts-store";
import { maybeCompleteReferral } from "./referral-store";
import { getSession } from "./auth";
import { recordAnalyticsEvent } from "./analytics-events-store";
import { findDuplicateTitle, isBlockedByModeration, moderationSummary, scanListing } from "./content-moderation";
import { flagContentForReview } from "./moderation-queue";

const STORAGE_KEY = "ishbor-user-projects";
const listeners = new Set<() => void>();
let cachedProjects: Project[] | null = null;
let cachedPublished: Project[] | null = null;
let cachedPublishedSource: Project[] | null = null;
let cachedMyProjects: Map<string, Project[]> | null = null;
let cachedStored: Project[] | null = null;

function invalidateCache() {
  cachedProjects = null;
  cachedPublished = null;
  cachedPublishedSource = null;
  cachedMyProjects = null;
  cachedStored = null;
}

function getStoredSnapshot(): Project[] {
  if (cachedStored === null) {
    cachedStored = readStored();
  }
  return cachedStored;
}

function notify() {
  invalidateCache();
  listeners.forEach((l) => l());
}

export function subscribeProjects(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStored(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

function writeStored(projects: Project[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || `project-${Date.now()}`;
}

function uniqueSlug(title: string, existing: Project[]): string {
  let slug = slugify(title);
  const slugs = new Set(existing.map((p) => p.slug));
  let i = 1;
  while (slugs.has(slug)) {
    slug = `${slugify(title)}-${i++}`;
  }
  return slug;
}

export function getStoredProjects(): Project[] {
  return readStored();
}

export function getAllProjects(): Project[] {
  if (typeof window === "undefined") {
    const stored = readStored();
    const storedSlugs = new Set(stored.map((p) => p.slug));
    return [...stored, ...mockProjects.filter((p) => !storedSlugs.has(p.slug))];
  }
  if (!cachedProjects) {
    const stored = readStored();
    const storedSlugs = new Set(stored.map((p) => p.slug));
    cachedProjects = [...stored, ...mockProjects.filter((p) => !storedSlugs.has(p.slug))];
  }
  return cachedProjects;
}

export function getPublishedProjects(): Project[] {
  const all = getAllProjects();
  if (cachedPublished && cachedPublishedSource === all) {
    return cachedPublished;
  }
  cachedPublished = all.filter((p) => (!p.status || p.status === "published") && isMarketplaceReady(p));
  cachedPublishedSource = all;
  return cachedPublished;
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getAllProjects().find((p) => p.slug === slug);
}

export function getMyProjects(ownerUserId: string): Project[] {
  if (cachedMyProjects?.has(ownerUserId)) {
    return cachedMyProjects.get(ownerUserId)!;
  }
  if (!cachedMyProjects) {
    cachedMyProjects = new Map();
  }
  const filtered = getStoredSnapshot().filter((p) => p.ownerUserId === ownerUserId);
  cachedMyProjects.set(ownerUserId, filtered);
  return filtered;
}

export function getMyPublishedProjects(ownerUserId: string): Project[] {
  const key = `${ownerUserId}:published`;
  if (cachedMyProjects?.has(key)) {
    return cachedMyProjects.get(key)!;
  }
  if (!cachedMyProjects) {
    cachedMyProjects = new Map();
  }
  const filtered = getMyProjects(ownerUserId).filter((p) => p.status === "published");
  cachedMyProjects.set(key, filtered);
  return filtered;
}

export type ProjectFormInput = {
  title: string;
  category: string;
  budget: number;
  budgetType: "fixed" | "hourly";
  duration: string;
  description: string;
  skills: string[];
  experienceLevel: "Entry" | "Intermediate" | "Expert";
  attachments?: { name: string; size: string }[];
};

export type CreateProjectContext = {
  ownerUserId: string;
  client: string;
  clientHue: number;
  clientSlug?: string;
  clientVerified: boolean;
};

function buildProject(
  input: ProjectFormInput,
  ctx: CreateProjectContext,
  status: ProjectStatus,
  existing?: Project,
): Project {
  const all = getAllProjects();
  const slug = existing?.slug ?? uniqueSlug(input.title, all);
  return {
    id: existing?.id ?? `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    slug,
    title: input.title.trim(),
    client: ctx.client,
    clientHue: ctx.clientHue,
    clientSlug: ctx.clientSlug,
    clientSpent: existing?.clientSpent ?? 0,
    clientHires: existing?.clientHires ?? 0,
    clientVerified: ctx.clientVerified,
    clientMemberSince: existing?.clientMemberSince ?? new Date().getFullYear().toString(),
    budget: input.budget,
    budgetType: input.budgetType,
    category: input.category,
    postedAgo: status === "published" ? "Hozirgina" : existing?.postedAgo ?? "Qoralama",
    proposals: existing?.proposals ?? 0,
    description: input.description.trim(),
    skills: input.skills,
    duration: input.duration,
    verified: ctx.clientVerified,
    escrowProtected: true,
    scope: input.description.trim()
      .split("\n")
      .filter((l) => l.trim().startsWith("-"))
      .map((l) => l.replace(/^-\s*/, "").trim())
      .filter(Boolean),
    experienceLevel: input.experienceLevel,
    status,
    ownerUserId: ctx.ownerUserId,
    attachments: input.attachments ?? [],
  };
}

export function saveProjectDraft(
  input: ProjectFormInput,
  ctx: CreateProjectContext,
  existingSlug?: string,
): Project {
  const stored = readStored();
  const existing = existingSlug ? stored.find((p) => p.slug === existingSlug) : undefined;
  const project = buildProject(input, ctx, "draft", existing);
  const next = existing
    ? stored.map((p) => (p.slug === existingSlug ? project : p))
    : [project, ...stored];
  writeStored(next);
  notify();
  return project;
}

export function publishProject(
  input: ProjectFormInput,
  ctx: CreateProjectContext,
  existingSlug?: string,
): Project | { error: string } {
  const stored = readStored();
  const existing = existingSlug ? stored.find((p) => p.slug === existingSlug) : undefined;
  const moderationFlags = scanListing({
    title: input.title,
    description: input.description,
  });
  if (isBlockedByModeration(moderationFlags)) {
    return { error: moderationSummary(moderationFlags) };
  }
  const existingTitles = stored
    .filter((p) => p.status === "published" && p.slug !== existingSlug)
    .map((p) => p.title);
  if (findDuplicateTitle(input.title, existingTitles)) {
    return { error: "Bunday nomli loyiha allaqachon mavjud" };
  }
  const project = buildProject(input, ctx, "published", existing);
  project.postedAgo = "Hozirgina";
  project.createdAt = existing?.createdAt ?? new Date().toISOString();
  const next = existing
    ? stored.map((p) => (p.slug === existingSlug ? project : p))
    : [project, ...stored];
  writeStored(next);
  notify();
  notifyNewListing({
    title: project.title,
    slug: project.slug,
    category: project.category,
    skills: project.skills,
    budget: project.budget,
    href: `/projects/${project.slug}`,
    type: "project",
  });
  const session = getSession();
  if (session) maybeCompleteReferral(session.user.id, "listing_published");
  recordAnalyticsEvent({
    type: "project_created",
    entityId: project.slug,
    meta: {
      projectTitle: project.title,
      userName: session?.user.fullName ?? project.client,
    },
  });
  flagContentForReview("project", project.title, moderationFlags);
  return project;
}

export function updateProjectFeatured(slug: string, featured: boolean, days = 7): Project | undefined {
  const stored = readStored();
  const idx = stored.findIndex((p) => p.slug === slug);
  if (idx === -1) return undefined;
  const until = featured ? new Date(Date.now() + days * 86400000).toISOString() : undefined;
  const updated = { ...stored[idx]!, featured, featuredUntil: until };
  const next = [...stored];
  next[idx] = updated;
  writeStored(next);
  notify();
  return updated;
}

export function updateProjectStatus(slug: string, status: ProjectStatus): Project | undefined {
  const stored = readStored();
  const idx = stored.findIndex((p) => p.slug === slug);
  if (idx === -1) return undefined;
  const updated = { ...stored[idx]!, status };
  const next = [...stored];
  next[idx] = updated;
  writeStored(next);
  notify();
  return updated;
}

export function deleteProject(slug: string): boolean {
  const stored = readStored();
  const next = stored.filter((p) => p.slug !== slug);
  if (next.length === stored.length) return false;
  writeStored(next);
  notify();
  return true;
}

export function rehydrateFromStorage() {
  notify();
}

export function isProjectOwner(slug: string, userId: string): boolean {
  const project = readStored().find((p) => p.slug === slug);
  return project?.ownerUserId === userId;
}
