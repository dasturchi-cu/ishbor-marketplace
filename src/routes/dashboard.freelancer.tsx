import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  TrendingUp,
  Eye,
  Briefcase,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  MoreHorizontal,
  Target,
  Zap,
  Award,
  ToggleLeft,
  ToggleRight,
  ArrowUpRight,
} from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { orders, applications, reviews } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/freelancer")({
  head: () => ({ meta: [{ title: "Freelancer Dashboard — Ishbor" }] }),
  component: FreelancerDashboard,
});

const earningsData = [
  { month: "Jan", value: 3200, label: "$3.2k" },
  { month: "Feb", value: 4800, label: "$4.8k" },
  { month: "Mar", value: 4100, label: "$4.1k" },
  { month: "Apr", value: 6200, label: "$6.2k" },
  { month: "May", value: 7400, label: "$7.4k" },
  { month: "Jun", value: 8420, label: "$8.4k" },
];
const maxEarnings = Math.max(...earningsData.map((e) => e.value));

const orderStatusConfig = {
  in_progress: { label: "In progress", icon: Clock, color: "text-primary bg-primary/10" },
  review: { label: "Awaiting review", icon: Eye, color: "text-warning bg-warning/10" },
  revision: { label: "Revision", icon: AlertCircle, color: "text-orange-500 bg-orange-500/10" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-success bg-success/10" },
};

const appStatusConfig = {
  pending: { label: "Pending", color: "text-muted-foreground bg-secondary" },
  shortlisted: { label: "Shortlisted", color: "text-primary bg-primary/10" },
  hired: { label: "Hired", color: "text-success bg-success/10" },
  rejected: { label: "Not selected", color: "text-muted-foreground bg-secondary" },
};

function FreelancerDashboard() {
  const [available, setAvailable] = useState(true);

  return (
    <WorkspaceShell
      eyebrow="Freelancer workspace"
      title="Welcome back, Nargiza."
      actions={
        <div className="flex items-center gap-3">
          <button onClick={() => setAvailable((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
            {available ? <ToggleRight className="size-5 text-success" /> : <ToggleLeft className="size-5 text-muted-foreground" />}
            <span className={available ? "text-success" : "text-muted-foreground"}>{available ? "Available" : "Unavailable"}</span>
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_oklch(0.546_0.185_257/0.25)] transition-default hover:opacity-95 focus-ring">
            New listing
          </button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Earnings (30d)", value: "$8,420", trend: "+18% vs last month", icon: TrendingUp, trendUp: true },
          { label: "Active orders", value: String(orders.filter((o) => o.status !== "completed").length), trend: "1 due this week", icon: Briefcase, trendUp: null },
          { label: "Applications", value: String(applications.length), trend: `${applications.filter((a) => a.status === "shortlisted").length} shortlisted`, icon: Target, trendUp: true },
          { label: "Avg. rating", value: "5.0", trend: "184 reviews", icon: Star, trendUp: null },
        ].map((s) => (
          <div key={s.label} className="group rounded-xl border border-border bg-card p-5 transition-default hover:shadow-[0_4px_16px_-4px_oklch(0_0_0/0.08)]">
            <div className="flex items-start justify-between">
              <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
              <div className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/8 text-primary"><s.icon className="size-4" /></div>
            </div>
            <div className="font-display mt-3 text-2xl font-bold tracking-tight">{s.value}</div>
            <div className={`font-mono mt-1 text-[11px] ${s.trendUp ? "text-success" : "text-muted-foreground"}`}>{s.trend}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Earnings</h2>
              <span className="font-mono text-xs text-muted-foreground">Last 6 months</span>
            </div>
            <div className="mb-5 font-display text-3xl font-bold tracking-tight">$34,140<span className="ml-2 font-mono text-sm font-normal text-success">+31% YoY</span></div>
            <div className="flex h-36 items-end gap-2">
              {earningsData.map((d, i) => (
                <div key={d.month} className="group/bar flex flex-1 flex-col items-center gap-1.5">
                  <div className="relative w-full">
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold opacity-0 shadow-sm transition-default group-hover/bar:opacity-100">{d.label}</div>
                    <div className={`w-full rounded-t-md transition-all duration-300 ${i === earningsData.length - 1 ? "bg-primary" : "bg-primary/30 group-hover/bar:bg-primary/50"}`}
                      style={{ height: `${(d.value / maxEarnings) * 100}%`, minHeight: 4 }} />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{d.month}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-base font-bold">Active orders</h2>
              <span className="font-mono text-xs text-muted-foreground">{orders.length} total</span>
            </div>
            <div className="divide-y divide-border">
              {orders.map((o) => {
                const cfg = orderStatusConfig[o.status];
                const StatusIcon = cfg.icon;
                const done = o.milestones.filter((m) => m.done).length;
                const total = o.milestones.length;
                return (
                  <div key={o.id} className="px-5 py-4 transition-default hover:bg-secondary/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <GradientAvatar name={o.client} hue={o.clientHue} size={36} rounded="rounded-lg" />
                        <div>
                          <div className="text-sm font-semibold leading-tight">{o.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{o.client}</div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${cfg.color}`}><StatusIcon className="size-3" />{cfg.label}</span>
                        <button className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-default hover:bg-secondary focus-ring"><MoreHorizontal className="size-4" /></button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between text-[11px]">
                          <span className="font-mono text-muted-foreground">Milestones</span>
                          <span className="font-semibold">{done}/{total}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(done / total) * 100}%` }} />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold">${o.amount.toLocaleString()}</div>
                        <div className={`font-mono mt-0.5 text-[10px] ${o.daysLeft <= 3 ? "text-error" : "text-muted-foreground"}`}>{o.daysLeft}d left</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-base font-bold">Applications</h2>
              <Link to="/projects" className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-default hover:opacity-80">Browse projects <ChevronRight className="size-3" /></Link>
            </div>
            <div className="divide-y divide-border">
              {applications.map((a) => {
                const cfg = appStatusConfig[a.status];
                return (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 transition-default hover:bg-secondary/20">
                    <GradientAvatar name={a.client} hue={a.clientHue} size={36} rounded="rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{a.projectTitle}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{a.client}</span><span className="text-border">·</span><span>{a.appliedAgo}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold">${a.bid.toLocaleString()}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">Your bid</div>
                      </div>
                      <span className={`font-mono inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display mb-4 text-base font-bold">Performance</h2>
            <div className="space-y-4">
              {[
                { label: "Job success score", value: 98, display: "98%", color: "bg-success" },
                { label: "On-time delivery", value: 96, display: "96%", color: "bg-primary" },
                { label: "Response rate", value: 100, display: "100%", color: "bg-primary" },
              ].map((m) => (
                <div key={m.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">{m.label}</span>
                    <span className="font-mono font-bold">{m.display}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className={`h-full rounded-full transition-all duration-700 ${m.color}`} style={{ width: `${m.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5">
              <div className="text-center">
                <div className="font-display text-xl font-bold">124</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">Completed jobs</div>
              </div>
              <div className="text-center">
                <div className="font-display text-xl font-bold">$184k</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">Total earned</div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-base font-bold">Recent reviews</h2>
            </div>
            <div className="divide-y divide-border">
              {reviews.map((r) => (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <GradientAvatar name={r.author} hue={r.authorHue} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{r.author}</span>
                        <span className="font-mono shrink-0 text-[10px] text-muted-foreground">{r.date}</span>
                      </div>
                      <div className="mt-0.5 flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`size-3 ${i < r.rating ? "fill-[oklch(0.78_0.15_75)] text-[oklch(0.78_0.15_75)]" : "text-border"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">{r.body}</p>
                  <div className="mt-2 text-[10px] font-medium text-muted-foreground">{r.project}</div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3">
              <Link to="/freelancers/$username" params={{ username: "nargiza" }}
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary transition-default hover:opacity-80">
                View all reviews <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </WorkspaceShell>
  );
}
