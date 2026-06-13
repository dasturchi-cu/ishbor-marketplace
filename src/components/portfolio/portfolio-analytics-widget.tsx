import { Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { Eye, Heart, Share2, MessageSquare, TrendingUp } from "lucide-react";
import {
  subscribePortfolioAnalytics,
  getAnalyticsStoreSnapshot,
  getTopPerformingByAnalytics,
  getTotalAnalyticsForOwner,
} from "@/lib/portfolio-analytics-store";
import type { PortfolioItem } from "@/lib/portfolio-types";
import { PortfolioCover } from "./portfolio-preview-card";

const EMPTY_ANALYTICS_SNAPSHOT: Record<string, never> = {};

export function PortfolioAnalyticsWidget({ items }: { items: PortfolioItem[] }) {
  useSyncExternalStore(
    subscribePortfolioAnalytics,
    getAnalyticsStoreSnapshot,
    () => EMPTY_ANALYTICS_SNAPSHOT,
  );
  const top = getTopPerformingByAnalytics(items, 5);
  const totals = getTotalAnalyticsForOwner(items);

  if (items.length === 0) return null;

  const statCards = [
    { label: "Ko'rishlar", value: totals.views, icon: Eye },
    { label: "Saqlashlar", value: totals.saves, icon: Heart },
    { label: "Ulashishlar", value: totals.shares, icon: Share2 },
    { label: "Aloqa bosishlari", value: totals.contactClicks, icon: MessageSquare },
    { label: "Yollash konversiyalari", value: totals.hireConversions, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h3 className="font-display text-sm font-bold">Portfolio analitikasi</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-secondary/20 p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <s.icon className="size-3.5" />
                <span className="font-mono text-[9px] uppercase tracking-widest">{s.label}</span>
              </div>
              <div className="font-display mt-1 text-xl font-bold">{s.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {top.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold">Eng yaxshi natija ko'rsatgan loyihalar</h3>
          <div className="mt-4 divide-y divide-border">
            {top.map((p, i) => (
              <Link
                key={p.slug}
                to="/portfolio/$slug"
                params={{ slug: p.slug }}
                className="flex items-center gap-3 py-3 transition-default hover:text-primary"
              >
                <span className="font-mono w-5 text-xs text-muted-foreground">{i + 1}</span>
                <div className="size-10 shrink-0 overflow-hidden rounded-lg">
                  <PortfolioCover hue={p.hue} aspect="aspect-square" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.title}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{p.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-semibold text-primary">{p.score} ball</div>
                  <div className="text-[10px] text-muted-foreground">{p.analytics.views} ko'rish</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
