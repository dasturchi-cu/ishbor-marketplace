import { getSession } from "./auth";
import { getReferralState } from "./referral-store";
import { recordRevenueEntry } from "./revenue-store";
import { recordAnalyticsEvent } from "./analytics-events-store";

const STORAGE_KEY = "ishbor-credits-wallet";
const listeners = new Set<() => void>();

export type CreditTransaction = {
  id: string;
  type: "add" | "spend" | "refund";
  amount: number;
  reason: string;
  timestamp: string;
  entityId?: string;
  meta?: Record<string, string>;
};

export type UserCreditsWallet = {
  userId: string;
  balance: number;
  transactions: CreditTransaction[];
  migratedReferral: boolean;
};

const EMPTY_WALLETS: Record<string, UserCreditsWallet> = {};
const EMPTY_TRANSACTIONS: CreditTransaction[] = [];
let walletCache: Record<string, UserCreditsWallet> | null = null;
const txSliceCache = new Map<string, CreditTransaction[]>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeCredits(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Record<string, UserCreditsWallet> {
  if (typeof window === "undefined") return EMPTY_WALLETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_WALLETS;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return EMPTY_WALLETS;
    const normalized: Record<string, UserCreditsWallet> = {};
    for (const [userId, wallet] of Object.entries(parsed as Record<string, UserCreditsWallet>)) {
      normalized[userId] = {
        userId: wallet?.userId ?? userId,
        balance: wallet?.balance ?? 0,
        migratedReferral: wallet?.migratedReferral ?? false,
        transactions: Array.isArray(wallet?.transactions) ? wallet.transactions : EMPTY_TRANSACTIONS,
      };
    }
    return normalized;
  } catch {
    return EMPTY_WALLETS;
  }
}

function getSnapshot(): Record<string, UserCreditsWallet> {
  if (walletCache === null) {
    walletCache = { ...readAll() };
  }
  return walletCache;
}

function writeAll(data: Record<string, UserCreditsWallet>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  walletCache = data;
  txSliceCache.clear();
  notify();
}

function resolveWallet(userId: string): UserCreditsWallet {
  const all = getSnapshot();
  const existing = all[userId];
  if (existing) {
    if (!existing.migratedReferral) {
      const ref = getReferralState(userId);
      if (ref && ref.credits > 0) {
        const migrated: UserCreditsWallet = {
          ...existing,
          balance: existing.balance + ref.credits,
          migratedReferral: true,
        };
        all[userId] = migrated;
        return migrated;
      }
    }
    return existing;
  }

  const ref = getReferralState(userId);
  const wallet: UserCreditsWallet = {
    userId,
    balance: ref?.credits ?? 0,
    transactions: EMPTY_TRANSACTIONS,
    migratedReferral: true,
  };
  all[userId] = wallet;
  return wallet;
}

function ensureWallet(userId: string): UserCreditsWallet {
  const wallet = resolveWallet(userId);
  const stored = readAll();
  if (!stored[userId] || !stored[userId]!.migratedReferral) {
    stored[userId] = wallet;
    writeAll(stored);
  }
  return wallet;
}

export function getCreditBalance(userId?: string): number {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return 0;
  return resolveWallet(uid).balance;
}

export function getCreditTransactions(userId?: string, limit = 50): CreditTransaction[] {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return EMPTY_TRANSACTIONS;
  const cacheKey = `${uid}:${limit}`;
  const cached = txSliceCache.get(cacheKey);
  if (cached) return cached;
  const txs = resolveWallet(uid).transactions.slice(0, limit);
  txSliceCache.set(cacheKey, txs);
  return txs;
}

function appendTransaction(
  userId: string,
  tx: Omit<CreditTransaction, "id" | "timestamp">,
): CreditTransaction {
  const all = readAll();
  const wallet = ensureWallet(userId);
  const full: CreditTransaction = {
    ...tx,
    id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  const delta = tx.type === "spend" ? -tx.amount : tx.amount;
  const updated: UserCreditsWallet = {
    ...wallet,
    balance: Math.max(0, wallet.balance + delta),
    transactions: [full, ...wallet.transactions].slice(0, 500),
  };
  all[userId] = updated;
  writeAll(all);
  return full;
}

export function addCredits(
  userId: string,
  amount: number,
  reason: string,
  meta?: Record<string, string>,
): CreditTransaction {
  return appendTransaction(userId, { type: "add", amount, reason, meta });
}

export function spendCredits(
  userId: string,
  amount: number,
  reason: string,
  entityId?: string,
  meta?: Record<string, string>,
): { ok: true; tx: CreditTransaction } | { ok: false; error: string } {
  const wallet = ensureWallet(userId);
  if (wallet.balance < amount) {
    return { ok: false, error: `Yetarli kredit yo'q. Kerak: ${amount.toLocaleString()} UZS, mavjud: ${wallet.balance.toLocaleString()} UZS.` };
  }
  const tx = appendTransaction(userId, { type: "spend", amount, reason, entityId, meta });
  recordAnalyticsEvent({ type: "credit_spent", value: amount, entityId, meta: { reason, ...meta } });
  return { ok: true, tx };
}

export function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  entityId?: string,
): CreditTransaction {
  const tx = appendTransaction(userId, { type: "refund", amount, reason, entityId });
  recordAnalyticsEvent({ type: "credit_refund", value: amount, entityId, meta: { reason } });
  return tx;
}

/** Simulated credit purchase (no real payment) */
export function purchaseCredits(
  userId: string,
  amount: number,
  pricePaid: number,
): { ok: true } | { ok: false; error: string } {
  if (amount <= 0) return { ok: false, error: "Noto'g'ri miqdor." };
  addCredits(userId, amount, "Kredit sotib olish", { pricePaid: String(pricePaid) });
  recordRevenueEntry({
    type: "credit_purchase",
    amount: pricePaid,
    userId,
    meta: { credits: String(amount) },
  });
  recordAnalyticsEvent({ type: "credit_purchase", value: pricePaid, meta: { credits: String(amount) } });
  return { ok: true };
}

export function getCreditSpendTotal(userId?: string, days = 30): number {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return 0;
  const cutoff = Date.now() - days * 86400000;
  return ensureWallet(uid).transactions
    .filter((t) => t.type === "spend" && new Date(t.timestamp).getTime() >= cutoff)
    .reduce((s, t) => s + t.amount, 0);
}

export function getCreditBurnRate(days = 30): number {
  const all = readAll();
  let total = 0;
  const cutoff = Date.now() - days * 86400000;
  for (const w of Object.values(all)) {
    total += w.transactions
      .filter((t) => t.type === "spend" && new Date(t.timestamp).getTime() >= cutoff)
      .reduce((s, t) => s + t.amount, 0);
  }
  return total;
}

export function readAllWallets(): Record<string, UserCreditsWallet> {
  return readAll();
}
