import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Building2,
  CreditCard,
  Eye,
  FileText,
  Package,
  Shield,
  ShoppingBag,
  Star,
  User,
} from "lucide-react";
import {
  getDistinctRecentEventsForUser,
  getEventLabel,
  subscribeAnalyticsEvents,
  type DistinctAnalyticsEvent,
} from "@/lib/analytics-events-store";
import { formatTimeAgo } from "@/lib/time-utils";

const EVENT_ICONS: Partial<Record<string, LucideIcon>> = {
  checkout_start: CreditCard,
  order_created: ShoppingBag,
  order_completed: Package,
  escrow_funded: Shield,
  project_created: FileText,
  proposal_received: FileText,
  proposal_accepted: FileText,
  review_submitted: Star,
  agency_view: Building2,
  agency_created: Building2,
  agency_published: Building2,
  profile_view: User,
  service_view: Eye,
  portfolio_view: Eye,
};

function EventIcon({ type }: { type: string }) {
  const Icon = EVENT_ICONS[type] ?? Activity;
  return (
    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
      <Icon className="size-4" />
    </div>
  );
}

function ActivityRow({ event }: { event: DistinctAnalyticsEvent }) {
  const label = getEventLabel(event.type);
  const countSuffix = event.count > 1 ? ` (${event.count}×)` : "";

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <EventIcon type={event.type} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">
          {label}
          {countSuffix}
        </p>
      </div>
      <time className="shrink-0 text-xs text-muted-foreground" dateTime={event.timestamp}>
        {formatTimeAgo(event.timestamp)}
      </time>
    </li>
  );
}

export function RecentActivityList({ userId, limit = 5 }: { userId: string; limit?: number }) {
  const [events, setEvents] = useState<DistinctAnalyticsEvent[]>(() =>
    getDistinctRecentEventsForUser(userId, limit),
  );

  useEffect(() => {
    const sync = () => setEvents(getDistinctRecentEventsForUser(userId, limit));
    sync();
    const unsubscribe = subscribeAnalyticsEvents(sync);
    return () => {
      unsubscribe();
    };
  }, [userId, limit]);

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-secondary/10 px-4 py-8 text-center">
        <Activity className="mx-auto mb-2 size-5 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Hali faoliyat qayd etilmagan.</p>
        <p className="mt-1 text-xs text-muted-foreground/80">Buyurtma, to'lov yoki loyiha yaratganda bu yerda ko'rinadi.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-secondary/10">
      {events.map((e) => (
        <ActivityRow key={e.id} event={e} />
      ))}
    </ul>
  );
}
