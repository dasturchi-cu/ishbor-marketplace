import { getSession } from "./auth";
import { addNotification } from "./notifications-store";

const STORAGE_KEY = "ishbor-referrals";
const CREDIT_PER_REFERRAL = 50000;
const listeners = new Set<() => void>();
let cache: ReferralState | null = null;

export type ReferralEntry = {
  code: string;
  referredUserId: string;
  referredEmail: string;
  status: "pending" | "completed";
  creditedAt?: string;
  createdAt: string;
};

export type ReferralState = {
  userId: string;
  code: string;
  credits: number;
  referrals: ReferralEntry[];
  referredBy?: string;
};

function notify() {
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribeReferrals(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Record<string, ReferralState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ReferralState>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, ReferralState>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateCode(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "ISH";
  return `${base}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function getReferralState(userId?: string): ReferralState | null {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return null;

  if (cache?.userId === uid) return cache;

  const all = readAll();
  if (all[uid]) {
    cache = all[uid]!;
    return cache;
  }

  const session = getSession();
  const state: ReferralState = {
    userId: uid,
    code: generateCode(session?.user.fullName ?? uid),
    credits: 0,
    referrals: [],
  };
  all[uid] = state;
  writeAll(all);
  cache = state;
  return state;
}

function persist(state: ReferralState) {
  const all = readAll();
  all[state.userId] = state;
  writeAll(all);
  cache = state;
  notify();
}

export function getReferralLink(userId?: string): string {
  const state = getReferralState(userId);
  if (!state || typeof window === "undefined") return "";
  return `${window.location.origin}/register?ref=${state.code}`;
}

export function findReferrerByCode(code: string): ReferralState | null {
  const all = readAll();
  return Object.values(all).find((s) => s.code === code) ?? null;
}

/** Called on registration with ?ref=CODE */
export function applyReferralCode(newUserId: string, newUserEmail: string, code: string): boolean {
  const referrer = findReferrerByCode(code);
  if (!referrer || referrer.userId === newUserId) return false;

  const entry: ReferralEntry = {
    code,
    referredUserId: newUserId,
    referredEmail: newUserEmail,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  persist({
    ...referrer,
    referrals: [entry, ...referrer.referrals],
  });

  const all = readAll();
  all[newUserId] = {
    userId: newUserId,
    code: generateCode(newUserEmail.split("@")[0] ?? "user"),
    credits: 0,
    referrals: [],
    referredBy: referrer.userId,
  };
  writeAll(all);
  return true;
}

/** Complete referral when referred user completes first meaningful action. */
export function completeReferral(referredUserId: string): void {
  const all = readAll();
  const referred = all[referredUserId];
  if (!referred?.referredBy) return;

  const referrer = all[referred.referredBy];
  if (!referrer) return;

  const idx = referrer.referrals.findIndex(
    (r) => r.referredUserId === referredUserId && r.status === "pending",
  );
  if (idx === -1) return;

  const updated = [...referrer.referrals];
  updated[idx] = {
    ...updated[idx]!,
    status: "completed",
    creditedAt: new Date().toISOString(),
  };

  persist({
    ...referrer,
    referrals: updated,
    credits: referrer.credits + CREDIT_PER_REFERRAL,
  });

  void import("./credits-store").then(({ addCredits }) => {
    addCredits(referrer.userId, CREDIT_PER_REFERRAL, "Referral mukofoti", { referredUserId });
  });

  addNotification({
    userId: referrer.userId,
    kind: "system",
    title: "Referral mukofoti",
    body: `Do'stingiz faollashdi! +${CREDIT_PER_REFERRAL.toLocaleString()} UZS kredit qo'shildi.`,
    priority: "high",
    href: "/settings",
  });

  addNotification({
    userId: referredUserId,
    kind: "system",
    title: "Xush kelibsiz bonus",
    body: "Referral orqali qo'shildingiz. Birinchi loyiha yoki xizmat bilan boshlang!",
    priority: "normal",
    href: "/dashboard/freelancer",
  });
}

export function spendReferralCredits(userId: string, amount: number): boolean {
  const state = getReferralState(userId);
  if (!state || state.credits < amount) return false;
  persist({ ...state, credits: state.credits - amount });
  return true;
}

export function addReferralCredits(userId: string, amount: number): void {
  const state = getReferralState(userId);
  if (!state) return;
  persist({ ...state, credits: state.credits + amount });
}

export function getReferralStats(userId?: string) {
  const state = getReferralState(userId);
  if (!state) return { code: "", credits: 0, total: 0, completed: 0, pending: 0 };
  return {
    code: state.code,
    credits: state.credits,
    total: state.referrals.length,
    completed: state.referrals.filter((r) => r.status === "completed").length,
    pending: state.referrals.filter((r) => r.status === "pending").length,
  };
}
