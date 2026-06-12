import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Eye, MessageSquare, Briefcase } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { projects } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/freelancer")({
  head: () => ({ meta: [{ title: "Freelancer Dashboard — Ishbor" }] }),
  component: FreelancerDashboard,
});

function FreelancerDashboard() {
  return (
    <WorkspaceShell
      eyebrow="Freelancer workspace"
      title="Welcome back, Nargiza."
      actions={
        <button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring">
          New service listing
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Earnings (30d)", value: "$8,420", icon: TrendingUp, trend: "+18%" },
          { label: "Profile views", value: "1,284", icon: Eye, trend: "+34%" },
          { label: "New messages", value: "24", icon: MessageSquare, trend: "8 unread" },
          { label: "Active gigs", value: "3", icon: Briefcase, trend: "1 ending soon" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <s.icon className="size-4"/>
            </div>
            <div className="eyebrow">{s.label}</div>
            <div className="font-display mt-1 text-3xl font-bold tracking-tight">{s.value}</div>
            <div className="font-mono mt-1 text-[11px] text-success">{s.trend}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display mb-4 text-lg font-bold">Earnings · last 6 months</h2>
          <div className="flex h-44 items-end gap-3">
            {[42, 58, 49, 71, 64, 84].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-primary transition-default hover:bg-primary/80"
                  style={{ height: `${h}%` }}
                />
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {["Jan","Feb","Mar","Apr","May","Jun"][i]}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-lg font-bold">Matched projects for you</h2>
          </div>
          <div className="divide-y divide-border">
            {projects.slice(0, 4).map((p) => (
              <div key={p.id} className="p-4 transition-default hover:bg-secondary/30">
                <div className="text-sm font-semibold leading-tight">{p.title}</div>
                <div className="font-mono mt-1 flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
                  <span>{p.category}</span>
                  <span className="text-foreground">${p.budget.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}