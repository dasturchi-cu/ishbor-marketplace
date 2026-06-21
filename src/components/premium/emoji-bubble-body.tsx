import { analyzeMessageContent } from "@/lib/premium-emoji/parse";
import {
  getEmojiBubbleGridStyle,
  getEmojiBubbleLayout,
} from "@/lib/premium-emoji/bubble-layout";
import { PremiumEmoji } from "./premium-emoji";
import type { ReactNode } from "react";

type EmojiBubbleBodyProps = {
  text: string;
  meta: ReactNode;
  incoming?: boolean;
};

/** Telegram uslubidagi faqat-emoji xabar pufakchasi. */
export function EmojiBubbleBody({ text, meta, incoming }: EmojiBubbleBodyProps) {
  const { emojiCount, segments } = analyzeMessageContent(text);
  const layout = getEmojiBubbleLayout(emojiCount);
  const emojis = segments.filter((s) => s.type === "emoji");
  const gridStyle = getEmojiBubbleGridStyle(layout.columns, layout.pixelSize, layout.metaReserve);

  return (
    <div className="chat-bubble-emoji-body">
      <div className="chat-bubble-emoji-grid" style={gridStyle}>
        {emojis.map((seg, i) =>
          seg.type === "emoji" ? (
            <PremiumEmoji
              key={`${seg.unified}-${i}`}
              unified={seg.unified}
              emoji={seg.value}
              size={layout.emojiSize}
              className="chat-bubble-emoji-cell"
            />
          ) : null,
        )}
      </div>
      <div
        className={
          incoming ? "chat-bubble-emoji-meta chat-bubble-emoji-meta-incoming" : "chat-bubble-emoji-meta"
        }
      >
        {meta}
      </div>
    </div>
  );
}
