import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  Banknote,
  FileCheck,
  Star,
  ShieldCheck,
  MessageSquare,
  CheckCheck,
  ChevronRight,
  Lock,
  ExternalLink,
  X,
} from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { notifications } from "@/lib/mock-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Ishbor" }] }),
  component: NotificationsPage,
});

const iconConfig = {
  payment: { icon: Banknote, bg: "bg-success/10", text: "text-success" },
  proposal: { icon: FileCheck, bg: "bg-primary/10", text: "text-primary" },
  review: { icon: Star, bg: "bg-[oklch(0.78_0.15_75)]/10", text: "text-[oklch(0.65_0.15_75)]" },
  system: { icon: ShieldCheck, bg: "bg-secondary", text: "text-muted-foreground" },
  message: { icon: MessageSquare, bg: "bg-primary/10", text: "text-primary" },
  escrow: { icon: Lock, bg: "bg-primary/10", text: "text-primary" },
};

const actionMap: Record<string, { primary?: string; secondary?: string }> = {
  payment: { primary: "View escrow", secondary: "Dismiss" },
  proposal: { primary: "Review proposal", secondary: "Later" },
  review: { primary: "View review" },
  system: { primary: "Learn more" },
  message: { primary: "Reply", secondary: "Dismiss" },
  escrow: { primary: "View escrow", secondary: "Dismiss" },
};

const filters = ["All", "Payments", "Proposals", "Reviews", "System"] as const;
type Filter = typeof filters[number];

const filterMap: Record<Filter, string | null> = {
  All: null,
  Payments: "payment",
  Proposals: "proposal",
  Reviews: "review",
  System: "system",
};

const unreadCount = notifications.filter((n) => !n.read).length;

function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [allRead, setAllRead] = useState(false);

  const visible = notifications.filter((n) => {
    if (dismissed.has(n.id)) return false;
    const kind = filterMap[activeFilter];
    if (kind && n.kind !== kind) return false;
    return true;
  });

  const todayItems = visible.slice(0, 3);
  const earlierItems = visible.slice(3);

  function NotifItem({ n }: { n: typeof notifications[0] }) {
    const cfg = iconConfig[n.kind];
    const Icon = cfg.icon;
    const actions = actionMap[n.kind] ?? {};
    const isUnread = !n.read && !allRead;

    return (
      <div
        className={`group relative flex items-start gap-4 px-5 py-4 transition-default ${
          isUnread ? "bg-primary/[0.03]" : "hover:bg-secondary/20"
        }`}
      >
        {/* Unread dot */}
        {isUnread && (
          <span className="absolute left-2 top-5 size-1.5 rounded-full bg-primary" />
        )}

        {/* Icon */}
        <div className={`mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg} ${cfg.text}`}>
          <Icon className="size-4.5" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className={`text-sm ${isUnread ? "font-semibold" : "font-medium"}`}>
                {n.title}
              </h3>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-mono whitespace-nowrap text-[10px] text-muted-foreground">{n.time}</span>
              <button
                onClick={() => setDismissed((s) => new Set([...s, n.id]))}
                className="hidden size-6 items-center justify-center rounded-md text-muted-foreground transition-default hover:bg-secondary hover:text-foreground group-hover:flex focus-ring"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          {(actions.primary || actions.secondary) && (
            <div className="mt-3 flex items-center gap-2">
              {actions.primary && (
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition-default hover:border-primary/20 hover:text-primary focus-ring">
                  {actions.primary}
                  <ChevronRight className="size-3" />
                </button>
              )}
              {actions.secondary && (
                <button className="text-xs font-medium text-muted-foreground transition-default hover:text-foreground">
                  {actions.secondary}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <WorkspaceShell
      eyebrow="Activity"
      title="Notifications"
      actions={
        <button
          onClick={() => setAllRead(true)}
          className="touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-default hover:border-primary/20 focus-ring sm:w-auto"
        >
          <CheckCheck className="size-4" /> Mark all read
        </button>
      }
    >
      {/* Summary bar */}
      {unreadCount > 0 && !allRead && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Bell className="size-4 text-primary" />
          <span className="text-sm">
            You have{" "}
            <span className="font-semibold text-primary">{unreadCount} unread</span>{" "}
            notifications
          </span>
          <button
            onClick={() => setAllRead(true)}
            className="ml-auto text-xs font-medium text-primary transition-default hover:opacity-80"
          >
            Mark all read
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* Tabs */}
        <div className="mobile-scroll-x flex items-center gap-1 border-b border-border px-3 py-2.5 sm:px-4">
          {filters.map((f) => {
            const isActive = activeFilter === f;
            const kindKey = filterMap[f];
            const count = kindKey
              ? notifications.filter((n) => n.kind === kindKey && !n.read).length
              : notifications.filter((n) => !n.read).length;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`touch-target inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-default ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                {f}
                {count > 0 && !allRead && (
                  <span className={`inline-flex size-4 items-center justify-center rounded-full text-[9px] font-bold ${
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Today */}
        {todayItems.length > 0 && (
          <>
            <div className="flex items-center gap-3 border-b border-border px-5 py-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Today</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="divide-y divide-border">
              {todayItems.map((n) => (
                <NotifItem key={n.id} n={n} />
              ))}
            </div>
          </>
        )}

        {/* Earlier */}
        {earlierItems.length > 0 && (
          <>
            <div className="flex items-center gap-3 border-t border-b border-border px-5 py-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Earlier</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="divide-y divide-border">
              {earlierItems.map((n) => (
                <NotifItem key={n.id} n={n} />
              ))}
            </div>
          </>
        )}

        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-secondary">
              <Bell className="size-6 text-muted-foreground" />
            </div>
            <div>
              <div className="font-semibold">All caught up</div>
              <div className="mt-1 text-sm text-muted-foreground">No notifications in this category.</div>
            </div>
          </div>
        )}
      </div>

      {/* Notification settings link */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Bell className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Notification preferences</span>
        </div>
        <button className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-default hover:opacity-80">
          Manage <ExternalLink className="size-3" />
        </button>
      </div>
    </WorkspaceShell>
  );
}
