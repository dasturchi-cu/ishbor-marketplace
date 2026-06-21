import { useMemo, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, Star, Users } from "lucide-react";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import { getAllAnalyticsEvents, subscribeAnalyticsEvents } from "@/lib/analytics-events-store";
import { readStoredReviews } from "@/lib/reviews-store";
import { freelancers } from "@/lib/mock-data";

const FALLBACK = [
  { id: "1", text: "Yangi loyiha joylandi", icon: Activity },
  { id: "2", text: "5★ sharh qoldirildi", icon: Star },
  { id: "3", text: "3 mutaxassis hozir mavjud", icon: Users },
];

export function MarketplacePulseMini() {
  const hydrated = useClientHydrated();
  const eventCount = useSyncExternalStore(
    subscribeAnalyticsEvents,
    () => getAllAnalyticsEvents().length,
    () => 0,
  );

  const items = useMemo(() => {
    if (!hydrated) return FALLBACK;
    const events = getAllAnalyticsEvents().slice(0, 2);
    const reviews = readStoredReviews().slice(0, 1);
    const available = freelancers.filter((f) => f.available).length;
    const built: { id: string; text: string; icon: typeof Activity }[] = [];
    if (events[0]) {
      built.push({ id: events[0].id, text: events[0].meta?.projectTitle ?? "Platformada faollik", icon: Activity });
    }
    if (reviews[0]) {
      built.push({ id: reviews[0].id, text: `${reviews[0].rating}★ yangi sharh`, icon: Star });
    }
    if (available > 0) {
      built.push({ id: "avail", text: `${available} mutaxassis hozir mavjud`, icon: Users });
    }
    return built.length > 0 ? built.slice(0, 3) : FALLBACK;
  }, [hydrated, eventCount]);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface/50 px-3 py-2.5">
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-primary">
        <span className="size-1.5 animate-pulse-subtle rounded-full bg-primary" />
        Jonli
      </span>
      {items.map((item) => (
        <span
          key={item.id}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground"
        >
          <item.icon className="size-3 text-primary" aria-hidden />
          {item.text}
        </span>
      ))}
      <Link to="/search" className="ml-auto text-xs font-medium text-primary hover:underline">
        Qidiruv →
      </Link>
    </div>
  );
}
