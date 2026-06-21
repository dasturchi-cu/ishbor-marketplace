import { analyzeMessageContent, parseMessageSegments } from "@/lib/premium-emoji/parse";
import { PremiumEmoji } from "./premium-emoji";
import type { PremiumEmojiSize } from "@/lib/premium-emoji/config";
import { cn } from "@/lib/utils";

type PremiumEmojiTextProps = {
  text: string;
  emojiSize?: PremiumEmojiSize;
  className?: string;
  /** Faqat emoji xabarlar — kattaroq va ixcham joylashuv */
  compact?: boolean;
};

/** Matn ichidagi barcha emojilarni premium CDN asset sifatida render qiladi. */
export function PremiumEmojiText({ text, emojiSize = "md", className, compact }: PremiumEmojiTextProps) {
  const { emojiOnly } = analyzeMessageContent(text);
  const segments = parseMessageSegments(text);
  const useCompact = compact ?? emojiOnly;
  const resolvedSize = useCompact ? (emojiSize === "md" ? "lg" : emojiSize) : emojiSize;

  if (segments.length === 1 && segments[0]?.type === "text") {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      className={cn(
        "premium-emoji-text",
        useCompact && "premium-emoji-text-compact",
        className,
      )}
    >
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <span key={i}>{seg.value}</span>
        ) : (
          <PremiumEmoji
            key={i}
            unified={seg.unified}
            emoji={seg.value}
            size={resolvedSize}
          />
        ),
      )}
    </span>
  );
}
