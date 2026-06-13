import { Star } from "lucide-react";
import { GradientAvatar } from "@/components/site/avatar";
import type { Review } from "@/lib/mock-data";

export function ServiceReviews({ reviews, rating, totalReviews }: { reviews: Review[]; rating: number; totalReviews: number }) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="font-display text-4xl font-bold">{rating.toFixed(1)}</div>
          <div>
            <div className="flex items-center text-gold">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`size-4 ${i < Math.round(rating) ? "fill-current" : ""}`} />
              ))}
            </div>
            <div className="text-xs text-muted-foreground">{totalReviews} reviews</div>
          </div>
        </div>
        <div className="flex gap-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviews.filter((r) => r.rating === stars).length;
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-1.5 text-xs">
                <span className="font-mono w-3">{stars}</span>
                <Star className="size-3 fill-gold text-gold" />
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-5">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-3">
              <GradientAvatar name={r.from} hue={r.fromHue} size={36} />
              <div className="flex-1">
                <div className="text-sm font-semibold">{r.from}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {r.date}
                </div>
              </div>
              <div className="flex items-center text-gold">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-foreground/85">{r.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
