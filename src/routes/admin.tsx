import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, Users, Briefcase, Banknote, AlertTriangle, Search } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { freelancers } from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Ishbor" }] }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <WorkspaceShell eyebrow="Operations" title="Admin">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "GMV (30d)", v: "$842,200", t: "+24%", icon: Banknote, up: true },
          { l: "Active users", v: "14,820", t: "+8%", icon: Users, up: true },
          { l: "Open projects", v: "1,402", t: "+12%", icon: Briefcase, up: true },
          { l: "Disputes", v: "6", t: "-3", icon: AlertTriangle, up: false },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <s.icon className="size-4"/>
            </div>
            <div className="eyebrow">{s.l}</div>
            <div className="font-display mt-1 text-3xl font-bold tracking-tight">{s.v}</div>
            <div className={`font-mono mt-1 inline-flex items-center gap-1 text-[11px] ${s.up ? "text-success" : "text-muted-foreground"}`}>
              {s.up ? <TrendingUp className="size-3"/> : <TrendingDown className="size-3"/>} {s.t}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">GMV · last 12 weeks</h2>
            <div className="font-mono text-xs text-muted-foreground">USD</div>
          </div>
          <div className="flex h-48 items-end gap-2">
            {[34, 41, 38, 52, 47, 58, 64, 61, 72, 78, 81, 92].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-primary transition-default hover:bg-primary/80" style={{ height: `${h}%` }}/>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display mb-4 text-lg font-bold">Top categories</h2>
          <ul className="space-y-2">
            {[
              { l: "Web Development", v: 32 },
              { l: "Mobile Design", v: 24 },
              { l: "Branding", v: 18 },
              { l: "Strategy", v: 14 },
              { l: "Architecture", v: 8 },
            ].map((c) => (
              <li key={c.l}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{c.l}</span>
                  <span className="font-mono text-muted-foreground">{c.v}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary transition-default" style={{ width: `${c.v * 3}%` }}/>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-lg font-bold">User moderation queue</h2>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs transition-default focus-ring">
            <Search className="size-3.5 text-muted-foreground"/>
            <input placeholder="Search users" className="bg-transparent outline-none"/>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-elevated/40 text-left text-muted-foreground">
              <th className="font-mono px-4 py-2.5 text-[10px] uppercase tracking-widest font-medium">User</th>
              <th className="font-mono px-4 py-2.5 text-[10px] uppercase tracking-widest font-medium">Status</th>
              <th className="font-mono px-4 py-2.5 text-[10px] uppercase tracking-widest font-medium">GMV</th>
              <th className="font-mono px-4 py-2.5 text-[10px] uppercase tracking-widest font-medium">Trust</th>
              <th className="font-mono px-4 py-2.5 text-right text-[10px] uppercase tracking-widest font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {freelancers.slice(0, 6).map((f) => (
              <tr key={f.id} className="transition-default hover:bg-secondary/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <GradientAvatar name={f.name} hue={f.hue} size={32}/>
                    <div>
                      <div className="text-sm font-semibold">{f.name}</div>
                      <div className="text-xs text-muted-foreground">{f.city}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono inline-flex rounded-lg bg-primary/15 px-2 py-1 text-[10px] uppercase tracking-widest text-primary">
                    Active
                  </span>
                </td>
                <td className="font-mono px-4 py-3">${(f.earned/1000).toFixed(0)}k</td>
                <td className="font-mono px-4 py-3">{(85 + (f.rating - 4.9) * 30).toFixed(0)}</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs font-medium text-primary transition-default hover:text-primary/80">Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </WorkspaceShell>
  );
}