import { messages as seedConversations } from "./mock-data";
import { getSession } from "./auth";
import { recordIncomingMessage, recordOutgoingReply } from "./response-metrics-store";

const STORAGE_PREFIX = "ishbor-messages";
const listeners = new Set<() => void>();
let cache: Map<string, MessagesState> = new Map();

export type MessageType = "text" | "offer" | "escrow" | "file";

export type ThreadMessage = {
  id: string;
  from: "me" | "them";
  body?: string;
  time: string;
  timestampMs?: number;
  type: MessageType;
  read?: boolean;
  readAt?: string;
  offer?: {
    title: string;
    amount: number;
    duration: string;
    state?: "pending" | "accepted" | "declined" | "expired";
    orderId?: string;
  };
  escrow?: { event: string; amount: number; project: string };
  file?: { name: string; size: string; kind: "pdf" | "image" };
};

export type Conversation = {
  id: string;
  name: string;
  hue: number;
  snippet: string;
  time: string;
  unread: number;
  online: boolean;
  archived: boolean;
  pinned: boolean;
  lastSeenAt?: string;
  typingUntil?: number;
  projectContext?: string;
  escrowAmount?: number;
  participantUsername?: string;
  participantHue?: number;
};

export type MessagesState = {
  conversations: Conversation[];
  threads: Record<string, ThreadMessage[]>;
};

const seedThread: ThreadMessage[] = [
  { id: "t1", from: "them", type: "text", body: "Dashboard uchun uchta yo'nalish bo'yicha tadqiqotlar tayyorladim. Qo'ng'iroqda ularni ko'rib chiqaylikmi?", time: "10:12" },
  { id: "t2", from: "me", type: "text", body: "Ha, iltimos — payshanba 15:00 Toshkent vaqti bo'ladimi?", time: "10:14" },
  { id: "t3", from: "them", type: "text", body: "A'lo. Figma havolasi bilan kalendar taklifini yuboraman.", time: "10:15" },
  { id: "t4", from: "them", type: "file", body: "Yo'nalish tadqiqotlari:", time: "10:16", file: { name: "Dashboard_Explorations_v3.pdf", size: "4.2 MB", kind: "pdf" } },
  { id: "t5", from: "them", type: "offer", time: "10:18", offer: { title: "Fintech App Redesign — 2-bosqich", amount: 4000, duration: "3 hafta", state: "pending" } },
  { id: "t6", from: "them", type: "escrow", time: "10:22", escrow: { event: "Bosqich to'ldirildi", amount: 4000, project: "Fintech App Redesign" } },
  { id: "t7", from: "me", type: "text", body: "Juda yaxshi. Taklifni hozir qabul qilaman.", time: "10:24" },
];

function seedState(): MessagesState {
  return {
    conversations: seedConversations.map((c) => ({
      ...c,
      archived: false,
      pinned: c.id === "m1",
      projectContext: c.id === "m1" ? "Fintech App Redesign" : undefined,
      escrowAmount: c.id === "m1" ? 12000 : undefined,
      participantUsername: c.id === "m1" ? "nargiza" : c.id === "m3" ? "azamat" : undefined,
    })),
    threads: { m1: seedThread },
  };
}

function notify() {
  conversationsSnapshot = null;
  listeners.forEach((l) => l());
}

function storageKey(userId?: string): string {
  const uid = userId ?? getSession()?.user.id ?? "guest";
  return `${STORAGE_PREFIX}-${uid}`;
}

function uniqueMsgId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

let conversationsSnapshot: { state: MessagesState; list: Conversation[] } | null = null;

export function subscribeMessages(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readState(userId?: string): MessagesState | null {
  if (typeof window === "undefined") return null;
  const key = storageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as MessagesState;
    const legacy = localStorage.getItem(STORAGE_PREFIX);
    if (legacy && userId) {
      localStorage.setItem(key, legacy);
      return JSON.parse(legacy) as MessagesState;
    }
    return null;
  } catch {
    return null;
  }
}

function writeState(state: MessagesState, userId?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(state));
}

export function getMessagesState(): MessagesState {
  if (typeof window === "undefined") return seedState();
  const uid = getSession()?.user.id ?? "guest";
  if (!cache.has(uid)) {
    cache.set(uid, readState(uid) ?? seedState());
  }
  return cache.get(uid)!;
}

function persist(state: MessagesState) {
  const uid = getSession()?.user.id ?? "guest";
  cache.set(uid, state);
  writeState(state, uid);
  notify();
}

function updateConversationMeta(
  conversations: Conversation[],
  conversationId: string,
  snippet: string,
): Conversation[] {
  return conversations.map((c) =>
    c.id === conversationId ? { ...c, snippet: snippet.slice(0, 60), time: "Hozir" } : c,
  );
}

const EMPTY_THREAD: ThreadMessage[] = [];

export function getConversations(includeArchived = false): Conversation[] {
  return getConversationsByInbox(includeArchived ? "all" : "active");
}

export type ConversationInbox = "active" | "archived" | "all";

export function getConversationsByInbox(inbox: ConversationInbox = "active"): Conversation[] {
  const state = getMessagesState();
  if (
    conversationsSnapshot &&
    conversationsSnapshot.state === state &&
    inbox === "active"
  ) {
    return conversationsSnapshot.list;
  }
  const list = state.conversations.filter((c) => {
    if (inbox === "all") return true;
    if (inbox === "archived") return c.archived;
    return !c.archived;
  });
  const sorted =
    inbox === "active"
      ? [...list].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
      : [...list];
  if (inbox === "active") {
    conversationsSnapshot = { state, list: sorted };
  }
  return sorted;
}

export function getThread(conversationId: string): ThreadMessage[] {
  return getMessagesState().threads[conversationId] ?? EMPTY_THREAD;
}

export function nowTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function sendMessage(conversationId: string, body: string): ThreadMessage {
  const state = getMessagesState();
  const now = Date.now();
  const msg: ThreadMessage = { id: uniqueMsgId(), from: "me", type: "text", body, time: nowTime(), timestampMs: now, read: false };
  const threads = { ...state.threads, [conversationId]: [...(state.threads[conversationId] ?? []), msg] };
  const conversations = state.conversations.map((c) =>
    c.id === conversationId ? { ...c, snippet: body.slice(0, 60), time: "Hozir", lastSeenAt: new Date(now).toISOString(), online: true } : c,
  );
  persist({ conversations, threads });
  const session = getSession();
  if (session?.user.username) {
    recordOutgoingReply(session.user.username, conversationId);
  }
  return msg;
}

export function receiveMessage(conversationId: string, body: string, fromName?: string): ThreadMessage {
  const state = getMessagesState();
  const now = Date.now();
  const msg: ThreadMessage = { id: uniqueMsgId(), from: "them", type: "text", body, time: nowTime(), timestampMs: now };
  const threads = { ...state.threads, [conversationId]: [...(state.threads[conversationId] ?? []), msg] };
  const conversations = state.conversations.map((c) =>
    c.id === conversationId ? { ...c, snippet: body.slice(0, 60), time: "Hozir", unread: c.unread + 1 } : c,
  );
  persist({ conversations, threads });
  const conv = state.conversations.find((c) => c.id === conversationId);
  const session = getSession();
  if (session?.user.username && conv?.participantUsername !== session.user.username) {
    recordIncomingMessage(session.user.username, conversationId, msg.id);
  }
  return msg;
}

export function attachFile(conversationId: string, file: { name: string; size: string; kind: "pdf" | "image" }): ThreadMessage {
  const state = getMessagesState();
  const snippet = `📎 ${file.name}`;
  const msg: ThreadMessage = { id: uniqueMsgId(), from: "me", type: "file", time: nowTime(), file };
  const threads = { ...state.threads, [conversationId]: [...(state.threads[conversationId] ?? []), msg] };
  persist({ conversations: updateConversationMeta(state.conversations, conversationId, snippet), threads });
  return msg;
}

export function sendOffer(conversationId: string, offer: { title: string; amount: number; duration: string }): ThreadMessage {
  const state = getMessagesState();
  const snippet = `Taklif: ${offer.title}`;
  const msg: ThreadMessage = {
    id: uniqueMsgId(),
    from: "me",
    type: "offer",
    time: nowTime(),
    offer: { ...offer, state: "pending" },
  };
  const threads = { ...state.threads, [conversationId]: [...(state.threads[conversationId] ?? []), msg] };
  persist({ conversations: updateConversationMeta(state.conversations, conversationId, snippet), threads });
  return msg;
}

export function fundEscrowMessage(conversationId: string, amount: number, project: string): ThreadMessage {
  const state = getMessagesState();
  const snippet = `Eskrou: $${amount.toLocaleString()}`;
  const msg: ThreadMessage = {
    id: uniqueMsgId(),
    from: "me",
    type: "escrow",
    time: nowTime(),
    escrow: { event: "Bosqich to'ldirildi", amount, project },
  };
  const threads = { ...state.threads, [conversationId]: [...(state.threads[conversationId] ?? []), msg] };
  persist({ conversations: updateConversationMeta(state.conversations, conversationId, snippet), threads });
  return msg;
}

export function updateOfferState(
  conversationId: string,
  messageId: string,
  state: "pending" | "accepted" | "declined" | "expired",
  orderId?: string,
): void {
  const s = getMessagesState();
  const thread = (s.threads[conversationId] ?? []).map((m) =>
    m.id === messageId && m.offer ? { ...m, offer: { ...m.offer, state, orderId } } : m,
  );
  persist({ ...s, threads: { ...s.threads, [conversationId]: thread } });
}

export function markConversationRead(conversationId: string): void {
  const state = getMessagesState();
  const now = new Date().toISOString();
  const thread = (state.threads[conversationId] ?? []).map((m) =>
    m.from === "them" && !m.read ? { ...m, read: true, readAt: now } : m,
  );
  persist({
    conversations: state.conversations.map((c) =>
      c.id === conversationId ? { ...c, unread: 0, lastSeenAt: now } : c,
    ),
    threads: { ...state.threads, [conversationId]: thread },
  });
}

export function markMessageRead(conversationId: string, messageId: string): void {
  const state = getMessagesState();
  const now = new Date().toISOString();
  const thread = (state.threads[conversationId] ?? []).map((m) =>
    m.id === messageId ? { ...m, read: true, readAt: now } : m,
  );
  persist({ ...state, threads: { ...state.threads, [conversationId]: thread } });
}

export function setTyping(conversationId: string, typing = true): void {
  const state = getMessagesState();
  const typingUntil = typing ? Date.now() + 3000 : undefined;
  persist({
    ...state,
    conversations: state.conversations.map((c) =>
      c.id === conversationId ? { ...c, typingUntil } : c,
    ),
  });
}

export function isTyping(conversationId: string): boolean {
  const conv = getMessagesState().conversations.find((c) => c.id === conversationId);
  return !!conv?.typingUntil && conv.typingUntil > Date.now();
}

export function setOnlineStatus(conversationId: string, online = true): void {
  const state = getMessagesState();
  persist({
    ...state,
    conversations: state.conversations.map((c) =>
      c.id === conversationId ? { ...c, online, lastSeenAt: online ? new Date().toISOString() : c.lastSeenAt } : c,
    ),
  });
}

export function getLastSeen(conversationId: string): string | undefined {
  return getMessagesState().conversations.find((c) => c.id === conversationId)?.lastSeenAt;
}

export function formatLastSeen(iso?: string): string {
  if (!iso) return "Noma'lum";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "Hozir onlayn";
  if (diff < 3600000) return `${Math.round(diff / 60000)} daqiqa oldin`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)} soat oldin`;
  return new Date(iso).toLocaleDateString("uz-UZ");
}

export function archiveConversation(conversationId: string, archived = true): void {
  const state = getMessagesState();
  persist({
    ...state,
    conversations: state.conversations.map((c) =>
      c.id === conversationId ? { ...c, archived } : c,
    ),
  });
}

export function pinConversation(conversationId: string, pinned = true): void {
  const state = getMessagesState();
  persist({
    ...state,
    conversations: state.conversations.map((c) =>
      c.id === conversationId ? { ...c, pinned } : c,
    ),
  });
}

export function getTotalUnread(): number {
  return getConversations().reduce((s, c) => s + c.unread, 0);
}

export function searchConversations(query: string, inbox: ConversationInbox = "active"): Conversation[] {
  const q = query.trim().toLowerCase();
  const list = getConversationsByInbox(inbox);
  if (!q) return list;
  const state = getMessagesState();
  return list.filter((c) => {
    if (c.name.toLowerCase().includes(q) || c.snippet.toLowerCase().includes(q)) return true;
    const thread = state.threads[c.id] ?? [];
    return thread.some((m) => m.body?.toLowerCase().includes(q));
  });
}

export function getActiveConversationId(): string {
  return getConversations()[0]?.id ?? "m1";
}

export function getCurrentUserConversationContext() {
  return getSession()?.user;
}
