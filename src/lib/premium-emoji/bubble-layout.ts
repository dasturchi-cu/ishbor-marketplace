import type { PremiumEmojiSize } from "./config";

export type EmojiBubbleLayout = {
  columns: number;
  emojiSize: PremiumEmojiSize | number;
  /** Pufakcha ichidagi emoji o'lchami (px) */
  pixelSize: number;
  /** Vaqt belgisi uchun pastki rezerv (px) */
  metaReserve: number;
};

/** Telegram uslubida ixcham grid — emoji soniga qarab o'lcham. */
export function getEmojiBubbleLayout(emojiCount: number): EmojiBubbleLayout {
  if (emojiCount <= 0) {
    return { columns: 1, emojiSize: 28, pixelSize: 28, metaReserve: 12 };
  }
  if (emojiCount === 1) {
    return { columns: 1, emojiSize: 42, pixelSize: 42, metaReserve: 12 };
  }
  if (emojiCount === 2) {
    return { columns: 2, emojiSize: 34, pixelSize: 34, metaReserve: 12 };
  }
  if (emojiCount <= 4) {
    return { columns: 2, emojiSize: 30, pixelSize: 30, metaReserve: 12 };
  }
  if (emojiCount <= 6) {
    return { columns: 3, emojiSize: 28, pixelSize: 28, metaReserve: 12 };
  }
  return { columns: 3, emojiSize: 26, pixelSize: 26, metaReserve: 12 };
}

export function getEmojiBubbleGridStyle(columns: number, pixelSize: number, metaReserve: number) {
  return {
    gridTemplateColumns: `repeat(${columns}, ${pixelSize}px)`,
    gridAutoRows: `${pixelSize}px`,
    paddingBottom: `${metaReserve}px`,
  } as const;
}
