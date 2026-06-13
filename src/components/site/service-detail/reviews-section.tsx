import { Star, Quote } from "lucide-react";
import { GradientAvatar } from "@/components/site/avatar";
import type { Review } from "@/lib/mock-data";

export function ServiceReviews({
  reviews,
  rating,
  totalReviews,
}: {
  reviews: Review[];
  rating: number;
  totalReviews: number;
}) {
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { stars, count, pct };
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr]">
      <div className="rounded-2xl border border-border bg-gradient-to-b from-secondary/40 to-card p-6">
        <div className="font-display text-5xl font-bold tracking-tight">{rating.toFixed(1)}</div>
        <div className="mt-2 flex items-center gap-0.5 text-gold">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`size-4 ${i < Math.round(rating) ? "fill-current" : "opacity-30"}`} />
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{totalReviews} tasdiqlangan sharh</p>

        <div className="mt-6 space-y-2.5">
          {distribution.map(({ stars, pct }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="font-mono w-3 text-xs text-muted-foreground">{stars}</span>
              <Star className="size-3 shrink-0 fill-gold text-gold" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/80">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="font-mono w-8 text-right text-[10px] text-muted-foreground">
                {Math.round(pct)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <article
            key={r.id}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-default hover:border-primary/15 hover:shadow-[0_8px_32px_-16px_oklch(0.546_0.185_257/0.12)]"
          >
            <Quote className="absolute right-5 top-5 size-8 text-primary/8" aria-hidden />
            <div className="mb-4 flex items-start gap-3">
              <GradientAvatar name={r.from} hue={r.fromHue} size={44} rounded="rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-display text-sm font-semibold">{r.from}</div>
                    <div className="font-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                      {r.date}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-gold">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p className="relative text-sm leading-relaxed text-foreground/90">{r.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
