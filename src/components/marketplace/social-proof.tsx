import { Star, Eye, ShoppingBag, Repeat2 } from "lucide-react";
import type { EntitySocialProof } from "@/lib/marketplace-signals";
import { getMarketplaceStatistics, type MarketplaceStatistics } from "@/lib/marketplace-signals";
import { useClientHydrated } from "@/hooks/use-client-hydrated";

export function MarketplaceStatsBar({ stats }: { stats?: MarketplaceStatistics }) {
  const s = stats ?? getMarketplaceStatistics();
  const items = [
    s.publishedServices > 0 && `${s.publishedServices} xizmat`,
    s.publishedProjects > 0 && `${s.publishedProjects} loyiha`,
    s.completedOrders > 0 && `${s.completedOrders} yakunlangan ish`,
    s.totalReviews > 0 && `${s.totalReviews} sharh`,
    s.recentOrders30d > 0 && `${s.recentOrders30d} ish (30 kun)`,
  ].filter(Boolean) as string[];

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
      <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Bozor</span>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
      {s.isLive && (
        <span className="inline-flex items-center gap-1 text-success">
          <span className="size-1.5 rounded-full bg-success animate-pulse-subtle" />
          jonli ma&apos;lumot
        </span>
      )}
    </div>
  );
}

export function SocialProofLine({
  proof,
  variant = "compact",
}: {
  proof: EntitySocialProof;
  variant?: "compact" | "detail";
}) {
  const hydrated = useClientHydrated();
  if (!hydrated) return null;
  const parts: string[] = [];
  if (proof.serviceViews > 0) parts.push(`${proof.serviceViews} ko'rish`);
  if (proof.profileViews > 0 && variant === "detail") parts.push(`${proof.profileViews} profil ko'rish`);
  if (proof.saves > 0) parts.push(`${proof.saves} saqlangan`);
  if (proof.completedJobs > 0) parts.push(`${proof.completedJobs} yakunlangan ish`);
  if (proof.orders > 0 && proof.serviceViews === 0) parts.push(`${proof.orders} buyurtma`);

  if (parts.length === 0 && !proof.recentReview) return null;

  return (
    <div className="space-y-1.5">
      {parts.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <Eye className="size-3 shrink-0 text-primary/70" />
          {parts.join(" · ")}
          <span className="text-border">|</span>
          <span>{proof.trustScore} ishonch · {proof.reputationLabel}</span>
        </div>
      )}
      {proof.recentReview && variant === "detail" && (
        <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-secondary/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          <Star className="mt-0.5 size-3 shrink-0 fill-gold text-gold" />
          <span>
            <span className="font-medium text-foreground">{proof.recentReview.from}</span>
            {" — "}
            {proof.recentReview.rating}★ · {proof.recentReview.body.slice(0, 80)}
            {proof.recentReview.body.length > 80 ? "…" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

export function CardSocialProofChip({
  views,
  completedJobs,
  repeatRate,
}: {
  views?: number;
  completedJobs?: number;
  repeatRate?: number;
}) {
  const hydrated = useClientHydrated();
  if (!hydrated) return null;
  if (!views && !completedJobs && !repeatRate) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {views != null && views > 0 && (
        <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          <Eye className="size-3" /> {views}
        </span>
      )}
      {completedJobs != null && completedJobs > 0 && (
        <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          <ShoppingBag className="size-3" /> {completedJobs}
        </span>
      )}
      {repeatRate != null && repeatRate > 0 && (
        <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
          <Repeat2 className="size-3" /> {repeatRate}%
        </span>
      )}
    </div>
  );
}

export function RecentReviewSnippet({ review }: { review: { from: string; rating: number; body: string } }) {
  return (
    <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
      <Star className="mr-0.5 inline size-3 fill-gold text-gold" />
      <span className="font-medium text-foreground">{review.from}</span>: {review.body}
    </p>
  );
}
