import { Star } from "lucide-react";
import { GradientAvatar } from "@/components/site/avatar";
import type { Review } from "@/lib/mock-data";

export function ProfileReviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Hali sharhlar yo'q. Birinchi bo'lib yollang va fikr qoldiring.</p>
    );
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="text-center">
          <div className="font-display text-3xl font-bold">{avgRating.toFixed(1)}</div>
          <div className="flex items-center justify-center text-gold">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`size-3.5 ${i < Math.round(avgRating) ? "fill-current" : ""}`} />
            ))}
          </div>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <div className="text-sm font-semibold">{reviews.length} tasdiqlangan sharh</div>
          <div className="text-xs text-muted-foreground">Yakunlangan Ishbor hamkorliklaridan</div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-3">
              <GradientAvatar name={r.from} hue={r.fromHue} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{r.from}</span>
                  <div className="flex items-center text-gold">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="size-3 fill-current" />
                    ))}
                  </div>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {r.project} · {r.date}
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-foreground/85">{r.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
