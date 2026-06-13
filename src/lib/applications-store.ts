import type { Application } from "./mock-data";
import { applications as mockApplications } from "./mock-data";

const STORAGE_KEY = "ishbor-user-applications";

function readStored(): Application[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Application[]) : [];
  } catch {
    return [];
  }
}

function writeStored(apps: Application[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function getStoredApplications(): Application[] {
  return readStored();
}

export function getAllApplications(): Application[] {
  const stored = readStored();
  const storedIds = new Set(stored.map((a) => a.id));
  const merged = [...stored, ...mockApplications.filter((a) => !storedIds.has(a.id))];
  return merged;
}

export function getApplicationById(id: string): Application | undefined {
  return getAllApplications().find((a) => a.id === id);
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

export function createApplication(input: NewApplicationInput): Application {
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
  };
  const stored = readStored();
  writeStored([app, ...stored]);
  return app;
}
