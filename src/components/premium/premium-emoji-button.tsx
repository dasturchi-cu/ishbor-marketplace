import { useState } from "react";
import { cn } from "@/lib/utils";
import { PremiumEmoji } from "./premium-emoji";
import { QUICK_REACTIONS } from "@/lib/premium-emoji/config";

type PremiumEmojiButtonProps = {
  unified: string;
  emoji: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
  className?: string;
};

const sizeMap = { sm: "sm" as const, md: "md" as const, lg: "lg" as const };

export function PremiumEmojiButton({
  unified,
  emoji,
  label,
  size = "md",
  selected = false,
  onClick,
  className,
}: PremiumEmojiButtonProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    window.setTimeout(() => setAnimating(false), 420);
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label ?? emoji}
      aria-pressed={selected}
      className={cn(
        "premium-emoji-btn touch-target inline-flex items-center justify-center rounded-xl",
        selected && "premium-emoji-btn-selected",
        className,
      )}
    >
      <PremiumEmoji
        unified={unified}
        emoji={emoji}
        size={sizeMap[size]}
        animate={animating ? "pop" : "none"}
      />
    </button>
  );
}

type QuickReactionsProps = {
  onReact: (emoji: string) => void;
  className?: string;
};

export function QuickReactionsBar({ onReact, className }: QuickReactionsProps) {
  return (
    <div
      className={cn(
        "premium-reactions-bar inline-flex items-center gap-0.5 rounded-2xl border border-border/60 bg-card/95 p-1 shadow-[0_8px_32px_-8px_oklch(0_0_0/0.18)] backdrop-blur-md",
        className,
      )}
      role="toolbar"
      aria-label="Tez reaksiyalar"
    >
      {QUICK_REACTIONS.map((r) => (
        <PremiumEmojiButton
          key={r.unified}
          unified={r.unified}
          emoji={r.emoji}
          label={r.label}
          size="sm"
          onClick={() => onReact(r.emoji)}
        />
      ))}
    </div>
  );
}
