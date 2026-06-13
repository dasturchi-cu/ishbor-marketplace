import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Plus, ShieldCheck, Lock, CreditCard, Building2, Banknote, Download, ChevronRight, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Clock, Crown, Sparkles, Receipt, Share2, Bell } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { EscrowShield } from "@/components/site/trust";
import { InlineBanner, EmptyState } from "@/components/site/feedback";
import { DepositModal, WithdrawModal } from "@/components/site/modals";
import { escrowItems } from "@/lib/mock-data";
import { AuthGate } from "@/components/auth/auth-gate";
import { getPaymentMethods, subscribePaymentMethods, type StoredPaymentMethod } from "@/lib/payment-methods-store";
import { requireAuth } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import {
  subscribeWallet,
  getWallet,
  depositFunds,
  withdrawFunds,
  filterTransactions,
  formatUsd,
  formatTxDate,
  type TxFilter,
  type WalletTransaction,
} from "@/lib/wallet-store";
import { downloadTextFile, toCsvRow } from "@/lib/export-utils";

export const Route = createFileRoute("/wallet")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Hamyon — Ishbor" }] }),
  component: WalletPage,
});

const txFilterLabels: Record<TxFilter, string> = {
  All: "Barchasi",
  Incoming: "Kirim",
  Outgoing: "Chiqim",
  Fees: "To'lovlar",
  Escrow: "Eskrou",
};

const txFilters: TxFilter[] = ["All", "Incoming", "Outgoing", "Fees", "Escrow"];

const EMPTY_PAYMENT_METHODS: StoredPaymentMethod[] = [];

const categoryFilters = ["All", "deposit", "withdrawal", "order", "escrow", "fee", "milestone"] as const;

const categoryFilterLabels: Record<(typeof categoryFilters)[number], string> = {
  All: "Barchasi",
  deposit: "Depozit",
  withdrawal: "Yechib olish",
  order: "Buyurtma",
  escrow: "Eskrou",
  fee: "To'lov",
  milestone: "Bosqich",
};

const statusLabels: Record<string, string> = {
  Yakunlangan: "Yakunlangan",
  Kutilmoqda: "Kutilmoqda",
  Muvaffaqiyatsiz: "Muvaffaqiyatsiz",
};

function TxKindIcon({ tx }: { tx: WalletTransaction }) {
  const iconClass = "size-3.5";
  if (tx.kind === "in" || tx.kind === "escrow_release") {
    return (
      <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
        <ArrowDownLeft className={iconClass} />
      </div>
    );
  }
  if (tx.kind === "fee") {
    return (
      <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Banknote className={iconClass} />
      </div>
    );
  }
  return (
    <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
      <ArrowUpRight className={iconClass} />
    </div>
  );
}

function TxStatusBadge({ status }: { status: WalletTransaction["status"] }) {
  const completed = status === "Yakunlangan";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
        completed ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
      }`}
    >
      {completed ? <CheckCircle2 className="size-2.5" /> : <AlertCircle className="size-2.5" />}
      {statusLabels[status] ?? status}
    </span>
  );
}

function WalletPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [txFilter, setTxFilter] = useState<TxFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState<(typeof categoryFilters)[number]>("All");
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const wallet = useSyncExternalStore(
    subscribeWallet,
    () => (user ? getWallet(user.id) : null),
    () => null,
  );

  const paymentMethods = useSyncExternalStore(
    subscribePaymentMethods,
    () => (user ? getPaymentMethods(user.id) : EMPTY_PAYMENT_METHODS),
    () => EMPTY_PAYMENT_METHODS,
  );

  const filteredTx = (wallet?.transactions ?? []).filter((t) => {
    const kindOk = filterTransactions([t], txFilter).length > 0;
    const catOk = categoryFilter === "All" || t.category === categoryFilter;
    return kindOk && catOk;
  });

  const totalEscrow = wallet?.escrow ?? escrowItems.reduce((s, e) => s + e.amount, 0);
  const available = wallet?.available ?? 0;
  const pending = wallet?.pending ?? 0;
  const lifetime = wallet?.lifetimeEarned ?? 0;
  const [whole, cents = "00"] = available.toFixed(2).split(".");

  const handleExportCsv = () => {
    const rows = filteredTx.length > 0 ? filteredTx : (wallet?.transactions ?? []);
    if (rows.length === 0) {
      toast.error("Eksport qilish uchun tranzaksiyalar yo'q");
      return;
    }
    const header = toCsvRow(["Sana", "Tavsif", "Tur", "Kategoriya", "Summa", "Holat"]);
    const body = rows
      .map((t) =>
        toCsvRow([formatTxDate(t.date), t.label, t.kind, t.category ?? "", formatUsd(t.amount), t.status]),
      )
      .join("\n");
    downloadTextFile(`ishbor-tranzaksiyalar-${new Date().toISOString().slice(0, 10)}.csv`, `${header}\n${body}`);
    toast.success(`${rows.length} ta tranzaksiya eksport qilindi`);
  };

  const handleDownloadReport = () => {
    const rows = wallet?.transactions ?? [];
    const report = [
      "ISHBOR HAMYON HISOBOTI",
      `Sana: ${new Date().toLocaleDateString("uz-UZ")}`,
      `Foydalanuvchi: ${user?.fullName ?? "—"}`,
      "",
      `Mavjud balans: ${formatUsd(available)}`,
      `Eskrou: ${formatUsd(totalEscrow)}`,
      `Kutilmoqda: ${formatUsd(pending)}`,
      `Umumiy daromad: ${formatUsd(lifetime)}`,
      "",
      "SO'NGGI TRANZAKSIYALAR",
      ...rows.slice(0, 20).map((t) => `- ${formatTxDate(t.date)} | ${t.label} | ${formatUsd(t.amount)} | ${t.status}`),
    ].join("\n");
    downloadTextFile(`ishbor-hisobot-${new Date().toISOString().slice(0, 10)}.txt`, report, "text/plain;charset=utf-8");
    toast.success("Hisobot yuklab olindi");
  };

  return (
    <AuthGate>
    <WorkspaceShell
      eyebrow="Xazina"
      title="Hamyon"
      actions={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <button onClick={() => setWithdrawOpen(true)} className="touch-target inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-default hover:border-primary/20 focus-ring sm:flex-none">
            Yechib olish
          </button>
          <button onClick={() => setDepositOpen(true)} className="touch-target inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_oklch(0.546_0.185_257/0.25)] transition-default hover:opacity-95 focus-ring sm:flex-none">
            <Plus className="size-4" /> To'ldirish
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative col-span-full overflow-hidden rounded-2xl bg-foreground p-5 text-background sm:col-span-2 sm:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full opacity-30"
            style={{ background: "radial-gradient(closest-side, oklch(0.67 0.175 257), transparent)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-8 -left-8 size-40 rounded-full opacity-20"
            style={{ background: "radial-gradient(closest-side, oklch(0.67 0.175 257), transparent)" }}
          />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-background/50">
                  Mavjud balans
                </div>
                <div className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                  ${Number(whole).toLocaleString()}
                  <span className="text-2xl text-background/50 sm:text-3xl">.{cents}</span>
                </div>
                <div className="mt-1 text-sm text-background/50">
                  = {Math.round(available * 12500).toLocaleString()} UZS
                </div>
              </div>
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-background/10">
                <ShieldCheck className="size-5 text-background" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/10 pt-4 sm:mt-8 sm:grid-cols-3 sm:pt-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-background/50">Eskrouda</div>
                <div className="font-display mt-1 text-xl font-bold" style={{ color: "oklch(0.7 0.175 257)" }}>
                  ${totalEscrow.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-background/50">Umumiy topilgan</div>
                <div className="font-display mt-1 text-xl font-bold">${lifetime.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-background/50">Kutilmoqda</div>
                <div className="font-display mt-1 text-xl font-bold">${pending.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">To'lov usullari</h3>
            <button onClick={() => navigate({ to: "/settings" })} className="text-xs font-medium text-primary transition-default hover:opacity-80">Boshqarish</button>
          </div>
          <ul className="space-y-2">
            {paymentMethods.map((pm) => {
              const Icon = pm.type === "visa" ? CreditCard : Banknote;
              return (
                <li
                  key={pm.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate({ to: "/settings" })}
                  onKeyDown={(e) => e.key === "Enter" && navigate({ to: "/settings" })}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-default ${pm.default ? "border-primary/30 bg-primary/5" : "border-border bg-background"}`}
                >
                  <div className={`inline-flex size-8 items-center justify-center rounded-lg ${pm.default ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold">
                      {pm.label} ···· {pm.last4}
                    </div>
                    <div className="font-mono flex items-center gap-1 text-[10px] text-muted-foreground">
                      <CheckCircle2 className="size-2.5 text-success" />
                      {pm.default ? "Asosiy" : "Tasdiqlangan"}
                    </div>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                </li>
              );
            })}
          </ul>
          <button
            onClick={() => navigate({ to: "/settings", search: { pay: "add" } })}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground transition-default hover:border-primary/30 hover:text-primary focus-ring"
          >
            <Plus className="size-4" /> To'lov usulini qo'shish
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Link to="/pricing" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-default hover:border-primary/20">
          <div className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Receipt className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Tariflar</div>
            <div className="text-xs text-muted-foreground">Rejalarni solishtirish</div>
          </div>
        </Link>
        <Link to="/subscription" search={{ plan: undefined }} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-default hover:border-primary/20">
          <div className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Crown className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Obuna</div>
            <div className="text-xs text-muted-foreground">Reja va kreditlar</div>
          </div>
        </Link>
        <Link to="/promotions" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-default hover:border-primary/20">
          <div className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Rivojlantirish</div>
            <div className="text-xs text-muted-foreground">Profil va xizmatni ko'tarish</div>
          </div>
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Link to="/settings" search={{ tab: "referral" }} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-default hover:border-primary/20">
          <div className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Share2 className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Referral dasturi</div>
            <div className="text-xs text-muted-foreground">Do'stlarni taklif qiling</div>
          </div>
        </Link>
        <Link to="/settings" search={{ tab: "alerts" }} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-default hover:border-primary/20">
          <div className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bell className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Ish ogohlantirishlari</div>
            <div className="text-xs text-muted-foreground">Yangi loyiha xabarlari</div>
          </div>
        </Link>
        <Link to="/settings" search={{ tab: "verification" }} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-default hover:border-primary/20">
          <div className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Shaxsni tasdiqlash</div>
            <div className="text-xs text-muted-foreground">Ishonch darajasini oshiring</div>
          </div>
        </Link>
      </div>

      <section className="mt-6 rounded-2xl border border-primary/20 bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-primary/10 bg-primary/5 px-5 py-4">
          <div className="flex items-center gap-2">
            <EscrowShield size="md" />
            <h2 className="font-display text-base font-bold">Eskrou</h2>
          </div>
          <span className="font-mono text-xs text-primary">${totalEscrow.toLocaleString()} himoyalangan</span>
        </div>
        <div className="grid gap-0 divide-y divide-border sm:divide-x sm:divide-y-0 sm:grid-cols-3">
          {escrowItems.map((e) => (
            <div key={e.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <GradientAvatar name={e.client} hue={e.clientHue} size={32} rounded="rounded-lg" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{e.project}</div>
                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{e.milestone}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="font-display text-xl font-bold">${e.amount.toLocaleString()}</div>
                  <div className="font-mono mt-0.5 text-[10px] text-muted-foreground">Muddat: {e.dueDate}</div>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  e.status === "funded" ? "bg-success/10 text-success" :
                  e.status === "pending_release" ? "bg-warning/10 text-warning" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {e.status === "funded" && <CheckCircle2 className="size-3" />}
                  {e.status === "pending_release" && <Clock className="size-3" />}
                  {e.status === "funded" ? "Moliyalashtirilgan" : "Chiqarish kutilmoqda"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <InlineBanner variant="info" icon={ShieldCheck} className="mt-4">
        <span className="font-semibold">Bank darajasidagi himoya.</span>{" "}
        <span className="text-muted-foreground">
          Barcha mablag'lar eskrou himoyasida va Ipoteka-bankdagi ajratilgan hisoblarda saqlanadi.
          Yechib olishlar 2FA orqali tasdiqlanadi.
        </span>
      </InlineBanner>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-bold">Tranzaksiyalar</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <span className="font-mono text-foreground">{filteredTx.length}</span> ta yozuv
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadReport}
                className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium transition-default hover:border-primary/20 focus-ring"
              >
                <Download className="size-3.5" /> Hisobot
              </button>
              <button
                onClick={handleExportCsv}
                className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium transition-default hover:border-primary/20 focus-ring"
              >
                <Download className="size-3.5" /> Eksport
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="mobile-scroll-x flex max-w-full gap-1 rounded-lg border border-border bg-background p-1">
              {txFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setTxFilter(f)}
                  className={`touch-target shrink-0 rounded-md px-3 py-2 text-xs font-medium transition-default focus-ring ${
                    txFilter === f
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  {txFilterLabels[f]}
                </button>
              ))}
            </div>

            <div className="mobile-scroll-x flex max-w-full flex-nowrap gap-1.5 sm:flex-nowrap">
              {categoryFilters.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`touch-target shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-default focus-ring ${
                    categoryFilter === c
                      ? "border-primary/25 bg-primary/8 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground"
                  }`}
                >
                  {categoryFilterLabels[c]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredTx.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Banknote}
              title="Tranzaksiyalar topilmadi"
              description="Filtrlarni o'zgartiring yoki hamyonni to'ldiring."
              compact
              action={
                <button
                  onClick={() => {
                    setTxFilter("All");
                    setCategoryFilter("All");
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-default hover:border-primary/20"
                >
                  Filtrlarni tozalash
                </button>
              }
            />
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {filteredTx.map((t) => (
                <article
                  key={t.id}
                  className="rounded-xl border border-border bg-background p-4 transition-default hover:border-primary/15"
                >
                  <div className="flex items-start gap-3">
                    <TxKindIcon tx={t} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{t.label}</div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">{t.reference}</div>
                        </div>
                        <div
                          className={`shrink-0 font-mono text-sm font-semibold ${
                            t.amount > 0 ? "text-success" : "text-foreground"
                          }`}
                        >
                          {formatUsd(t.amount, { signed: true })}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <TxStatusBadge status={t.status} />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {categoryFilterLabels[t.category as keyof typeof categoryFilterLabels] ?? t.category}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">{formatTxDate(t.date)}</span>
                      </div>
                      <div className="mt-2 font-mono text-[10px] text-muted-foreground">
                        Balans: {formatUsd(t.runningBalance)}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-elevated/30 text-left">
                    <th className="font-mono px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Tur</th>
                    <th className="font-mono px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Ma'lumot</th>
                    <th className="font-mono px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Sana</th>
                    <th className="font-mono px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Holat</th>
                    <th className="font-mono px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Toifa</th>
                    <th className="font-mono px-5 py-3 text-right text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Summa</th>
                    <th className="font-mono px-5 py-3 text-right text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Balans</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTx.map((t) => (
                    <tr key={t.id} className="transition-default hover:bg-secondary/20">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <TxKindIcon tx={t} />
                          <span className="font-medium">{t.label}</span>
                        </div>
                      </td>
                      <td className="max-w-[200px] truncate px-5 py-3.5 text-muted-foreground">{t.reference}</td>
                      <td className="font-mono whitespace-nowrap px-5 py-3.5 text-muted-foreground">{formatTxDate(t.date)}</td>
                      <td className="px-5 py-3.5">
                        <TxStatusBadge status={t.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {categoryFilterLabels[t.category as keyof typeof categoryFilterLabels] ?? t.category}
                        </span>
                      </td>
                      <td
                        className={`font-mono whitespace-nowrap px-5 py-3.5 text-right font-semibold ${
                          t.amount > 0 ? "text-success" : "text-foreground"
                        }`}
                      >
                        {formatUsd(t.amount, { signed: true })}
                      </td>
                      <td className="font-mono whitespace-nowrap px-5 py-3.5 text-right text-muted-foreground">
                        {formatUsd(t.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onConfirm={(amount, method) => {
          if (!user) return;
          depositFunds(user.id, amount, method);
          toast.success(`$${amount.toLocaleString()} depozit yakunlandi`);
        }}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        balance={available}
        onConfirm={(amount, method) => {
          if (!user) return;
          const result = withdrawFunds(user.id, amount, method);
          if (!result) {
            toast.error("Mavjud balans yetarli emas");
            return;
          }
          toast.success(`$${amount.toLocaleString()} yechib olish ${method} ga yuborildi`);
        }}
      />
    </WorkspaceShell>
    </AuthGate>
  );
}
