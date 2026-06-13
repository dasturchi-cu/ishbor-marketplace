import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, ShieldCheck, Lock, CreditCard, Building2, Banknote, Download, ListFilter as Filter, ChevronRight, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Clock } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { EscrowShield } from "@/components/site/trust";
import { transactions, escrowItems } from "@/lib/mock-data";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Ishbor" }] }),
  component: WalletPage,
});

const paymentMethods = [
  { id: "pm1", kind: "card", label: "Humo", last4: "4421", isDefault: true, verified: true },
  { id: "pm2", kind: "card", label: "Uzcard", last4: "8829", isDefault: false, verified: true },
  { id: "pm3", kind: "swift", label: "SWIFT USD", last4: null, isDefault: false, verified: true },
];

const txFilters = ["All", "Incoming", "Outgoing", "Fees"];

function WalletPage() {
  const [txFilter, setTxFilter] = useState("All");

  const filteredTx = transactions.filter((t) => {
    if (txFilter === "All") return true;
    if (txFilter === "Incoming") return t.kind === "in";
    if (txFilter === "Outgoing") return t.kind === "out";
    if (txFilter === "Fees") return t.kind === "fee";
    return true;
  });

  const totalEscrow = escrowItems.reduce((s, e) => s + e.amount, 0);

  return (
    <WorkspaceShell
      eyebrow="Treasury"
      title="Wallet"
      actions={
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
            <Download className="size-4" /> Statement
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
            Withdraw
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_oklch(0.546_0.185_257/0.25)] transition-default hover:opacity-95 focus-ring">
            <Plus className="size-4" /> Top up
          </button>
        </div>
      }
    >
      {/* Balance cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Available Balance — hero card */}
        <div className="relative col-span-2 overflow-hidden rounded-2xl bg-foreground p-6 text-background">
          {/* Decorative gradient blobs */}
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
                  Available balance
                </div>
                <div className="font-display mt-2 text-5xl font-extrabold tracking-tight">
                  $14,284
                  <span className="text-3xl text-background/50">.40</span>
                </div>
                <div className="mt-1 text-sm text-background/50">
                  = 178,242,500 UZS
                </div>
              </div>
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-background/10">
                <ShieldCheck className="size-5 text-background" />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-background/50">In escrow</div>
                <div className="font-display mt-1 text-xl font-bold" style={{ color: "oklch(0.7 0.175 257)" }}>
                  ${totalEscrow.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-background/50">Lifetime earned</div>
                <div className="font-display mt-1 text-xl font-bold">$184,200</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-background/50">Pending</div>
                <div className="font-display mt-1 text-xl font-bold">$3,000</div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Payout methods</h3>
            <button className="text-xs font-medium text-primary transition-default hover:opacity-80">Manage</button>
          </div>
          <ul className="space-y-2">
            {paymentMethods.map((pm) => {
              const Icon = pm.kind === "swift" ? Building2 : CreditCard;
              return (
                <li
                  key={pm.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-default ${pm.isDefault ? "border-primary/30 bg-primary/5" : "border-border bg-background"}`}
                >
                  <div className={`inline-flex size-8 items-center justify-center rounded-lg ${pm.isDefault ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold">
                      {pm.label}{pm.last4 ? ` ···· ${pm.last4}` : ""}
                    </div>
                    <div className="font-mono flex items-center gap-1 text-[10px] text-muted-foreground">
                      {pm.verified && <CheckCircle2 className="size-2.5 text-success" />}
                      {pm.isDefault ? "Default" : pm.verified ? "Verified" : "Pending"}
                    </div>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                </li>
              );
            })}
          </ul>
          <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground transition-default hover:border-primary/30 hover:text-primary focus-ring">
            <Plus className="size-4" /> Add payout method
          </button>
        </div>
      </div>

      {/* Escrow overview */}
      <section className="mt-6 rounded-2xl border border-primary/20 bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-primary/10 bg-primary/5 px-5 py-4">
          <div className="flex items-center gap-2">
            <EscrowShield size="md" />
            <h2 className="font-display text-base font-bold">Escrow</h2>
          </div>
          <span className="font-mono text-xs text-primary">${totalEscrow.toLocaleString()} protected</span>
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
                  <div className="font-mono mt-0.5 text-[10px] text-muted-foreground">Due {e.dueDate}</div>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  e.status === "funded" ? "bg-success/10 text-success" :
                  e.status === "pending_release" ? "bg-warning/10 text-warning" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {e.status === "funded" && <CheckCircle2 className="size-3" />}
                  {e.status === "pending_release" && <Clock className="size-3" />}
                  {e.status === "funded" ? "Funded" : "Pending release"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security notice */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <span className="font-semibold">Bank-grade protection.</span>{" "}
          <span className="text-muted-foreground">
            All funds are escrow-protected and held in segregated accounts at Ipoteka-bank.
            Withdrawals are verified via 2FA.
          </span>
        </div>
      </div>

      {/* Transactions */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-base font-bold">Transactions</h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-background p-0.5">
              {txFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setTxFilter(f)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-default ${
                    txFilter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-default hover:border-primary/20 focus-ring">
              <Filter className="size-3.5" /> Filter
            </button>
            <button className="text-xs font-medium text-primary transition-default hover:opacity-80">
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-elevated/30 text-left">
                <th className="font-mono px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Type
                </th>
                <th className="font-mono px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Reference
                </th>
                <th className="font-mono px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Date
                </th>
                <th className="font-mono px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Status
                </th>
                <th className="font-mono px-5 py-3 text-right text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTx.map((t) => (
                <tr key={t.id} className="group transition-default hover:bg-secondary/20">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`inline-flex size-7 items-center justify-center rounded-lg ${
                        t.kind === "in" ? "bg-success/10 text-success" :
                        t.kind === "fee" ? "bg-secondary text-muted-foreground" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {t.kind === "in" ? (
                          <ArrowDownLeft className="size-3.5" />
                        ) : t.kind === "fee" ? (
                          <Banknote className="size-3.5" />
                        ) : (
                          <ArrowUpRight className="size-3.5" />
                        )}
                      </div>
                      <span className="font-medium">{t.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{t.project}</td>
                  <td className="font-mono px-5 py-3.5 text-muted-foreground">{t.date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                      t.status === "Completed"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}>
                      {t.status === "Completed" ? (
                        <CheckCircle2 className="size-2.5" />
                      ) : (
                        <AlertCircle className="size-2.5" />
                      )}
                      {t.status}
                    </span>
                  </td>
                  <td className={`font-mono px-5 py-3.5 text-right font-semibold ${
                    t.amount > 0 ? "text-success" : "text-foreground"
                  }`}>
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
