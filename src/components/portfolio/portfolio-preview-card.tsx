import { Link } from "@tanstack/react-router";
import { ExternalLink, Star } from "lucide-react";
import type { PortfolioItem } from "@/lib/portfolio-types";

export function PortfolioCover({
  hue,
  className = "",
  aspect = "aspect-[4/5]",
}: {
  hue: number;
  className?: string;
  aspect?: string;
}) {
  return (
    <div
      className={`grain ${aspect} w-full ${className}`}
      style={{
        background: `linear-gradient(135deg, oklch(0.72 0.15 ${hue}) 0%, oklch(0.32 0.14 ${(hue + 40) % 360}) 100%)`,
      }}
    />
  );
}

export function PortfolioPreviewCard({
  item,
  showFreelancer,
}: {
  item: PortfolioItem;
  showFreelancer?: boolean;
}) {
  return (
    <Link
      to="/portfolio/$slug"
      params={{ slug: item.slug }}
      className="group relative overflow-hidden rounded-xl border border-border text-left transition-default hover:-translate-y-0.5 hover:border-primary/20 focus-ring"
    >
      <PortfolioCover hue={item.hue} />
      {item.featured && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-primary-foreground">
          <Star className="size-2.5 fill-current" /> Ajratilgan
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="text-xs font-semibold text-white">{item.title}</div>
        <div className="font-mono text-[10px] text-white/60">
          {item.category}
          {showFreelancer && ` · ${item.freelancerName}`}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-default group-hover:bg-black/20 group-hover:opacity-100">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground">
          Ko'rish <ExternalLink className="size-3" />
        </span>
      </div>
    </Link>
  );
}

export function PortfolioPreviewGrid({
  items,
  showFreelancer,
  emptyMessage,
}: {
  items: PortfolioItem[];
  showFreelancer?: boolean;
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyMessage ?? "Hali portfolio elementlari yo'q."}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <PortfolioPreviewCard key={item.slug} item={item} showFreelancer={showFreelancer} />
      ))}
    </div>
  );
}
