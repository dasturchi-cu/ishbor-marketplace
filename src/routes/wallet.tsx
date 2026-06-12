import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, ShieldCheck, CreditCard, Building2, FileText, RefreshCw, Minus } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { transactions, escrowRecords } from "@/lib/mock-data";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Ishbor" }] }),
  component: WalletPage,
});

function WalletPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "in" | "out" | "fees">("all");

  const filteredTransactions = transactions.filter((t) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "fees") return t.kind === "fee";
    return t.kind === activeFilter;
  });

  const totalEscrow = escrowRecords.filter((r) => r.status === "funded").reduce((sum, r) => sum + r.amount, 0);
  const fundedCount = escrowRecords.filter((r) => r.status === "funded" || r.status === "pending").length;

  return (
    <WorkspaceShell
      eyebrow="Treasury"
      title="Wallet"
      actions={
        <div className="flex gap-2">
          <button className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-default hover:border-primary/20 focus-ring">Withdraw</button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring">
            <Plus className="size-4" /> Top up
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-foreground p-6 text-background md:col-span-2">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full opacity-40"
            style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--color-primary) 50%, transparent), transparent)" }}
          />
          <div className="relative">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-background/50">Available balance</div>
            <div className="font-display mt-2 text-5xl font-extrabold tracking-tight">$14,284<span className="text-3xl text-background/50">.40</span></div>
            <div className="mt-1 text-sm text-background/50">≈ 178,242,500 UZS</div>
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-background/50">In escrow</div>
                <div className="font-display mt-1 text-2xl font-bold text-primary">${totalEscrow.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-background/50">Lifetime earned</div>
                <div className="font-display mt-1 text-2xl font-bold">$184,200</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] font-semibold text-muted-foreground mb-4">Quick transfer</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <ArrowUpRight className="size-5" />, label: "Withdraw" },
              { icon: <CreditCard className="size-5" />, label: "Add funds" },
              { icon: <RefreshCw className="size-5" />, label: "Convert" },
              { icon: <FileText className="size-5" />, label: "Export" },
            ].map(({ icon, label }) => (
              <button key={label} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-3 text-center transition-default hover:border-primary/20 hover:bg-surface focus-ring">
                <div className="grid size-9 place-items-center rounded-xl bg-secondary">{icon}</div>
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Active escrow</h2>
          <span className="rounded-lg bg-secondary/50 px-2.5 py-1 font-mono text-xs font-semibold text-muted-foreground">
            ${totalEscrow.toLocaleString()} in {fundedCount} projects
          </span>
        </div>
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] p-4">
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          <p className="text-sm font-medium text-primary">All funds secured by Ishbor Escrow at Ipoteka-bank</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="divide-y divide-border">
            {escrowRecords.map((record) => (
              <div key={record.id} className="flex items-center gap-4 p-4 transition-default hover:bg-secondary/20">
                <div className={`size-2.5 shrink-0 rounded-full ${
                  record.status === "funded" ? "bg-primary" : record.status === "released" ? "bg-success" : "bg-warning"
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-sm font-semibold">{record.project}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{record.milestone}</div>
                </div>
                <div className="flex items-center gap-2">
                  <GradientAvatar name={record.client} hue={record.clientHue} size={24} />
                  <span className="hidden text-sm text-muted-foreground sm:inline">{record.client}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold">${record.amount.toLocaleString()}</div>
                  <span className={`font-mono text-[10px] font-medium uppercase tracking-widest ${
                    record.status === "funded" ? "text-primary" : record.status === "released" ? "text-success" : "text-warning"
                  }`}>
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Payout methods</h2>
          <button className="text-sm font-medium text-primary transition-default hover:text-primary/80 focus-ring">Add method</button>
        </div>
        <div className="space-y-2">
          {[
            { icon: <CreditCard className="size-5 text-muted-foreground" />, label: "Humo · •••• 4421", badge: "Default", badgeClass: "bg-primary/10 text-primary" },
            { icon: <CreditCard className="size-5 text-muted-foreground" />, label: "Uzcard · •••• 8829", badge: "Verified", badgeClass: "bg-success/10 text-success" },
            { icon: <Building2 className="size-5 text-muted-foreground" />, label: "SWIFT (USD)", badge: "Verified", badgeClass: "bg-success/10 text-success" },
          ].map(({ icon, label, badge, badgeClass }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition-default hover:border-primary/20">
              {icon}
              <div className="flex-1 text-sm font-medium">{label}</div>
              <span className={`font-mono text-[10px] font-semibold uppercase tracking-widest rounded-lg px-2 py-1 ${badgeClass}`}>{badge}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-base font-semibold">Transaction history</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-background/50 p-1">
              {(["all", "in", "out", "fees"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-default focus-ring ${
                    activeFilter === filter ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter === "all" ? "All" : filter === "in" ? "In" : filter === "out" ? "Out" : "Fees"}
                </button>
              ))}
            </div>
            <button className="whitespace-nowrap text-xs font-medium text-primary transition-default hover:text-primary/80 focus-ring">Export CSV</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/40 text-left">
                {["Type", "Reference", "Date", "Status", "Amount"].map((h) => (
                  <th key={h} className={`font-mono px-4 py-2.5 text-[10px] uppercase tracking-widest font-medium text-muted-foreground ${h === "Amount" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="transition-default hover:bg-secondary/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.kind === "in" ? <ArrowDownLeft className="size-4 text-success" /> : t.kind === "out" ? <ArrowUpRight className="size-4 text-muted-foreground" /> : <Minus className="size-4 text-muted-foreground" />}
                      <span className="font-medium">{t.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.project}</td>
                  <td className="font-mono px-4 py-3 text-muted-foreground">{t.date}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono inline-flex rounded-lg px-2 py-1 text-[10px] uppercase tracking-widest font-medium ${
                      t.status === "Completed" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                    }`}>{t.status}</span>
                  </td>
                  <td className={`font-mono px-4 py-3 text-right font-semibold ${t.amount > 0 ? "text-success" : "text-foreground"}`}>
                    {t.amount > 0 ? "+" : ""}${Math.abs(t.amount).toLocaleString()}.00
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </WorkspaceShell>
  );
}
