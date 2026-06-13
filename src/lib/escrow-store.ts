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
      { step: "Taklif yuborildi", date: today, done: true },
      { step: "Taklif qabul qilindi", date: today, done: true },
      { step: "Eskrou to'ldirildi", date: order.escrowFunded ? today : "—", done: order.escrowFunded },
      { step: "Ish boshlandi", date: "—", done: false },
      { step: "Bosqich topshirildi", date: "—", done: false },
      { step: "Mijoz ko'rib chiqishi", date: "—", done: false },
      { step: "Mablag' chiqarildi", date: "—", done: false },
      { step: "Yakunlandi", date: "—", done: false },
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
      t.step === "Eskrou to'ldirildi" ? { ...t, date: today, done: true } : t,
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

function persistEscrowUpdate(id: string, updater: (escrow: EscrowWorkflow) => EscrowWorkflow): EscrowWorkflow | undefined {
  const existing = getEscrowWorkflowById(id);
  if (!existing) return undefined;
  const updated = updater(existing);
  const stored = readStored();
  const idx = stored.findIndex((e) => e.id === id);
  const next = idx === -1 ? [updated, ...stored] : stored.map((e) => (e.id === id ? updated : e));
  writeStored(next);
  notify();
  return updated;
}

export function releaseEscrowMilestone(escrowId: string, milestoneLabel: string): EscrowWorkflow | undefined {
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return persistEscrowUpdate(escrowId, (escrow) => {
    const milestones = escrow.milestones.map((m) =>
      m.label === milestoneLabel && m.status === "funded" ? { ...m, status: "released" as const } : m,
    );
    const allReleased = milestones.every((m) => m.status === "released");
    return {
      ...escrow,
      status: allReleased ? "completed" : escrow.status,
      milestones,
      timeline: escrow.timeline.map((t) => {
        if (t.step === "Mablag' chiqarildi" && milestones.some((m) => m.status === "released")) {
          return { ...t, date: today, done: true };
        }
        if (t.step === "Yakunlandi" && allReleased) {
          return { ...t, date: today, done: true };
        }
        return t;
      }),
    };
  });
}

export function openEscrowDispute(escrowId: string): EscrowWorkflow | undefined {
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return persistEscrowUpdate(escrowId, (escrow) => ({
    ...escrow,
    status: "disputed",
    timeline: [
      ...escrow.timeline,
      { step: "Nizo ochildi", date: today, done: true },
    ],
    milestones: escrow.milestones.map((m) =>
      m.status === "funded" ? { ...m, status: "disputed" as const } : m,
    ),
  }));
}

export function refundEscrowToClient(escrowId: string): EscrowWorkflow | undefined {
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return persistEscrowUpdate(escrowId, (escrow) => ({
    ...escrow,
    status: "completed",
    milestones: escrow.milestones.map((m) =>
      m.status === "funded" || m.status === "disputed" ? { ...m, status: "released" as const } : m,
    ),
    timeline: [
      ...escrow.timeline,
      { step: "Mijozga qaytarildi", date: today, done: true },
      { step: "Yakunlandi", date: today, done: true },
    ],
  }));
}
