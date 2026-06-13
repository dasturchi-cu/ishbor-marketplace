import type { Order } from "./mock-data";
import { orders as mockOrders } from "./mock-data";

const STORAGE_KEY = "ishbor-user-orders";
const listeners = new Set<() => void>();
let cachedOrders: Order[] | null = null;

function invalidateCache() {
  cachedOrders = null;
}

function notify() {
  invalidateCache();
  listeners.forEach((l) => l());
}

export function subscribeOrders(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStored(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function writeStored(orders: Order[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function buildMerged(): Order[] {
  const stored = readStored();
  const storedIds = new Set(stored.map((o) => o.id));
  return [...stored, ...mockOrders.filter((o) => !storedIds.has(o.id))];
}

export function getAllOrders(): Order[] {
  if (typeof window === "undefined") {
    return buildMerged();
  }
  if (!cachedOrders) {
    cachedOrders = buildMerged();
  }
  return cachedOrders;
}

export function getOrderById(id: string): Order | undefined {
  return getAllOrders().find((o) => o.id === id);
}

export type NewOrderInput = {
  title: string;
  client: string;
  clientHue: number;
  clientSlug?: string;
  freelancer: string;
  freelancerHue: number;
  freelancerUsername?: string;
  amount: number;
  dueDate?: string;
};

export function createOrder(input: NewOrderInput): Order {
  const milestoneAmount = Math.round(input.amount / 2);
  const order: Order = {
    id: `o-${Date.now()}`,
    title: input.title,
    client: input.client,
    clientHue: input.clientHue,
    clientSlug: input.clientSlug,
    freelancer: input.freelancer,
    freelancerHue: input.freelancerHue,
    freelancerUsername: input.freelancerUsername,
    status: "in_progress",
    progress: 0,
    dueDate: input.dueDate ?? "TBD",
    amount: input.amount,
    escrowFunded: false,
    milestones: [
      { label: "Kickoff & discovery", done: false, amount: milestoneAmount },
      { label: "Final delivery", done: false, amount: input.amount - milestoneAmount },
    ],
  };
  const stored = readStored();
  writeStored([order, ...stored]);
  notify();
  return order;
}

export function fundOrderEscrow(orderId: string): Order | undefined {
  const stored = readStored();
  const idx = stored.findIndex((o) => o.id === orderId);
  if (idx === -1) return undefined;
  const updated = { ...stored[idx]!, escrowFunded: true };
  const next = [...stored];
  next[idx] = updated;
  writeStored(next);
  notify();
  return updated;
}
