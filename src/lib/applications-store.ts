import type { Application } from "./mock-data";

import { applications as mockApplications } from "./mock-data";

import { getSession } from "./auth";

import { createOrder } from "./orders-store";

import { createEscrowFromOrder } from "./escrow-store";
import { recordAnalyticsEvent } from "./analytics-events-store";
import { getProjectBySlug } from "./projects-store";
import { notifyProposalReceived, notifyProposalAccepted, notifyOrderCreated } from "./notification-events";
import { canSubmitProposal, recordProposalSubmitted, getProposalUsage } from "./subscription-store";

const STORAGE_KEY = "ishbor-user-applications";
const EMPTY_APPLICATIONS: Application[] = [];
const listeners = new Set<() => void>();

let cachedApplications: Application[] | null = null;
let cachedBySlug: Map<string, Application[]> | null = null;
let cachedBySlugSource: Application[] | null = null;

function invalidateCache() {
  cachedApplications = null;
  cachedBySlug = null;
  cachedBySlugSource = null;
}



function notify() {

  invalidateCache();

  listeners.forEach((l) => l());

}



export function subscribeApplications(listener: () => void) {

  listeners.add(listener);

  return () => listeners.delete(listener);

}



function readStored(): Application[] {

  if (typeof window === "undefined") return EMPTY_APPLICATIONS;

  try {

    const raw = localStorage.getItem(STORAGE_KEY);

    return raw ? (JSON.parse(raw) as Application[]) : EMPTY_APPLICATIONS;

  } catch {

    return EMPTY_APPLICATIONS;

  }

}



function writeStored(apps: Application[]) {

  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));

}



function buildMerged(): Application[] {

  const stored = readStored();

  const storedIds = new Set(stored.map((a) => a.id));

  return [...stored, ...mockApplications.filter((a) => !storedIds.has(a.id))];

}



export function getStoredApplications(): Application[] {

  return readStored();

}



export function getAllApplications(): Application[] {

  if (typeof window === "undefined") {

    return buildMerged();

  }

  if (!cachedApplications) {

    cachedApplications = buildMerged();

  }

  return cachedApplications;

}



export function getApplicationById(id: string): Application | undefined {

  return getAllApplications().find((a) => a.id === id);

}



export function getApplicationsByProjectSlug(slug: string): Application[] {
  const all = getAllApplications();
  if (cachedBySlug && cachedBySlugSource === all && cachedBySlug.has(slug)) {
    return cachedBySlug.get(slug)!;
  }
  if (!cachedBySlug || cachedBySlugSource !== all) {
    cachedBySlug = new Map();
    cachedBySlugSource = all;
  }
  const filtered = all.filter((a) => a.projectSlug === slug);
  cachedBySlug.set(slug, filtered);
  return filtered;
}



export type NewApplicationInput = {

  projectTitle: string;

  projectSlug: string;

  client: string;

  clientHue: number;

  clientSlug?: string;

  budget: number;

  proposalAmount: number;

  deliveryTime: string;

  category: string;

  coverNote: string;

};



export function createApplication(input: NewApplicationInput): Application | { error: string } {
  const session = getSession();
  if (!session) return { error: "Tizimga kiring." };
  if (!canSubmitProposal(session.user.id)) {
    const { used, limit } = getProposalUsage(session.user.id);
    return {
      error: `Oylik taklif limiti tugadi (${used}/${limit}). Pro rejaga o'ting — cheksiz takliflar.`,
    };
  }

  const app: Application = {

    id: `a-${Date.now()}`,

    projectTitle: input.projectTitle,

    projectSlug: input.projectSlug,

    client: input.client,

    clientHue: input.clientHue,

    clientSlug: input.clientSlug,

    budget: input.budget,

    proposalAmount: input.proposalAmount,

    deliveryTime: input.deliveryTime,

    category: input.category,

    submittedAgo: "Just now",

    status: "pending",

    coverNote: input.coverNote,

    freelancerUsername: session?.user.username,

    freelancerName: session?.user.fullName,

    freelancerHue: session?.user.avatarHue,

  };

  const stored = readStored();

  writeStored([app, ...stored]);
  notify();
  recordProposalSubmitted(session.user.id);
  recordAnalyticsEvent({ type: "proposal_received", entityId: input.projectSlug });

  const project = getProjectBySlug(input.projectSlug);
  if (project?.ownerUserId) {
    notifyProposalReceived(project.ownerUserId, input.projectTitle, input.projectSlug);
  }

  return app;

}



export function readStoredApplications(): Application[] {
  return readStored();
}

export function getApplicationsForFreelancer(username: string): Application[] {
  return readStored().filter((a) => a.freelancerUsername === username && !a.archived);
}

export function updateApplicationStatus(

  id: string,

  status: Application["status"],

): Application | undefined {

  const stored = readStored();

  const idx = stored.findIndex((a) => a.id === id);

  if (idx === -1) return undefined;

  const updated = { ...stored[idx]!, status };

  const next = [...stored];

  next[idx] = updated;

  writeStored(next);

  notify();

  return updated;

}



export function acceptApplication(id: string): { application: Application; orderId: string } | undefined {

  const stored = readStored();

  const idx = stored.findIndex((a) => a.id === id);

  if (idx === -1) return undefined;



  const app = stored[idx]!;

  if (app.status === "accepted") return undefined;



  const order = createOrder({

    title: app.projectTitle,

    client: app.client,

    clientHue: app.clientHue,

    clientSlug: app.clientSlug,

    freelancer: app.freelancerName ?? "Frilanser",

    freelancerHue: app.freelancerHue ?? 250,

    freelancerUsername: app.freelancerUsername,

    amount: app.proposalAmount ?? app.budget,

    dueDate: app.deliveryTime,

  });

  createEscrowFromOrder(order);



  const updated: Application = { ...app, status: "accepted", orderId: order.id };

  const next = [...stored];

  next[idx] = updated;

  writeStored(next);

  notify();

  const session = getSession();
  if (session) {
    notifyOrderCreated(session.user.id, order.title, order.id);
  }
  if (app.freelancerUsername && session?.user.id) {
    notifyProposalAccepted(session.user.id, app.projectTitle, order.id);
  }

  return { application: updated, orderId: order.id };

}



export function createDirectHireApplication(input: {

  projectTitle: string;

  projectSlug: string;

  client: string;

  clientHue: number;

  clientSlug?: string;

  budget: number;

  category: string;

  freelancerUsername: string;

  freelancerName: string;

  freelancerHue: number;

}): { application: Application; orderId: string } {

  const app: Application = {

    id: `a-${Date.now()}`,

    projectTitle: input.projectTitle,

    projectSlug: input.projectSlug,

    client: input.client,

    clientHue: input.clientHue,

    clientSlug: input.clientSlug,

    budget: input.budget,

    proposalAmount: input.budget,

    deliveryTime: "As discussed",

    category: input.category,

    submittedAgo: "Just now",

    status: "accepted",

    coverNote: `Direct hire invitation for ${input.freelancerName}.`,

    freelancerUsername: input.freelancerUsername,

    freelancerName: input.freelancerName,

    freelancerHue: input.freelancerHue,

  };



  const order = createOrder({

    title: input.projectTitle,

    client: input.client,

    clientHue: input.clientHue,

    clientSlug: input.clientSlug,

    freelancer: input.freelancerName,

    freelancerHue: input.freelancerHue,

    freelancerUsername: input.freelancerUsername,

    amount: input.budget,

  });

  createEscrowFromOrder(order);



  const withOrder = { ...app, orderId: order.id };

  const stored = readStored();

  writeStored([withOrder, ...stored]);

  notify();

  return { application: withOrder, orderId: order.id };

}

export function archiveApplication(id: string): Application | undefined {
  const stored = readStored();
  const idx = stored.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  const updated = { ...stored[idx]!, archived: true };
  const next = [...stored];
  next[idx] = updated;
  writeStored(next);
  notify();
  return updated;
}

export function shortlistApplication(id: string): Application | undefined {
  return updateApplicationStatus(id, "shortlisted");
}


