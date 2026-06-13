import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, MessageCircle, Plus, Shield, TrendingUp, CircleAlert as AlertCircle, ShieldCheck, Lock } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { EscrowShield } from "@/components/site/trust";
import { orders, escrowRecords, hiringPipeline, messages } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Client Dashboard — Ishbor" }] }),
  component: ClientDashboard,
});

function ClientDashboard() {
  const activeOrders = orders.filter((o) => o.status === "in_progress" || o.status === "review");
  const reviewingLeads = hiringPipeline.filter((h) => h.stage === "reviewing");
  const shortlistedLeads = hiringPipeline.filter((h) => h.stage === "shortlisted");
  const interviewLeads = hiringPipeline.filter((h) => h.stage === "interview");
  const offerLeads = hiringPipeline.filter((h) => h.stage === "offer");
  const fundedEscrow = escrowRecords.filter((e) => e.status === "funded" || e.status === "released");
  const totalEscrow = fundedEscrow.reduce((sum, e) => sum + e.amount, 0);

  return (
    <WorkspaceShell
      eyebrow="Client workspace"
      title="Good evening, Sardor."
      actions={
        <button className="touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring sm:w-auto">
          <Plus className="size-4" />
          Post a project
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total spent" value="$184,200" trend="+22% YoY" />
        <StatCard label="In escrow" value="$10,800" trend="Across 3 milestones" accent />
        <StatCard label="Active projects" value="4" trend="2 ending soon" />
        <StatCard label="Avg. hire time" value="1.4h" trend="Faster than 92%" />
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-5">
        <EscrowShield size="md" className="shrink-0" />
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">$10,800</span> is securely held in escrow across 3 active milestones. Funds are released only on your approval.
        </span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-8">
          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
              <h2 className="font-display text-base font-semibold">Active orders</h2>
              <Link to="/projects" className="text-xs font-medium text-primary transition-default hover:text-primary/80">
                View all
              </Link>
            </div>
            <div className="divide-y divide-border">
              {activeOrders.map((order) => (
                <div key={order.id} className="p-4 transition-default hover:bg-secondary/20 sm:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <GradientAvatar name={order.client} hue={order.clientHue} size={40} rounded="rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-sm font-semibold">{order.title}</div>
                      <div className="font-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                        {order.client}
                      </div>
                    </div>
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        order.status === "in_progress"
                          ? "bg-primary/10 text-primary"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {order.status === "in_progress" ? "In Progress" : "In Review"}
                    </span>
                  </div>
                  <div className="mb-4 h-1.5 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:gap-3 sm:text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> Due {order.dueDate}
                      </span>
                      <span>·</span>
                      <span>{order.milestones.length} milestones</span>
                    </div>
                    <div className="font-display text-sm font-semibold">${order.amount.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-4 py-4 sm:px-6">
              <h2 className="font-display text-base font-semibold">Hiring pipeline</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
              {[
                { label: "Reviewing", leads: reviewingLeads },
                { label: "Shortlisted", leads: shortlistedLeads },
                { label: "Interview", leads: interviewLeads },
                { label: "Offer", leads: offerLeads },
              ].map(({ label, leads }) => (
                <div key={label}>
                  <div className="mb-4 flex items-center gap-2">
                    <h3 className="font-display text-xs font-semibold uppercase tracking-widest">{label}</h3>
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-secondary font-mono text-[10px] font-semibold">
                      {leads.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {leads.map((lead) => (
                      <HiringCard key={lead.id} lead={lead} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-8">
          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-4 py-4 sm:px-6">
              <h2 className="font-display text-base font-semibold">Escrow overview</h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-6">
                <div className="eyebrow">In escrow</div>
                <div className="font-display mt-2 text-3xl font-bold">${totalEscrow.toLocaleString()}</div>
                <div className="font-mono mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {fundedEscrow.length} active milestones
                </div>
              </div>
              <div className="space-y-3">
                {fundedEscrow.map((escrow) => (
                  <div key={escrow.id} className="flex items-center gap-3">
                    <div
                      className={`size-2 flex-shrink-0 rounded-full ${
                        escrow.status === "funded" ? "bg-primary" : "bg-success"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{escrow.project}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{escrow.milestone}</div>
                    </div>
                    <div className="font-display text-right text-sm font-semibold">${escrow.amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-start gap-2 rounded-lg border border-border bg-surface p-3">
                <Shield className="mt-0.5 size-4 flex-shrink-0 text-primary" />
                <div>
                  <div className="text-xs font-medium">Escrow protected</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    All funds held securely until milestone completion.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
              <h2 className="font-display text-base font-semibold">Recent messages</h2>
              <Link to="/messages" className="text-xs font-medium text-primary transition-default hover:text-primary/80">
                All
              </Link>
            </div>
            <div className="divide-y divide-border">
              {messages.slice(0, 3).map((msg) => (
                <Link
                  key={msg.id}
                  to="/messages"
                  className="flex items-center gap-3 p-4 transition-default hover:bg-secondary/20"
                >
                  <div className="relative">
                    <GradientAvatar name={msg.name} hue={msg.hue} size={36} />
                    {msg.online && (
                      <div className="absolute bottom-0 right-0 size-2 rounded-full bg-success ring-2 ring-card" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-medium">{msg.name}</div>
                      {msg.unread > 0 && (
                        <span className="inline-flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-semibold text-primary-foreground">
                          {msg.unread}
                        </span>
                      )}
                    </div>
                    <div className="font-mono truncate text-xs text-muted-foreground">{msg.snippet}</div>
                  </div>
                  <div className="font-mono whitespace-nowrap text-[10px] text-muted-foreground">{msg.time}</div>
                </Link>
              ))}
            </div>
            <Link
              to="/messages"
              className="block border-t border-border px-6 py-3 text-center text-xs font-medium text-primary transition-default hover:text-primary/80"
            >
              View all messages
            </Link>
          </section>
        </div>
      </div>
    </WorkspaceShell>
  );
}

function StatCard({ label, value, trend, accent }: { label: string; value: string; trend: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-4 transition-default hover:border-primary/20 hover:bg-surface ${accent ? "border-primary/20 bg-primary/5" : "border-border"}`}>
      <div className="flex items-center gap-2 eyebrow">
        {accent && <Lock className="size-3 text-primary" />}
        {label}
      </div>
      <div className="font-display mt-2 text-3xl font-bold tracking-tight">{value}</div>
      <div className="font-mono mt-1 inline-flex items-center gap-1 text-[11px] text-success">
        <TrendingUp className="size-3" /> {trend}
      </div>
    </div>
  );
}

function HiringCard({ lead }: { lead: (typeof hiringPipeline)[number] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3 transition-default hover:border-primary/20">
      <div className="mb-2 flex items-center gap-2">
        <GradientAvatar name={lead.name} hue={lead.hue} size={28} rounded="rounded-md" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold leading-snug">{lead.name}</div>
        </div>
      </div>
      <div className="mb-2">
        <div className="font-mono truncate text-[9px] uppercase tracking-widest text-muted-foreground">{lead.title}</div>
      </div>
      <div className="flex items-center justify-between">
        <div className="font-display text-xs font-semibold">${lead.rate}/hr</div>
        <div className="font-mono flex items-center gap-0.5 text-[9px] text-muted-foreground">
          <span>★</span>
          <span>{lead.rating.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
