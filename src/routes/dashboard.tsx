import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, MoreHorizontal, Plus, TrendingUp } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { projects, freelancers } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Client Dashboard — Ishbor" }] }),
  component: ClientDashboard,
});

function ClientDashboard() {
  return (
    <WorkspaceShell
      eyebrow="Client workspace"
      title="Good evening, Sardor."
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring">
          <Plus className="size-4" /> Post a project
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active projects", value: "4", trend: "+1 this week" },
          { label: "In escrow", value: "$12,840", trend: "Across 3 contracts" },
          { label: "Total spent", value: "$184,200", trend: "+22% YoY" },
          { label: "Avg. hire time", value: "1.4h", trend: "Faster than 92%" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="eyebrow">{s.label}</div>
            <div className="font-display mt-2 text-3xl font-bold tracking-tight">{s.value}</div>
            <div className="font-mono mt-1 inline-flex items-center gap-1 text-[11px] text-success">
              <TrendingUp className="size-3" /> {s.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="font-display text-lg font-bold">Active projects</h2>
            <Link to="/projects" className="text-xs font-medium text-primary transition-default hover:text-primary/80">View all →</Link>
          </div>
          <div className="divide-y divide-border">
            {projects.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 transition-default hover:bg-secondary/30">
                <GradientAvatar name={p.client} hue={p.clientHue} size={40} rounded="rounded-lg" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.title}</div>
                  <div className="font-mono mt-1 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
                    <span>{p.category}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1"><Clock className="size-3"/>{p.duration}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-semibold">${p.budget.toLocaleString()}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {p.proposals} proposals
                  </div>
                </div>
                <button className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-default hover:bg-secondary focus-ring">
                  <MoreHorizontal className="size-4"/>
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-lg font-bold">Recommended talent</h2>
          </div>
          <div className="divide-y divide-border">
            {freelancers.slice(0, 4).map((f) => (
              <Link
                to="/freelancers/$username"
                params={{ username: f.username }}
                key={f.id}
                className="flex items-center gap-3 p-4 transition-default hover:bg-secondary/30"
              >
                <GradientAvatar name={f.name} hue={f.hue} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{f.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{f.title}</div>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground"/>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}