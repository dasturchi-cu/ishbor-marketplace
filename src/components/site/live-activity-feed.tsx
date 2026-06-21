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
};

function formatActivity(event: ReturnType<typeof getAllAnalyticsEvents>[number]): string {
  const fn = TYPE_MESSAGES[event.type];
  const action = fn ? fn(event.meta) : getEventLabel(event.type).toLowerCase();
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

const FALLBACK = [
  { id: "fb1", text: "Mijoz yangi loyiha joyladi — Dizayn va brend", time: "12 daqiqa oldin" },
  { id: "fb2", text: "Frilanser taklif yubordi — Web Development", time: "34 daqiqa oldin" },
  { id: "fb3", text: "Eskrou to'ldirildi — $2,400", time: "1 soat oldin" },
];


export function LiveActivityFeed() {
  const hydrated = useClientHydrated();
  const eventCount = useSyncExternalStore(
    subscribeAnalyticsEvents,
    () => getAllAnalyticsEvents().length,
    () => 0,
  );
  const events = useMemo(() => (hydrated ? getRecentActivity(6) : []), [eventCount, hydrated]);

  const items =
    events.length > 0
      ? events.map((e) => ({
          id: e.id,
          text: formatActivity(e),
          time: timeAgo(e.timestamp),
        }))
      : FALLBACK;

  return (
    <section className="border-b border-border bg-surface/20 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="eyebrow mb-2">Jonli faollik</div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Bozor hozir nima bo'lyapti</h2>
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 sm:flex">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Jonli</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Activity className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm leading-relaxed">{item.text}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Haqiqiy tranzaksiyalar platformada amalga oshganda bu yerda ko'rinadi.{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Birinchi bo'ling
          </Link>
        </p>
      </div>
    </section>
  );
}
