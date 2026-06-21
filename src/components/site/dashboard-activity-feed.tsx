import { useMemo, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, ArrowUpRight } from "lucide-react";
import {
  getAllAnalyticsEvents,
  subscribeAnalyticsEvents,
  getEventLabel,
} from "@/lib/analytics-events-store";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hozir";
  if (mins < 60) return `${mins} daq oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  return `${Math.floor(hours / 24)} kun oldin`;
}

export function DashboardActivityFeed({ limit = 4 }: { limit?: number }) {
  const eventCount = useSyncExternalStore(
    subscribeAnalyticsEvents,
    () => getAllAnalyticsEvents().length,
    () => 0,
  );

  const items = useMemo(
    () =>
      getAllAnalyticsEvents()
        .slice(0, limit)
        .map((e) => ({
          id: e.id,
          label: getEventLabel(e.type),
          time: timeAgo(e.timestamp),
        })),
    [eventCount, limit],
  );

  if (items.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h2 className="font-display text-sm font-semibold">So&apos;nggi faollik</h2>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Platformada harakat qilganingizda bu yerda ko&apos;rinadi.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h2 className="font-display text-sm font-semibold">So&apos;nggi faollik</h2>
        </div>
        <Link to="/notifications" className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">
          Hammasi <ArrowUpRight className="size-3" />
        </Link>
      </div>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <span>{item.label}</span>
            <span className="font-mono shrink-0 text-[10px] text-muted-foreground">{item.time}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
