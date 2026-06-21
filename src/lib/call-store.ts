import { getSession } from "./auth";

const STORAGE_KEY = "ishbor-call-history";
const listeners = new Set<() => void>();
let cache: CallRecord[] | null = null;

export type CallType = "voice" | "video";
export type CallStatus = "completed" | "missed" | "declined";

export type CallRecord = {
  id: string;
  userId: string;
  conversationId: string;
  participantName: string;
  type: CallType;
  startedAt: string;
  durationSec: number;
  status: CallStatus;
};

function notify() {
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribeCallHistory(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readAll(): CallRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CallRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(records: CallRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  notify();
}

export function getCallHistory(userId?: string): CallRecord[] {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return [];
  if (!cache) cache = readAll();
  return cache.filter((r) => r.userId === uid).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function getCallsForConversation(conversationId: string, userId?: string): CallRecord[] {
  return getCallHistory(userId).filter((r) => r.conversationId === conversationId);
}

export function saveCallRecord(record: Omit<CallRecord, "id">): CallRecord {
  const entry: CallRecord = { ...record, id: `call-${Date.now()}` };
  const all = readAll();
  writeAll([entry, ...all]);
  return entry;
}

export function formatCallDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m} daqiqa ${s} soniya` : `${s} soniya`;
}
