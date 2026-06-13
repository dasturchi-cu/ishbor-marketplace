import type { EscrowWorkflow } from "./mock-data";
import { escrowWorkflows as mockEscrow } from "./mock-data";
import type { Order } from "./mock-data";

const STORAGE_KEY = "ishbor-user-escrow";
const listeners = new Set<() => void>();
let cachedEscrow: EscrowWorkflow[] | null = null;

function invalidateCache() {
  cachedEscrow = null;
}

function notify() {
  invalidateCache();
  listeners.forEach((l) => l());
}

export function subscribeEscrow(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStored(): EscrowWorkflow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EscrowWorkflow[]) : [];
  } catch {
    return [];
  }
}

function writeStored(workflows: EscrowWorkflow[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}

function buildMerged(): EscrowWorkflow[] {
  const stored = readStored();
  const storedIds = new Set(stored.map((e) => e.id));
  return [...stored, ...mockEscrow.filter((e) => !storedIds.has(e.id))];
}

export function getAllEscrowWorkflows(): EscrowWorkflow[] {
  if (typeof window === "undefined") {
    return buildMerged();
  }
  if (!cachedEscrow) {
    cachedEscrow = buildMerged();
  }
  return cachedEscrow;
}

export function getEscrowWorkflowById(id: string): EscrowWorkflow | undefined {
  return getAllEscrowWorkflows().find((e) => e.id === id);
}

export function getEscrowByOrderId(orderId: string): EscrowWorkflow | undefined {
  return getAllEscrowWorkflows().find((e) => e.orderId === orderId);
}

export function createEscrowFromOrder(order: Order): EscrowWorkflow {
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const milestoneAmount = Math.round(order.amount / 2);
  const workflow: EscrowWorkflow = {
    id: `ew-${Date.now()}`,
    orderId: order.id,
    project: order.title,
    client: order.client,
    clientHue: order.clientHue,
    freelancer: order.freelancer,
    freelancerHue: order.freelancerHue,
    amount: order.amount,
    status: order.escrowFunded ? "funded" : "accepted",
    milestones: order.milestones.map((m, i) => ({
      label: m.label,
      amount: m.amount,
      status: i === 0 && order.escrowFunded ? ("funded" as const) : ("pending" as const),
    })),
    timeline: [
      { step: "Proposal submitted", date: today, done: true },
      { step: "Proposal accepted", date: today, done: true },
      { step: "Escrow funded", date: order.escrowFunded ? today : "—", done: order.escrowFunded },
      { step: "Work started", date: "—", done: false },
      { step: "Milestone delivered", date: "—", done: false },
      { step: "Client review", date: "—", done: false },
      { step: "Funds released", date: "—", done: false },
      { step: "Completed", date: "—", done: false },
    ],
  };
  const stored = readStored();
  writeStored([workflow, ...stored]);
  notify();
  return workflow;
}

export function fundEscrow(orderId: string): EscrowWorkflow | undefined {
  const stored = readStored();
  const idx = stored.findIndex((e) => e.orderId === orderId);
  if (idx === -1) return undefined;
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const existing = stored[idx]!;
  const updated: EscrowWorkflow = {
    ...existing,
    status: "funded",
    timeline: existing.timeline.map((t) =>
      t.step === "Escrow funded" ? { ...t, date: today, done: true } : t,
    ),
    milestones: existing.milestones.map((m, i) =>
      i === 0 ? { ...m, status: "funded" as const } : m,
    ),
  };
  const next = [...stored];
  next[idx] = updated;
  writeStored(next);
  notify();
  return updated;
}
