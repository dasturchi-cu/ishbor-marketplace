import { cn } from "@/lib/utils";
import {
  getPremiumEmojiUrl,
  PREMIUM_EMOJI_SIZES,
  type PremiumEmojiSize,
} from "@/lib/premium-emoji/config";
import type { CSSProperties } from "react";

type PremiumEmojiProps = {
  unified: string;
  emoji?: string;
  size?: PremiumEmojiSize | number;
  className?: string;
  interactive?: boolean;
  animate?: "none" | "pop" | "sparkle";
  label?: string;
};

function pixelSize(size: PremiumEmojiSize | number): number {
  return typeof size === "number" ? size : PREMIUM_EMOJI_SIZES[size];
}

/** Yuqori sifatli emoji — Apple CDN 64px, OS render emas. */
export function PremiumEmoji({
  unified,
  emoji,
  size = "md",
  className,
  interactive = false,
  animate = "none",
  label,
}: PremiumEmojiProps) {
  const sizePx = pixelSize(size);
  const src = getPremiumEmojiUrl(unified);

  return (
    <span
      className={cn(
        "premium-emoji inline-flex shrink-0 items-center justify-center align-middle",
        interactive && "premium-emoji-interactive",
        animate === "pop" && "premium-emoji-pop",
        animate === "sparkle" && "premium-emoji-sparkle",
        className,
      )}
      role={label ? "img" : undefined}
      aria-label={label}
      style={{ width: sizePx, height: sizePx }}
    >
      <img
        src={src}
        alt={emoji ?? label ?? ""}
        width={sizePx}
        height={sizePx}
        draggable={false}
        loading="lazy"
        decoding="async"
        className="premium-emoji-img"
        style={
          {
            width: sizePx,
            height: sizePx,
            "--emoji-size": `${sizePx}px`,
          } as CSSProperties
        }
      />
    </span>
  );
}
