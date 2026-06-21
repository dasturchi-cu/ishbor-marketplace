/** Smayliklar, bayroqlar (🇺🇿) va ZWJ ketma-ketliklari. */
const EMOJI_SEGMENT =
  /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*|\p{Regional_Indicator}\p{Regional_Indicator})/gu;
export type TextSegment = { type: "text"; value: string };
export type EmojiSegment = { type: "emoji"; value: string; unified: string };
export type MessageSegment = TextSegment | EmojiSegment;

export function emojiToUnified(emoji: string): string {
  const parts: string[] = [];
  for (let i = 0; i < emoji.length; ) {
    const cp = emoji.codePointAt(i)!;
    parts.push(cp.toString(16).toLowerCase());
    i += cp > 0xffff ? 2 : 1;
  }
  return parts.join("-");
}

export function parseMessageSegments(text: string): MessageSegment[] {
  if (!text) return [];

  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(EMOJI_SEGMENT)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, index) });
    }
    const value = match[0];
    segments.push({ type: "emoji", value, unified: emojiToUnified(value) });
    lastIndex = index + value.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}

export function containsEmoji(text: string): boolean {
  EMOJI_SEGMENT.lastIndex = 0;
  return EMOJI_SEGMENT.test(text);
}

export function analyzeMessageContent(text: string) {
  const trimmed = text.trim();
  const segments = parseMessageSegments(trimmed);
  const emojiCount = segments.filter((s) => s.type === "emoji").length;
  const hasText = segments.some((s) => s.type === "text" && s.value.trim().length > 0);
  const emojiOnly = emojiCount > 0 && !hasText;
  return { emojiOnly, emojiCount, segments };
}
