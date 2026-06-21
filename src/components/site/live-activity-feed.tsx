import { useMemo, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import {
  getAllAnalyticsEvents,
  getEventLabel,
  subscribeAnalyticsEvents,
  type AnalyticsEventType,
} from "@/lib/analytics-events-store";

const DISPLAY_TYPES: AnalyticsEventType[] = [
  "project_created",
  "proposal_received",
  "proposal_accepted",
  "order_created",
  "escrow_funded",
  "order_completed",
  "review_submitted",
  "subscription_purchase",
  "featured_purchase",
  "search_query",
];

const TYPE_MESSAGES: Partial<Record<AnalyticsEventType, (meta?: Record<string, string>) => string>> = {
  project_created: () => "yangi loyiha joyladi",
  proposal_received: () => "taklif oldi",
  proposal_accepted: () => "frilanserni yolladi",
  order_created: () => "buyurtma yaratdi",
  escrow_funded: () => "eskrou to'ldirdi",
  order_completed: () => "loyihani yakunladi",
  review_submitted: () => "sharh qoldirdi",
  subscription_purchase: (m) => `${m?.plan ?? "Pro"} rejaga o'tdi`,
  featured_purchase: () => "profilni ajratilgan qildi",
  search_query: (m) => `"${m?.query ?? "…"}" qidirdi`,
};

function formatActivity(event: ReturnType<typeof getAllAnalyticsEvents>[number]): string {
  const fn = TYPE_MESSAGES[event.type];
  const action = fn ? fn({ ...event.meta, query: event.entityId ?? "" }) : getEventLabel(event.type).toLowerCase();
  const name = event.meta?.userName ?? event.meta?.freelancerName ?? "Foydalanuvchi";
  const project = event.meta?.projectTitle ?? event.meta?.title;
  if (project) return `${name} ${action} — "${project}"`;
  return `${name} ${action}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hozirgina";
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  return `${Math.floor(hours / 24)} kun oldin`;
}

function getRecentActivity(limit = 6) {
  return getAllAnalyticsEvents()
    .filter((e) => DISPLAY_TYPES.includes(e.type))
    .slice(0, limit);
}

export function LiveActivityFeed() {
  const hydrated = useClientHydrated();
  const eventCount = useSyncExternalStore(
    subscribeAnalyticsEvents,
    () => getAllAnalyticsEvents().length,
    () => 0,
  );
  const events = useMemo(() => (hydrated ? getRecentActivity(6) : []), [eventCount, hydrated]);

  const hasLive = events.length > 0;

  return (
    <section className="border-b border-border bg-surface/20 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="eyebrow mb-2">Jonli faollik</div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Bozor hozir nima bo&apos;lyapti</h2>
          </div>
          {hasLive && (
            <div className="hidden items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 sm:flex">
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Jonli</span>
            </div>
          )}
        </div>

        {hasLive ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <div
                key={e.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-default hover:border-primary/20 hover:shadow-sm"
              >
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Activity className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed">{formatActivity(e)}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {timeAgo(e.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <Activity className="mx-auto size-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Hozircha faollik yo&apos;q — platforma yangi foydalanuvchilarni kutmoqda.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link
                to="/projects/preview"
                className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Loyiha joylash
              </Link>
              <Link
                to="/register"
                className="inline-flex h-10 items-center rounded-lg border border-border px-5 text-sm font-semibold hover:border-primary/30"
              >
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </div>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {hasLive ? (
            <>
              Haqiqiy platforma faolligi.{" "}
              <Link to="/projects" className="font-medium text-primary hover:underline">
                Loyihalarni ko&apos;rish
              </Link>
            </>
          ) : (
            <>
              Faollik buyurtma, loyiha va sharhlar yaratilganda shu yerda ko&apos;rinadi.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
