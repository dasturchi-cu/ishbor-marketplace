import { getSession } from "./auth";
import { addNotification } from "./notifications-store";
import { recordAnalyticsEvent } from "./analytics-events-store";
import type {
  Agency,
  AgencyFormInput,
  AgencyMember,
  AgencyRole,
  AgencyVerificationLevel,
} from "./agency-types";
import { agencyRoleLabels } from "./agency-types";

const STORAGE_KEY = "ishbor-agencies";
const listeners = new Set<() => void>();
let cachedAll: Agency[] | null = null;
let cachedPublished: Agency[] | null = null;

function invalidateCache() {
  cachedAll = null;
  cachedPublished = null;
}

function notify() {
  invalidateCache();
  listeners.forEach((l) => l());
}

export function subscribeAgencies(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Agency[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((a) => ({
      ...(a as Agency),
      members: Array.isArray((a as Agency).members) ? (a as Agency).members : [],
    }));
  } catch {
    return [];
  }
}

function writeAll(agencies: Agency[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agencies));
  notify();
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || `agency-${Date.now()}`;
}

function uniqueSlug(name: string, existing: Agency[]): string {
  let slug = slugify(name);
  const slugs = new Set(existing.map((a) => a.slug));
  let i = 1;
  while (slugs.has(slug)) {
    slug = `${slugify(name)}-${i++}`;
  }
  return slug;
}

export const ROLE_PERMISSIONS = {
  owner: ["invite", "remove", "assign_roles", "edit_agency", "publish", "verify_request", "manage_portfolio", "view_crm", "view_dashboard"],
  manager: ["invite", "remove_freelancer", "assign_recruiter", "edit_agency", "manage_portfolio", "view_crm", "view_dashboard"],
  recruiter: ["invite_freelancer", "view_crm", "view_dashboard"],
  freelancer: ["view_dashboard"],
} as const;

export type AgencyPermission = (typeof ROLE_PERMISSIONS)[AgencyRole][number];

export function hasAgencyPermission(
  agency: Agency,
  userId: string,
  permission: AgencyPermission,
): boolean {
  const member = agency.members.find((m) => m.userId === userId && m.status === "active");
  if (!member) return false;
  const perms = ROLE_PERMISSIONS[member.role] as readonly string[];
  return perms.includes(permission);
}

export function getAgencyBySlug(slug: string): Agency | undefined {
  return readAll().find((a) => a.slug === slug && a.status !== "archived");
}

export function getAgencyById(id: string): Agency | undefined {
  return readAll().find((a) => a.id === id);
}

export function rehydrateFromStorage() {
  notify();
}

export function getAllAgencies(): Agency[] {
  if (typeof window === "undefined") {
    return readAll();
  }
  if (!cachedAll) {
    cachedAll = readAll();
  }
  return cachedAll;
}

export function getPublishedAgencies(): Agency[] {
  if (typeof window === "undefined") {
    return readAll().filter((a) => a.status === "published");
  }
  if (!cachedPublished) {
    cachedPublished = getAllAgencies().filter((a) => a.status === "published");
  }
  return cachedPublished;
}

export function getAgenciesForUser(userId: string): Agency[] {
  return readAll().filter((a) =>
    a.members.some((m) => m.userId === userId && m.status === "active"),
  );
}

export function getOwnedAgencies(userId: string): Agency[] {
  return readAll().filter((a) => a.ownerUserId === userId);
}

export function createAgency(input: AgencyFormInput): Agency | { error: string } {
  const session = getSession();
  if (!session) return { error: "Tizimga kiring." };

  const existing = readAll();
  const owned = existing.filter((a) => a.ownerUserId === session.user.id && a.status !== "archived");
  if (owned.length >= 1) {
    return { error: "Sizda allaqachon agentlik mavjud. Bir foydalanuvchi bitta agentlik yaratishi mumkin." };
  }

  const now = new Date().toISOString();
  const slug = uniqueSlug(input.name, existing);
  const ownerMember: AgencyMember = {
    userId: session.user.id,
    username: session.user.username,
    email: session.user.email,
    fullName: session.user.fullName,
    avatarHue: session.user.avatarHue,
    role: "owner",
    status: "active",
    joinedAt: now,
  };

  const agency: Agency = {
    id: `agency-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    slug,
    name: input.name.trim(),
    logo: input.logo,
    cover: input.cover,
    description: input.description.trim(),
    foundedYear: input.foundedYear,
    teamSize: input.teamSize,
    specializations: input.specializations.filter(Boolean),
    languages: input.languages.filter(Boolean),
    location: input.location.trim(),
    website: input.website?.trim(),
    ownerUserId: session.user.id,
    members: [ownerMember],
    verificationLevel: "none",
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  writeAll([agency, ...existing]);
  recordAnalyticsEvent({ type: "agency_created", entityId: slug, userId: session.user.id });

  addNotification({
    userId: session.user.id,
    kind: "system",
    title: "Agentlik yaratildi",
    body: `"${agency.name}" qoralama sifatida saqlandi. E'lon qilish uchun profilni to'ldiring.`,
    priority: "high",
    href: `/agencies/${slug}`,
  });

  return agency;
}

export function updateAgency(slug: string, input: Partial<AgencyFormInput>): Agency | { error: string } {
  const session = getSession();
  if (!session) return { error: "Tizimga kiring." };

  const all = readAll();
  const idx = all.findIndex((a) => a.slug === slug);
  if (idx === -1) return { error: "Agentlik topilmadi." };

  const agency = all[idx]!;
  if (!hasAgencyPermission(agency, session.user.id, "edit_agency")) {
    return { error: "Tahrirlash huquqi yo'q." };
  }

  const updated: Agency = {
    ...agency,
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(input.description !== undefined && { description: input.description.trim() }),
    ...(input.foundedYear !== undefined && { foundedYear: input.foundedYear }),
    ...(input.teamSize !== undefined && { teamSize: input.teamSize }),
    ...(input.specializations !== undefined && { specializations: input.specializations.filter(Boolean) }),
    ...(input.languages !== undefined && { languages: input.languages.filter(Boolean) }),
    ...(input.location !== undefined && { location: input.location.trim() }),
    ...(input.website !== undefined && { website: input.website?.trim() }),
    ...(input.logo !== undefined && { logo: input.logo }),
    ...(input.cover !== undefined && { cover: input.cover }),
    updatedAt: new Date().toISOString(),
  };

  const next = [...all];
  next[idx] = updated;
  writeAll(next);
  return updated;
}

export function publishAgency(slug: string): Agency | { error: string } {
  const session = getSession();
  if (!session) return { error: "Tizimga kiring." };

  const all = readAll();
  const idx = all.findIndex((a) => a.slug === slug);
  if (idx === -1) return { error: "Agentlik topilmadi." };

  const agency = all[idx]!;
  if (!hasAgencyPermission(agency, session.user.id, "publish")) {
    return { error: "E'lon qilish huquqi yo'q." };
  }
  if (!agency.name || !agency.description || agency.specializations.length === 0) {
    return { error: "Nom, tavsif va kamida bitta mutaxassislik to'ldirilishi shart." };
  }

  const updated: Agency = { ...agency, status: "published", updatedAt: new Date().toISOString() };
  const next = [...all];
  next[idx] = updated;
  writeAll(next);
  recordAnalyticsEvent({ type: "agency_published", entityId: slug, userId: session.user.id });
  return updated;
}

export function inviteMember(
  agencySlug: string,
  email: string,
  role: AgencyRole,
  fullName: string,
): Agency | { error: string } {
  const session = getSession();
  if (!session) return { error: "Tizimga kiring." };
  if (role === "owner") return { error: "Egasi rolini taklif qilib bo'lmaydi." };

  const all = readAll();
  const idx = all.findIndex((a) => a.slug === agencySlug);
  if (idx === -1) return { error: "Agentlik topilmadi." };

  const agency = all[idx]!;
  const canInvite =
    hasAgencyPermission(agency, session.user.id, "invite") ||
    (role === "freelancer" && hasAgencyPermission(agency, session.user.id, "invite_freelancer"));
  if (!canInvite) return { error: "Taklif yuborish huquqi yo'q." };

  if (agency.members.some((m) => m.email === email && m.status !== "removed")) {
    return { error: "Bu email allaqachon jamoada yoki kutilmoqda." };
  }

  const inviteId = `invite-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const member: AgencyMember = {
    userId: inviteId,
    email: email.trim().toLowerCase(),
    fullName: fullName.trim(),
    avatarHue: Math.floor(Math.random() * 360),
    role,
    status: "pending",
    joinedAt: "",
    invitedAt: new Date().toISOString(),
  };

  const updated: Agency = {
    ...agency,
    members: [...agency.members, member],
    updatedAt: new Date().toISOString(),
  };
  const next = [...all];
  next[idx] = updated;
  writeAll(next);

  recordAnalyticsEvent({
    type: "agency_member_invited",
    entityId: agencySlug,
    userId: session.user.id,
    meta: { role, email },
  });

  return updated;
}

export function acceptInvite(agencySlug: string, inviteUserId: string): Agency | { error: string } {
  const session = getSession();
  if (!session) return { error: "Tizimga kiring." };

  const all = readAll();
  const idx = all.findIndex((a) => a.slug === agencySlug);
  if (idx === -1) return { error: "Agentlik topilmadi." };

  const agency = all[idx]!;
  const memberIdx = agency.members.findIndex((m) => m.userId === inviteUserId && m.status === "pending");
  if (memberIdx === -1) return { error: "Taklif topilmadi." };

  const member = agency.members[memberIdx]!;
  if (member.email !== session.user.email.toLowerCase()) {
    return { error: "Bu taklif sizga tegishli emas." };
  }

  const updatedMembers = [...agency.members];
  updatedMembers[memberIdx] = {
    ...member,
    userId: session.user.id,
    username: session.user.username,
    fullName: session.user.fullName,
    avatarHue: session.user.avatarHue,
    status: "active",
    joinedAt: new Date().toISOString(),
  };

  const updated: Agency = { ...agency, members: updatedMembers, updatedAt: new Date().toISOString() };
  const next = [...all];
  next[idx] = updated;
  writeAll(next);

  addNotification({
    userId: agency.ownerUserId,
    kind: "system",
    title: "Yangi jamoa a'zosi",
    body: `${session.user.fullName} ${agencyRoleLabels[member.role]} sifatida qo'shildi.`,
    priority: "normal",
    href: `/dashboard/agency`,
  });

  return updated;
}

export function removeMember(agencySlug: string, memberUserId: string): Agency | { error: string } {
  const session = getSession();
  if (!session) return { error: "Tizimga kiring." };

  const all = readAll();
  const idx = all.findIndex((a) => a.slug === agencySlug);
  if (idx === -1) return { error: "Agentlik topilmadi." };

  const agency = all[idx]!;
  const target = agency.members.find((m) => m.userId === memberUserId);
  if (!target) return { error: "A'zo topilmadi." };
  if (target.role === "owner") return { error: "Egasini olib bo'lmaydi." };

  const canRemove =
    hasAgencyPermission(agency, session.user.id, "remove") ||
    (target.role === "freelancer" && hasAgencyPermission(agency, session.user.id, "remove_freelancer"));
  if (!canRemove) return { error: "Olib tashlash huquqi yo'q." };

  const updatedMembers = agency.members.map((m) =>
    m.userId === memberUserId ? { ...m, status: "removed" as const } : m,
  );

  const updated: Agency = { ...agency, members: updatedMembers, updatedAt: new Date().toISOString() };
  const next = [...all];
  next[idx] = updated;
  writeAll(next);
  return updated;
}

export function assignRole(
  agencySlug: string,
  memberUserId: string,
  role: AgencyRole,
): Agency | { error: string } {
  const session = getSession();
  if (!session) return { error: "Tizimga kiring." };
  if (role === "owner") return { error: "Egasi rolini o'tkazish alohida jarayon." };

  const all = readAll();
  const idx = all.findIndex((a) => a.slug === agencySlug);
  if (idx === -1) return { error: "Agentlik topilmadi." };

  const agency = all[idx]!;
  const canAssign =
    hasAgencyPermission(agency, session.user.id, "assign_roles") ||
    (["recruiter", "freelancer"].includes(role) &&
      hasAgencyPermission(agency, session.user.id, "assign_recruiter"));
  if (!canAssign) return { error: "Rol tayinlash huquqi yo'q." };

  const memberIdx = agency.members.findIndex((m) => m.userId === memberUserId && m.status === "active");
  if (memberIdx === -1) return { error: "Faol a'zo topilmadi." };
  if (agency.members[memberIdx]!.role === "owner") return { error: "Egasi rolini o'zgartirib bo'lmaydi." };

  const updatedMembers = [...agency.members];
  updatedMembers[memberIdx] = { ...updatedMembers[memberIdx]!, role };
  const updated: Agency = { ...agency, members: updatedMembers, updatedAt: new Date().toISOString() };
  const next = [...all];
  next[idx] = updated;
  writeAll(next);
  return updated;
}

export function requestVerification(
  agencySlug: string,
  level: AgencyVerificationLevel,
): Agency | { error: string } {
  const session = getSession();
  if (!session) return { error: "Tizimga kiring." };
  if (level === "none") return { error: "Noto'g'ri daraja." };

  const all = readAll();
  const idx = all.findIndex((a) => a.slug === agencySlug);
  if (idx === -1) return { error: "Agentlik topilmadi." };

  const agency = all[idx]!;
  if (!hasAgencyPermission(agency, session.user.id, "verify_request")) {
    return { error: "Tasdiqlash so'rovi huquqi yo'q." };
  }
  if (agency.status !== "published") {
    return { error: "Avval agentlikni e'lon qiling." };
  }

  const levelOrder: AgencyVerificationLevel[] = ["none", "verified", "premium", "enterprise"];
  const currentIdx = levelOrder.indexOf(agency.verificationLevel);
  const requestedIdx = levelOrder.indexOf(level);
  if (requestedIdx <= currentIdx) {
    return { error: "Bu daraja allaqachon mavjud yoki past." };
  }

  const activeMembers = agency.members.filter((m) => m.status === "active").length;
  if (level === "verified" && activeMembers < 2) {
    return { error: "Tasdiqlangan daraja uchun kamida 2 ta faol jamoa a'zosi kerak." };
  }
  if (level === "premium" && activeMembers < 5) {
    return { error: "Premium daraja uchun kamida 5 ta faol a'zo kerak." };
  }
  if (level === "enterprise" && activeMembers < 10) {
    return { error: "Korporativ daraja uchun kamida 10 ta faol a'zo kerak." };
  }

  const updated: Agency = {
    ...agency,
    verificationLevel: level,
    verificationRequestedAt: new Date().toISOString(),
    verificationApprovedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const next = [...all];
  next[idx] = updated;
  writeAll(next);

  recordAnalyticsEvent({
    type: "agency_verified",
    entityId: agencySlug,
    userId: session.user.id,
    meta: { level },
  });

  return updated;
}

export function getPendingInvitesForUser(email: string) {
  return readAll().flatMap((agency) =>
    agency.members
      .filter((m) => m.status === "pending" && m.email === email.toLowerCase())
      .map((m) => ({ agency, member: m })),
  );
}

const DEMO_AGENCY_OWNER_ID = "u-admin-1";

/** Ensure admin demo account can switch to agency workspace. */
export function seedDemoAgencyIfNeeded(userId: string): Agency | null {
  if (userId !== DEMO_AGENCY_OWNER_ID) return null;
  const existing = getAgenciesForUser(userId);
  if (existing.length > 0) return existing[0]!;

  const session = getSession();
  if (!session || session.user.id !== userId) return null;

  const now = new Date().toISOString();
  const agency: Agency = {
    id: "agency-demo-ishbor",
    slug: "ishbor-studio",
    name: "Ishbor Studio",
    description: "Platform demo agentligi — jamoa, CRM va portfolio boshqaruvi.",
    foundedYear: 2024,
    teamSize: "6-10",
    specializations: ["Branding", "Development", "Strategy"],
    languages: ["O'zbek", "Rus", "Ingliz"],
    location: "Tashkent, Uzbekistan",
    ownerUserId: userId,
    members: [
      {
        userId,
        email: session.user.email,
        fullName: session.user.fullName,
        avatarHue: session.user.avatarHue,
        role: "owner",
        status: "active",
        joinedAt: now,
      },
    ],
    verificationLevel: "verified",
    status: "published",
    createdAt: now,
    updatedAt: now,
  };

  writeAll([agency, ...readAll()]);
  return agency;
}
