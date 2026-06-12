import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Plus, ShieldCheck } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { transactions } from "@/lib/mock-data";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Ishbor" }] }),
  component: WalletPage,
});

function WalletPage() {
  return (
    <WorkspaceShell
      eyebrow="Treasury"
      title="Wallet"
      actions={
        <div className="flex gap-2">
          <button className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-default hover:border-primary/20 focus-ring">Withdraw</button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring">
            <Plus className="size-4"/> Top up
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-foreground p-6 text-background md:col-span-2">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full opacity-50"
            style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--color-primary) 50%, transparent), transparent)" }}
          />
          <div className="relative">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-background/60">Available balance</div>
            <div className="font-display mt-2 text-5xl font-extrabold tracking-tight">$14,284<span className="text-3xl text-background/60">.40</span></div>
            <div className="mt-1 text-sm text-background/60">≈ 178,242,500 UZS</div>

            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-background/60">In escrow</div>
                <div className="font-display mt-1 text-2xl font-bold text-primary">$3,450</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-background/60">Lifetime earnings</div>
                <div className="font-display mt-1 text-2xl font-bold">$184,200</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="eyebrow">Payout methods</div>
          <ul className="mt-3 space-y-2">
            {[
              { l: "Humo · 4421", v: "Default" },
              { l: "Uzcard · 8829", v: "Verified" },
              { l: "SWIFT · USD", v: "Verified" },
            ].map((p) => (
              <li key={p.l} className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5 text-sm">
                <span className="font-medium">{p.l}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{p.v}</span>
              </li>
            ))}
          </ul>
          <button className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-sm font-medium text-muted-foreground transition-default hover:text-foreground focus-ring">
            <Plus className="size-4"/> Add method
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/8 p-4 text-sm">
        <ShieldCheck className="size-4 text-primary"/>
        All funds are escrow-protected and held in segregated accounts at Ipoteka-bank.
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-lg font-bold">Recent transactions</h2>
          <button className="text-xs font-medium text-primary transition-default hover:text-primary/80">Export CSV</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-elevated/40 text-left text-muted-foreground">
              <th className="font-mono px-4 py-2.5 text-[10px] uppercase tracking-widest font-medium">Type</th>
              <th className="font-mono px-4 py-2.5 text-[10px] uppercase tracking-widest font-medium">Reference</th>
              <th className="font-mono px-4 py-2.5 text-[10px] uppercase tracking-widest font-medium">Date</th>
              <th className="font-mono px-4 py-2.5 text-[10px] uppercase tracking-widest font-medium">Status</th>
              <th className="font-mono px-4 py-2.5 text-right text-[10px] uppercase tracking-widest font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {t.kind === "in" ? (
                      <ArrowDownLeft className="size-3.5 text-success"/>
                    ) : (
                      <ArrowUpRight className="size-3.5 text-muted-foreground"/>
                    )}
                    <span className="font-medium">{t.label}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{t.project}</td>
                <td className="font-mono px-4 py-3 text-muted-foreground">{t.date}</td>
                <td className="px-4 py-3">
                  <span className={`font-mono inline-flex rounded-lg px-2 py-1 text-[10px] uppercase tracking-widest ${
                    t.status === "Completed" ? "bg-primary/15 text-primary" : "bg-warning/15 text-warning"
                  }`}>{t.status}</span>
                </td>
                <td className={`font-mono px-4 py-3 text-right font-semibold ${t.amount > 0 ? "text-success" : "text-foreground"}`}>
                  {t.amount > 0 ? "+" : ""}${Math.abs(t.amount).toLocaleString()}.00
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </WorkspaceShell>
  );
}