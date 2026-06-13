const STORAGE_KEY = "ishbor-response-metrics";
const listeners = new Set<() => void>();

export type PendingResponse = {
  conversationId: string;
  messageId: string;
  receivedAt: number;
  respondedAt?: number;
};

export type UserResponseMetrics = {
  username: string;
  pending: PendingResponse[];
  history: PendingResponse[];
};

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeResponseMetrics(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Record<string, UserResponseMetrics> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, UserResponseMetrics>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, UserResponseMetrics>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getOrCreate(username: string): UserResponseMetrics {
  const all = readAll();
  return all[username] ?? { username, pending: [], history: [] };
}

function persist(username: string, metrics: UserResponseMetrics) {
  const all = readAll();
  all[username] = metrics;
  writeAll(all);
  notify();
}

/** Called when a "them" message arrives for a freelancer. */
export function recordIncomingMessage(
  username: string,
  conversationId: string,
  messageId: string,
): void {
  const metrics = getOrCreate(username);
  metrics.pending.push({ conversationId, messageId, receivedAt: Date.now() });
  persist(username, metrics);
}

/** Called when freelancer sends a reply. */
export function recordOutgoingReply(username: string, conversationId: string): void {
  const metrics = getOrCreate(username);
  const now = Date.now();
  const pendingIdx = metrics.pending.findIndex(
    (p) => p.conversationId === conversationId && !p.respondedAt,
  );
  if (pendingIdx !== -1) {
    const item = { ...metrics.pending[pendingIdx]!, respondedAt: now };
    metrics.pending.splice(pendingIdx, 1);
    metrics.history.push(item);
  }
  persist(username, metrics);
}

export type AggregatedResponseMetrics = {
  totalIncoming: number;
  respondedWithin24h: number;
  medianMinutes: number | null;
};

export function getResponseMetrics(username: string): AggregatedResponseMetrics {
  const metrics = getOrCreate(username);
  const all = [...metrics.history, ...metrics.pending.filter((p) => p.respondedAt).map((p) => p as PendingResponse & { respondedAt: number })];
  const responded = metrics.history.filter((h) => h.respondedAt);
  const totalIncoming = metrics.history.length + metrics.pending.length;

  if (totalIncoming === 0) {
    return { totalIncoming: 0, respondedWithin24h: 0, medianMinutes: null };
  }

  const within24h = responded.filter((h) => {
    const diff = (h.respondedAt! - h.receivedAt) / 60000;
    return diff <= 1440;
  }).length;

  const times = responded.map((h) => (h.respondedAt! - h.receivedAt) / 60000).sort((a, b) => a - b);
  const medianMinutes = times.length > 0 ? times[Math.floor(times.length / 2)]! : null;

  return {
    totalIncoming,
    respondedWithin24h: within24h,
    medianMinutes,
  };
}
