import { createFileRoute } from "@tanstack/react-router";
import { Bell, Banknote, FileCheck, Star, ShieldCheck, MessageSquare } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { notifications } from "@/lib/mock-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Ishbor" }] }),
  component: NotificationsPage,
});

const iconMap = {
  payment: Banknote,
  proposal: FileCheck,
  review: Star,
  system: ShieldCheck,
  message: MessageSquare,
};

function NotificationsPage() {
  return (
    <WorkspaceShell
      eyebrow="Activity"
      title="Notifications"
      actions={
        <button className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
          Mark all read
        </button>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-3">
          {["All", "Payments", "Proposals", "Reviews", "System"].map((t, i) => (
            <button
              key={t}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-default ${
                i === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="divide-y divide-border">
          {notifications.map((n, i) => {
            const Icon = iconMap[n.kind] ?? Bell;
            return (
              <div key={n.id} className={`flex items-start gap-4 p-4 transition-default ${i < 2 ? "bg-primary/[0.04]" : "hover:bg-secondary/20"}`}>
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4"/>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{n.title}</h3>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{n.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                </div>
                {i < 2 && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary"/>}
              </div>
            );
          })}
        </div>
      </div>
    </WorkspaceShell>
  );
}