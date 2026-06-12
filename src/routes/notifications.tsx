import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Banknote, FileCheck, Star, ShieldCheck, MessageSquare, Settings2, Check, X } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { notifications } from "@/lib/mock-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Ishbor" }] }),
  component: NotificationsPage,
});

type Notification = (typeof notifications)[0];
type FilterKind = "all" | "payments" | "proposals" | "reviews" | "system";

const iconMap: Record<Notification["kind"], typeof Bell> = {
  payment: Banknote, proposal: FileCheck, review: Star, system: ShieldCheck, message: MessageSquare, escrow: ShieldCheck,
};

const iconBgMap: Record<Notification["kind"], string> = {
  payment: "bg-success/10 text-success",
  proposal: "bg-primary/10 text-primary",
  review: "bg-amber-500/10 text-amber-500",
  system: "bg-secondary text-foreground",
  message: "bg-secondary text-foreground",
  escrow: "bg-success/10 text-success",
};

function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKind>("all");

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "payments") return n.kind === "payment" || n.kind === "escrow";
    if (activeFilter === "proposals") return n.kind === "proposal";
    if (activeFilter === "reviews") return n.kind === "review";
    if (activeFilter === "system") return n.kind === "system" || n.kind === "message";
    return true;
  });

  const unreadNotifications = filteredNotifications.filter((n) => !n.read);
  const readNotifications = filteredNotifications.filter((n) => n.read);
  const isFromToday = (timeStr: string) => timeStr.includes("m") || timeStr.includes("h");
  const todayNotifications = readNotifications.filter((n) => isFromToday(n.time));
  const earlierNotifications = readNotifications.filter((n) => !isFromToday(n.time));

  const NotificationRow = ({ notification, isUnread }: { notification: Notification; isUnread: boolean }) => {
    const Icon = iconMap[notification.kind] ?? Bell;
    const bgClass = iconBgMap[notification.kind];
    return (
      <div className={`group flex items-start gap-4 p-4 transition-default ${
        isUnread ? "bg-primary/[0.03] hover:bg-primary/[0.06]" : "hover:bg-secondary/20"
      }`}>
        <div className={`${bgClass} grid size-10 shrink-0 place-items-center rounded-xl`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">{notification.title}</h3>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{notification.body}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-mono text-[10px] text-muted-foreground">{notification.time}</span>
              {isUnread && <span className="size-2 rounded-full bg-primary" />}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-default group-hover:opacity-100">
          <button className="p-1.5 text-muted-foreground transition-default hover:text-foreground" title="Mark as read"><Check className="size-4" /></button>
          <button className="p-1.5 text-muted-foreground transition-default hover:text-destructive" title="Dismiss"><X className="size-4" /></button>
        </div>
      </div>
    );
  };

  const filterDefs = [
    { key: "all" as const, label: "All", count: notifications.length },
    { key: "payments" as const, label: "Payments", count: notifications.filter((n) => n.kind === "payment" || n.kind === "escrow").length },
    { key: "proposals" as const, label: "Proposals", count: notifications.filter((n) => n.kind === "proposal").length },
    { key: "reviews" as const, label: "Reviews", count: notifications.filter((n) => n.kind === "review").length },
    { key: "system" as const, label: "System", count: notifications.filter((n) => n.kind === "system" || n.kind === "message").length },
  ];

  return (
    <WorkspaceShell
      eyebrow="Activity"
      title="Notifications"
      actions={
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-default hover:border-primary/20 focus-ring">Mark all read</button>
          <button className="grid size-9 place-items-center rounded-lg border border-border bg-surface transition-default hover:border-primary/20 focus-ring"><Settings2 className="size-4" /></button>
        </div>
      }
    >
      <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10">
            <Bell className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Get notified instantly</p>
            <p className="text-xs text-muted-foreground">Configure your notification preferences</p>
          </div>
        </div>
        <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition-default hover:bg-primary/10 focus-ring">Configure</button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-border p-3">
          {filterDefs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-default ${
                activeFilter === key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
            >
              {label} <span className="opacity-60">({count})</span>
            </button>
          ))}
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16">
            <div className="mb-4 rounded-full bg-secondary/50 p-3">
              <Bell className="size-8 text-muted-foreground animate-pulse-subtle" />
            </div>
            <h3 className="text-lg font-semibold">No notifications</h3>
            <p className="mt-1 text-sm text-muted-foreground">You're all caught up.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {unreadNotifications.length > 0 && (
              <>
                <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Unread</div>
                {unreadNotifications.map((n) => <NotificationRow key={n.id} notification={n} isUnread={true} />)}
              </>
            )}
            {todayNotifications.length > 0 && (
              <>
                <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Today</div>
                {todayNotifications.map((n) => <NotificationRow key={n.id} notification={n} isUnread={false} />)}
              </>
            )}
            {earlierNotifications.length > 0 && (
              <>
                <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Earlier</div>
                {earlierNotifications.map((n) => <NotificationRow key={n.id} notification={n} isUnread={false} />)}
              </>
            )}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
