import { transactions as seedTransactions } from "./mock-data";
import { getAllEscrowWorkflows } from "./escrow-store";
import { getSession } from "./auth";
import { persistRead, persistWrite } from "./store-persist";

const STORAGE_KEY = "ishbor-wallet";
const listeners = new Set<() => void>();
let cache: Map<string, UserWallet> | null = null;

export type TxCategory =
  | "deposit"
  | "withdrawal"
  | "order"
  | "escrow"
  | "fee"
  | "milestone"
  | "refund"
  | "release";

export type WalletTransaction = {
  id: string;
  kind: "in" | "out" | "fee" | "escrow_hold" | "escrow_release";
  category: TxCategory;
  label: string;
  reference: string;
  amount: number;
  date: string;
  status: "Yakunlangan" | "Kutilmoqda" | "Muvaffaqiyatsiz";
  runningBalance: number;
};

export type UserWallet = {
  userId: string;
  available: number;
  escrow: number;
  pending: number;
  lifetimeEarned: number;
  transactions: WalletTransaction[];
};

function notify() {
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribeWallet(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Record<string, UserWallet> {
  if (typeof window === "undefined") return {};
  return persistRead(STORAGE_KEY, {});
}

function writeAll(data: Record<string, UserWallet>) {
  if (typeof window === "undefined") return;
  persistWrite(STORAGE_KEY, data);
}

function today() {
  const uzMonths = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"] as const;
  const d = new Date();
  return `${d.getDate()} ${uzMonths[d.getMonth()]}`;
}

export function formatUsd(amount: number, options?: { signed?: boolean }): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  if (!options?.signed) {
    return amount < 0 ? `-${formatted}` : formatted;
  }
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

const UZ_MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"] as const;

export function formatTxDate(date: string): string {
  if (/^\d{1,2}\s+[a-z]{3}$/i.test(date.trim())) return date;
  const parsed = Date.parse(date);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]}`;
  }
  return date;
}

function seedWallet(userId: string): UserWallet {
  let running = 14284.4;
  const txs: WalletTransaction[] = seedTransactions.map((t) => {
    const entry: WalletTransaction = {
      id: t.id,
      kind: t.kind === "in" ? "in" : t.kind === "fee" ? "fee" : "out",
      category:
        t.kind === "fee" ? "fee"
        : t.label.includes("Yechib olish") ? "withdrawal"
        : t.label.includes("Bosqich") ? "milestone"
        : t.label.includes("Xizmat") || t.label.includes("Buyurtma") ? "order"
        : "deposit",
      label: t.label,
      reference: t.project,
      amount: t.amount,
      date: t.date,
      status: t.status as WalletTransaction["status"],
      runningBalance: Math.round(running * 100) / 100,
    };
    running -= t.amount;
    return entry;
  });
  const escrowHeld = getAllEscrowWorkflows()
    .filter((e) => e.status === "funded" || e.status === "accepted")
    .reduce((s, e) => s + e.amount, 0);
  return {
    userId,
    available: 14284.4,
    escrow: escrowHeld || 10800,
    pending: 3000,
    lifetimeEarned: 184200,
    transactions: txs,
  };
}

function getOrCreate(userId: string): UserWallet {
  if (!cache) {
    cache = new Map(Object.entries(readAll()));
  }
  if (!cache.has(userId)) {
    const seeded = seedWallet(userId);
    cache.set(userId, seeded);
    const all = readAll();
    all[userId] = seeded;
    writeAll(all);
  }
  return cache.get(userId)!;
}

export function getWallet(userId: string): UserWallet {
  return getOrCreate(userId);
}

export function getWalletForSession(): UserWallet | null {
  const session = getSession();
  if (!session) return null;
  return getWallet(session.user.id);
}

function addTx(
  wallet: UserWallet,
  tx: Omit<WalletTransaction, "id" | "runningBalance" | "date"> & { date?: string },
): UserWallet {
  const runningBalance = wallet.available + (tx.kind === "in" || tx.kind === "escrow_release" ? tx.amount : 0)
    - (tx.kind === "out" || tx.kind === "fee" ? Math.abs(tx.amount) : 0);
  const entry: WalletTransaction = {
    ...tx,
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: tx.date ?? today(),
    runningBalance,
    amount: tx.amount,
  };
  return {
    ...wallet,
    transactions: [entry, ...wallet.transactions],
  };
}

function persist(wallet: UserWallet) {
  if (!cache) cache = new Map(Object.entries(readAll()));
  cache.set(wallet.userId, wallet);
  const all = readAll();
  all[wallet.userId] = wallet;
  writeAll(all);
  notify();
}

export function depositFunds(userId: string, amount: number, method: string): UserWallet {
  const w = getOrCreate(userId);
  const fee = Math.round(amount * 0.01);
  let next = { ...w, available: w.available + amount - fee, lifetimeEarned: w.lifetimeEarned + amount };
  next = addTx(next, {
    kind: "in",
    category: "deposit",
    label: "Hamyon to'ldirish",
    reference: method,
    amount,
    status: "Yakunlangan",
  });
  if (fee > 0) {
    next = { ...next, available: next.available - fee };
    next = addTx(next, {
      kind: "fee",
      category: "fee",
      label: "To'ldirish komissiyasi",
      reference: method,
      amount: -fee,
      status: "Yakunlangan",
    });
  }
  persist(next);
  return next;
}

export function withdrawFunds(userId: string, amount: number, method: string): UserWallet | null {
  const w = getOrCreate(userId);
  if (amount <= 0 || amount > w.available) return null;
  let next = { ...w, available: w.available - amount, pending: w.pending + amount };
  next = addTx(next, {
    kind: "out",
    category: "withdrawal",
    label: "Yechib olish",
    reference: method,
    amount: -amount,
    status: "Kutilmoqda",
  });
  persist(next);
  return next;
}

export function holdEscrowFunds(userId: string, amount: number, project: string): UserWallet | null {
  const w = getOrCreate(userId);
  if (amount > w.available) return null;
  let next = { ...w, available: w.available - amount, escrow: w.escrow + amount };
  next = addTx(next, {
    kind: "escrow_hold",
    category: "escrow",
    label: "Eskrou to'ldirildi",
    reference: project,
    amount: -amount,
    status: "Yakunlangan",
  });
  persist(next);
  return next;
}

export function releaseEscrowToFreelancer(userId: string, amount: number, project: string): UserWallet {
  const w = getOrCreate(userId);
  let next = { ...w, available: w.available + amount, lifetimeEarned: w.lifetimeEarned + amount };
  next = addTx(next, {
    kind: "escrow_release",
    category: "release",
    label: "Bosqich mablag'i chiqarildi",
    reference: project,
    amount,
    status: "Yakunlangan",
  });
  persist(next);
  return next;
}

export function deductEscrowHeld(userId: string, amount: number, project: string): UserWallet {
  const w = getOrCreate(userId);
  let next = { ...w, escrow: Math.max(0, w.escrow - amount) };
  persist(next);
  return next;
}

export function addOrderPayment(userId: string, amount: number, project: string, feeRate = 0.05): UserWallet | null {
  return holdEscrowFunds(userId, amount + Math.round(amount * feeRate), project);
}

export type TxFilter = "All" | "Incoming" | "Outgoing" | "Fees" | "Escrow";

export function processEscrowMilestoneRelease(
  clientUserId: string,
  freelancerUserId: string,
  amount: number,
  project: string,
): void {
  deductEscrowHeld(clientUserId, amount, project);
  releaseEscrowToFreelancer(freelancerUserId, amount, project);
}

export function filterTransactions(txs: WalletTransaction[], filter: TxFilter): WalletTransaction[] {
  if (filter === "All") return txs;
  if (filter === "Incoming") return txs.filter((t) => t.kind === "in" || t.kind === "escrow_release");
  if (filter === "Outgoing") return txs.filter((t) => t.kind === "out" || t.kind === "escrow_hold");
  if (filter === "Fees") return txs.filter((t) => t.kind === "fee");
  if (filter === "Escrow") return txs.filter((t) => t.category === "escrow" || t.category === "release");
  return txs;
}
