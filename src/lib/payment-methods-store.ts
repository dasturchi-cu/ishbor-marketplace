import { paymentMethods as seedMethods } from "./mock-data";

const STORAGE_KEY = "ishbor-payment-methods";
const listeners = new Set<() => void>();
let cache: Map<string, StoredPaymentMethod[]> | null = null;

export type PaymentMethodType = "humo" | "uzcard" | "visa";

export type StoredPaymentMethod = {
  id: string;
  type: PaymentMethodType;
  label: string;
  last4: string;
  nickname?: string;
  expiryMonth?: string;
  expiryYear?: string;
  billingAddress?: string;
  default: boolean;
  createdAt: string;
};

export type AddPaymentMethodInput = {
  type: PaymentMethodType;
  cardNumber: string;
  nickname?: string;
  expiryMonth: string;
  expiryYear: string;
  billingAddress?: string;
};

const TYPE_LABELS: Record<PaymentMethodType, string> = {
  humo: "Humo",
  uzcard: "Uzcard",
  visa: "Visa",
};

function notify() {
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribePaymentMethods(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Record<string, StoredPaymentMethod[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredPaymentMethod[]>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, StoredPaymentMethod[]>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function seedForUser(userId: string): StoredPaymentMethod[] {
  return seedMethods.map((pm, i) => ({
    id: `${userId}-pm-${pm.id}`,
    type: pm.type,
    label: pm.label,
    last4: pm.last4,
    default: pm.default,
    createdAt: new Date(Date.now() - i * 86400000 * 30).toISOString(),
  }));
}

export function getPaymentMethods(userId: string): StoredPaymentMethod[] {
  if (!cache) cache = new Map(Object.entries(readAll()));
  const existing = cache.get(userId);
  if (existing) return existing;

  const seeded = seedForUser(userId);
  cache.set(userId, seeded);
  const all = readAll();
  all[userId] = seeded;
  writeAll(all);
  return seeded;
}

function persist(userId: string, methods: StoredPaymentMethod[]) {
  if (!cache) cache = new Map();
  cache.set(userId, methods);
  const all = readAll();
  all[userId] = methods;
  writeAll(all);
  notify();
}

export function addPaymentMethod(userId: string, input: AddPaymentMethodInput): StoredPaymentMethod {
  const methods = getPaymentMethods(userId);
  const digits = input.cardNumber.replace(/\D/g, "");
  const last4 = digits.slice(-4) || "0000";
  const isFirst = methods.length === 0;
  const entry: StoredPaymentMethod = {
    id: `pm-${Date.now()}`,
    type: input.type,
    label: TYPE_LABELS[input.type],
    last4,
    nickname: input.nickname?.trim() || undefined,
    expiryMonth: input.expiryMonth,
    expiryYear: input.expiryYear,
    billingAddress: input.billingAddress?.trim() || undefined,
    default: isFirst,
    createdAt: new Date().toISOString(),
  };
  persist(userId, [entry, ...methods]);
  return entry;
}

export function updatePaymentMethod(
  userId: string,
  id: string,
  patch: Partial<Pick<StoredPaymentMethod, "nickname" | "expiryMonth" | "expiryYear" | "billingAddress">>,
): StoredPaymentMethod | null {
  const methods = getPaymentMethods(userId);
  const idx = methods.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const updated = { ...methods[idx]!, ...patch };
  const next = [...methods];
  next[idx] = updated;
  persist(userId, next);
  return updated;
}

export function deletePaymentMethod(userId: string, id: string): boolean {
  const methods = getPaymentMethods(userId);
  const filtered = methods.filter((m) => m.id !== id);
  if (filtered.length === methods.length) return false;
  if (filtered.length > 0 && !filtered.some((m) => m.default)) {
    filtered[0] = { ...filtered[0]!, default: true };
  }
  persist(userId, filtered);
  return true;
}

export function setDefaultPaymentMethod(userId: string, id: string): boolean {
  const methods = getPaymentMethods(userId);
  if (!methods.some((m) => m.id === id)) return false;
  persist(
    userId,
    methods.map((m) => ({ ...m, default: m.id === id })),
  );
  return true;
}

export function getDefaultPaymentMethod(userId: string): StoredPaymentMethod | null {
  return getPaymentMethods(userId).find((m) => m.default) ?? getPaymentMethods(userId)[0] ?? null;
}

export function formatPaymentMethodLabel(pm: StoredPaymentMethod): string {
  const nick = pm.nickname ? `${pm.nickname} · ` : "";
  return `${nick}${pm.label} ···· ${pm.last4}`;
}
