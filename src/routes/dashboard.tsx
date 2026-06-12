import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Clock,
  Plus,
  TrendingUp,
  DollarSign,
  Briefcase,
  Lock,
  Users,
  MoreHorizontal,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { projects, freelancers, messages, escrowItems, teamActivity } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Client Dashboard — Ishbor" }] }),
  component: ClientDashboard,
});

const hiringPipeline = [
  { stage: "Sourcing", count: 3, color: "bg-secondary" },
  { stage: "Reviewing", count: 12, color: "bg-primary/30" },
  { stage: "Shortlisted", count: 5, color: "bg-primary/60" },
  { stage: "Hired", count: 2, color: "bg-primary" },
];

const projectStatusConfig = {
  active: { label: "Active", dot: "bg-success", text: "text-success", bg: "bg-success/10" },
  review: { label: "In Review", dot: "bg-warning", text: "text-warning", bg: "bg-warning/10" },
  draft: { label: "Draft", dot: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-secondary" },
};

const enrichedProjects = [
  { ...projects[0], status: "active" as const, spent: 4000 },
  { ...projects[1], status: "review" as const, spent: 3500 },
  { ...projects[3], status: "active" as const, spent: 1650 },
  { ...projects[2], status: "draft" as const, spent: 0 },
];

function StatusBadge({ status }: { status: keyof typeof projectStatusConfig }) {
  const c = projectStatusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${c.bg} ${c.text}`}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function ClientDashboard() {
  const totalEscrow = escrowItems.reduce((s, e) => s + e.amount, 0);

  return (
    <WorkspaceShell
      eyebrow="Client workspace"
      title="Good morning, Sardor."
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_oklch(0.546_0.185_257/0.25)] transition-default hover:opacity-95 focus-ring">
          <Plus className="size-4" /> Post a project
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total spent", value: "$184,200", trend: "+22% YoY", trendUp: true, icon: DollarSign },
          { label: "Active projects", value: "4", trend: "+1 this week", trendUp: true, icon: Briefcase },
          { label: "In escrow", value: `$${totalEscrow.toLocaleString()}`, trend: "Across 3 contracts", trendUp: null, icon: Lock },
          { label: "Avg. hire time", value: "1.4h", trend: "Faster than 92%", trendUp: true, icon: Users },
        ].map((s) => (
          <div key={s.label} className="group rounded-xl border border-border bg-card p-5 transition-default hover:shadow-[0_4px_16px_-4px_oklch(0_0_0/0.08)]">
            <div className="flex items-start justify-between">
              <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
              <div className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/8 text-primary">
                <s.icon className="size-4" />
              </div>
            </div>
            <div className="font-display mt-3 text-2xl font-bold tracking-tight">{s.value}</div>
            <div className="mt-1 flex items-center gap-1.5">
              {s.trendUp !== null && <TrendingUp className={`size-3 ${s.trendUp ? "text-success" : "text-muted-foreground"}`} />}
              <span className={`font-mono text-[11px] ${s.trendUp ? "text-success" : "text-muted-foreground"}`}>{s.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-base font-bold">Active projects</h2>
              <Link to="/projects" className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-default hover:opacity-80">
                View all <ChevronRight className="size-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {enrichedProjects.map((p) => (
                <div key={p.id} className="group flex items-center gap-4 px-5 py-3.5 transition-default hover:bg-secondary/20">
                  <GradientAvatar name={p.client} hue={p.clientHue} size={38} rounded="rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{p.category}</span><span className="text-border">·</span><Clock className="size-3" /><span>{p.duration}</span>
                    </div>
                  </div>
                  <div className="hidden items-center gap-4 sm:flex">
                    <StatusBadge status={p.status} />
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold">${p.budget.toLocaleString()}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{p.proposals} proposals</div>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-default hover:bg-secondary focus-ring">
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Hiring pipeline</h2>
              <span className="font-mono text-xs text-muted-foreground">22 total candidates</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {hiringPipeline.map((stage, i) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{stage.stage}</span>
                    <span className="font-mono text-xs font-semibold">{stage.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className={`h-full rounded-full transition-all duration-500 ${stage.color}`} style={{ width: `${(stage.count / 12) * 100}%` }} />
                  </div>
                  {i < 3 && (
                    <div className="hidden items-center gap-1 text-[10px] text-muted-foreground sm:flex">
                      <ArrowUpRight className="size-3" />
                      <span>{Math.round((hiringPipeline[i + 1].count / stage.count) * 100)}% advance</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-4">
              {freelancers.slice(0, 4).map((f) => (
                <Link to="/freelancers/$username" params={{ username: f.username }} key={f.id}
                  className="flex items-center gap-2 rounded-lg p-2 text-xs transition-default hover:bg-secondary/40">
                  <GradientAvatar name={f.name} hue={f.hue} size={28} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{f.name.split(" ")[0]}</div>
                    <div className="truncate text-muted-foreground">${f.rate}/h</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-base font-bold">Team activity</h2>
            </div>
            <div className="divide-y divide-border">
              {teamActivity.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3 transition-default hover:bg-secondary/20">
                  <GradientAvatar name={a.actor} hue={a.actorHue} size={32} />
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold">{a.actor}</span>
                    <span className="text-muted-foreground"> {a.action} on </span>
                    <span className="font-medium">{a.project}</span>
                  </div>
                  <span className="font-mono shrink-0 text-[10px] text-muted-foreground">{a.time}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-base font-bold">Escrow</h2>
              <Lock className="size-4 text-muted-foreground" />
            </div>
            <div className="p-5">
              <div className="text-center">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Total protected</div>
                <div className="font-display mt-1 text-3xl font-bold tracking-tight text-primary">${totalEscrow.toLocaleString()}</div>
                <div className="mt-1 text-xs text-muted-foreground">Held at Ipoteka-bank</div>
              </div>
              <div className="mt-5 space-y-3">
                {escrowItems.map((e) => (
                  <div key={e.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold">{e.project}</div>
                        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{e.milestone}</div>
                      </div>
                      <div className="shrink-0 font-mono text-sm font-bold">${e.amount.toLocaleString()}</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`font-mono inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${e.status === "funded" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {e.status === "funded" ? <CheckCircle2 className="size-2.5" /> : <AlertCircle className="size-2.5" />}
                        {e.status === "funded" ? "Funded" : "Pending release"}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">Due {e.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/wallet" className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground transition-default hover:text-foreground hover:border-primary/20 focus-ring">
                View wallet <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-base font-bold">Messages</h2>
              <Link to="/messages" className="text-xs font-medium text-primary transition-default hover:opacity-80">Open inbox</Link>
            </div>
            <div className="divide-y divide-border">
              {messages.slice(0, 4).map((m) => (
                <Link to="/messages" key={m.id} className="flex items-center gap-3 px-5 py-3 transition-default hover:bg-secondary/20">
                  <div className="relative shrink-0">
                    <GradientAvatar name={m.name} hue={m.hue} size={36} />
                    {m.online && <span className="absolute bottom-0 right-0 size-2 rounded-full bg-success ring-1.5 ring-card" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${m.unread > 0 ? "font-semibold" : "font-medium"}`}>{m.name}</span>
                      <span className="font-mono shrink-0 text-[10px] text-muted-foreground">{m.time}</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{m.snippet}</div>
                  </div>
                  {m.unread > 0 && (
                    <span className="font-mono inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{m.unread}</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </WorkspaceShell>
  );
}
