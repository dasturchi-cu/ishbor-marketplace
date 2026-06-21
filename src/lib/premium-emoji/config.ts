import { EmojiStyle } from "emoji-picker-react";

/** Ishbor premium emoji — Apple datasource (Telegram/iOS darajasi, OS emojiga bog'liq emas). */
export const PREMIUM_EMOJI_STYLE = EmojiStyle.APPLE;

export const EMOJI_CDN_APPLE =
  "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/";

export const EMOJI_CDN_SIZE = 64;

export const PREMIUM_EMOJI_SIZES = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  picker: 28,
} as const;

export type PremiumEmojiSize = keyof typeof PREMIUM_EMOJI_SIZES;

/** Tez reaksiyalar — Ishbor xabarlar paneli */
export const QUICK_REACTIONS = [
  { unified: "1f44d", emoji: "👍", label: "Yaxshi" },
  { unified: "2764-fe0f", emoji: "❤️", label: "Sevgi" },
  { unified: "1f525", emoji: "🔥", label: "Zo'r" },
  { unified: "1f44f", emoji: "👏", label: "Qarsak" },
  { unified: "1f389", emoji: "🎉", label: "Bayram" },
  { unified: "2b50", emoji: "⭐", label: "Yulduz" },
  { unified: "1f602", emoji: "😂", label: "Kulgi" },
  { unified: "1f680", emoji: "🚀", label: "Tez" },
] as const;

export function getPremiumEmojiUrl(unified: string): string {
  return `${EMOJI_CDN_APPLE}${unified}.png`;
}
