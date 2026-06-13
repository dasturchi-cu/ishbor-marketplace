import { Award } from "lucide-react";
import type { ReputationTier } from "@/lib/reputation-store";
import { getTierColor, getTierLabel } from "@/lib/reputation-store";
import { cn } from "@/lib/utils";

type ReputationBadgeProps = {
  tier: ReputationTier;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
};

export function ReputationBadge({ tier, size = "sm", showLabel = true, className = "" }: ReputationBadgeProps) {
  const colors = getTierColor(tier);
  const iconSize = size === "sm" ? "size-3" : "size-3.5";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-widest",
        colors,
        textSize,
        size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1",
        className,
      )}
    >
      <Award className={iconSize} />
      {showLabel && getTierLabel(tier)}
    </span>
  );
}

export function ReputationTierRow({
  tier,
  trustScore,
  successScore,
  avgRating,
  reviewCount,
}: {
  tier: ReputationTier;
  trustScore: number;
  successScore: number;
  avgRating: number;
  reviewCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ReputationBadge tier={tier} size="md" />
      <span className="font-mono text-[10px] text-muted-foreground">
        Ishonch {trustScore} · Muvaffaqiyat {successScore}
        {reviewCount > 0 && ` · ${avgRating.toFixed(1)}★ (${reviewCount})`}
      </span>
    </div>
  );
}
