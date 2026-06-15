import type { Order } from "./mock-data";
import { orders as mockOrders } from "./mock-data";
import { recordConversionEvent } from "./conversion-store";
import { recordAnalyticsEvent } from "./analytics-events-store";
import { getEscrowByOrderId, releaseEscrowMilestone } from "./escrow-store";
import { notifyOrderCreated } from "./notification-events";
import { getSession } from "./auth";

const STORAGE_KEY = "ishbor-user-orders";
const EMPTY_ORDERS: Order[] = [];
const listeners = new Set<() => void>();
let cachedOrders: Order[] | null = null;
let cachedStoredOrders: Order[] | null = null;

function invalidateCache() {
  cachedOrders = null;
  cachedStoredOrders = null;
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
  if (typeof window === "undefined") return EMPTY_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : EMPTY_ORDERS;
  } catch {
    return EMPTY_ORDERS;
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
  ownerUserId?: string;
};

export function createOrder(input: NewOrderInput): Order {
  const milestoneAmount = Math.round(input.amount / 2);
  const session = getSession();
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
    ownerUserId: input.ownerUserId ?? session?.user.id,
    milestones: [
      { label: "Kickoff & discovery", done: false, amount: milestoneAmount },
      { label: "Final delivery", done: false, amount: input.amount - milestoneAmount },
    ],
  };
  const stored = readStored();
  writeStored([order, ...stored]);
  notify();
  if (session) {
    notifyOrderCreated(session.user.id, order.title, order.id);
  }
  return order;
}

export function readStoredOrders(): Order[] {
  if (cachedStoredOrders === null) {
    cachedStoredOrders = readStored();
  }
  return cachedStoredOrders;
}

export function getOrdersForFreelancer(username: string): Order[] {
  return readStored().filter((o) => o.freelancerUsername === username);
}

export function getOrdersForClient(clientSlug: string, clientName?: string): Order[] {
  return readStored().filter(
    (o) => o.clientSlug === clientSlug || (clientName && o.client === clientName),
  );
}

export function getOrdersForUser(userId: string, username?: string, clientSlug?: string, clientName?: string): Order[] {
  return readStored().filter(
    (o) =>
      o.ownerUserId === userId ||
      (username && o.freelancerUsername === username) ||
      (clientSlug && o.clientSlug === clientSlug) ||
      (clientName && o.client === clientName),
  );
}

export function updateOrderStatus(
  orderId: string,
  status: Order["status"],
  progress?: number,
): Order | undefined {
  const stored = readStored();
  const idx = stored.findIndex((o) => o.id === orderId);
  if (idx === -1) return undefined;
  const updated: Order = {
    ...stored[idx]!,
    status,
    progress: progress ?? stored[idx]!.progress,
    completedAt: status === "completed" ? new Date().toISOString() : stored[idx]!.completedAt,
  };
  const next = [...stored];
  next[idx] = updated;
  writeStored(next);
  notify();
  if (status === "completed") {
    recordConversionEvent("order_completed", orderId, updated.amount);
    recordAnalyticsEvent({ type: "order_completed", entityId: orderId, value: updated.amount });
  }
  return updated;
}

export function rehydrateFromStorage() {
  notify();
}

export function fundOrderEscrow(orderId: string): Order | undefined {
  const stored = readStored();
  let idx = stored.findIndex((o) => o.id === orderId);
  if (idx === -1) {
    const mock = mockOrders.find((o) => o.id === orderId);
    if (!mock || mock.escrowFunded) return mock?.escrowFunded ? mock : undefined;
    const copied = { ...mock, escrowFunded: true };
    writeStored([copied, ...stored]);
    notify();
    return copied;
  }
  if (stored[idx]!.escrowFunded) return stored[idx];
  const updated = { ...stored[idx]!, escrowFunded: true };
  const next = [...stored];
  next[idx] = updated;
  writeStored(next);
  notify();
  return updated;
}

/** Client approves delivery — completes order and releases funded escrow milestones. */
export function approveOrderDelivery(orderId: string): Order | undefined {
  const stored = readStored();
  const idx = stored.findIndex((o) => o.id === orderId);
  if (idx === -1) return undefined;
  const order = stored[idx]!;
  if (order.status === "completed" || order.status === "cancelled") return undefined;

  const milestones = order.milestones.map((m) => ({ ...m, done: true }));
  const updated: Order = {
    ...order,
    milestones,
    status: "completed",
    progress: 100,
    completedAt: new Date().toISOString(),
  };
  const next = [...stored];
  next[idx] = updated;
  writeStored(next);
  notify();

  const escrow = getEscrowByOrderId(orderId);
  if (escrow) {
    for (const m of escrow.milestones) {
      if (m.status === "funded") {
        releaseEscrowMilestone(escrow.id, m.label);
      }
    }
  }

  recordConversionEvent("order_completed", orderId, updated.amount);
  const session = getSession();
  recordAnalyticsEvent({
    type: "order_completed",
    entityId: orderId,
    value: updated.amount,
    meta: {
      projectTitle: order.title,
      userName: session?.user.fullName ?? order.client,
    },
  });
  return updated;
}

export function markOrderInReview(orderId: string): Order | undefined {
  return updateOrderStatus(orderId, "review", Math.max(80, getOrderById(orderId)?.progress ?? 80));
}
