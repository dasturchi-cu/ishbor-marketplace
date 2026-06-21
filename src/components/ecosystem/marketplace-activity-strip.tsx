import { useMemo, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, ArrowUpRight, Star } from "lucide-react";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import { readStoredReviews, subscribeReviews } from "@/lib/reviews-store";
import { readStoredOrders, subscribeOrders } from "@/lib/orders-store";
import { getMarketplaceStatistics } from "@/lib/marketplace-signals";

function reviewCount() {
  return readStoredReviews().length;
}

/** Compact marketplace activity for dashboards — social proof + retention cue. */
export function MarketplaceActivityStrip() {
  const hydrated = useClientHydrated();
  const reviewsVersion = useSyncExternalStore(subscribeReviews, reviewCount, () => 0);
  const ordersVersion = useSyncExternalStore(subscribeOrders, () => readStoredOrders().length, () => 0);

  const stats = useMemo(
    () => (hydrated ? getMarketplaceStatistics() : null),
    [hydrated, reviewsVersion, ordersVersion],
  );

  const items = useMemo(() => {
    if (!hydrated) return [];
    const reviews = readStoredReviews()
      .filter((r) => r.direction !== "freelancer_to_client")
      .slice(0, 2)
      .map((r) => ({
        id: r.id,
        label: `${r.from} · ${r.rating}★ sharh`,
        href: r.freelancerUsername ? `/freelancers/${r.freelancerUsername}` : "/freelancers",
      }));
    const orders = readStoredOrders()
      .filter((o) => o.status === "completed")
      .slice(0, 2)
      .map((o) => ({
        id: o.id,
        label: `"${o.title}" yakunlandi`,
        href: `/orders/${o.id}`,
      }));
    return [...orders, ...reviews].slice(0, 3);
  }, [hydrated, reviewsVersion, ordersVersion]);

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h2 className="font-display text-sm font-semibold">Bozor faolligi</h2>
        </div>
        <Link to="/search" className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">
          Qidiruv <ArrowUpRight className="size-3" />
        </Link>
      </div>
      {stats && stats.isLive && (
        <p className="border-b border-border px-4 py-2 text-[11px] text-muted-foreground">
          {[
            stats.completedOrders > 0 && `${stats.completedOrders} yakunlangan ish`,
            stats.totalReviews > 0 && `${stats.totalReviews} sharh`,
            stats.recentOrders30d > 0 && `${stats.recentOrders30d} ish (30 kun)`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      {items.length === 0 ? (
        <p className="px-4 py-3 text-xs text-muted-foreground">
          Yakunlangan ishlar va sharhlar shu yerda ko&apos;rinadi — faol bozor signal.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.href}
                className="flex items-center gap-2 px-4 py-2.5 text-sm transition-default hover:bg-secondary/20"
              >
                <Star className="size-3.5 shrink-0 text-primary/70" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
