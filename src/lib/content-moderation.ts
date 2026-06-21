/** Client-side content moderation heuristics for marketplace listings. */

export type ModerationFlag = {
  code: string;
  severity: "low" | "medium" | "high";
  message: string;
};

const SPAM_PATTERNS: Array<{ code: string; pattern: RegExp; message: string }> = [
  { code: "spam_url_flood", pattern: /(?:https?:\/\/[^\s]+\s*){4,}/gi, message: "Juda ko'p havola" },
  { code: "spam_caps", pattern: /^[A-Z\s\d!?.]{40,}$/, message: "Faqat katta harflar" },
  { code: "spam_repeat", pattern: /(.{3,})\1{4,}/i, message: "Takroriy matn" },
  { code: "spam_phone_flood", pattern: /(?:\+?\d[\d\s-]{7,}\d\s*){3,}/g, message: "Juda ko'p telefon raqami" },
];

const SCAM_PATTERNS: Array<{ code: string; pattern: RegExp; message: string }> = [
  { code: "scam_wire", pattern: /wire\s*transfer|western\s*union|moneygram|telegram\s*@\w+/i, message: "Shubhali to'lov usuli" },
  { code: "scam_offplatform", pattern: /(?:whatsapp|telegram|t\.me|to'lovni tashqarida|platformadan tashqari)/i, message: "Platformadan tashqari aloqa" },
  { code: "scam_guarantee", pattern: /100%\s*kafolat|pulni qaytaramiz|tez boyib/i, message: "Shubhali va'da" },
  { code: "scam_crypto", pattern: /(?:bitcoin|crypto|usdt|blockchain)\s*(?:invest|x2|ikki barobar)/i, message: "Shubhali kripto taklif" },
];

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function scanPatterns(
  text: string,
  patterns: typeof SPAM_PATTERNS,
  severity: ModerationFlag["severity"],
): ModerationFlag[] {
  const flags: ModerationFlag[] = [];
  for (const { code, pattern, message } of patterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      flags.push({ code, severity, message });
    }
  }
  return flags;
}

export function scanContent(text: string): ModerationFlag[] {
  if (!text.trim()) return [];
  const normalized = normalize(text);
  return [
    ...scanPatterns(normalized, SPAM_PATTERNS, "medium"),
    ...scanPatterns(text, SCAM_PATTERNS, "high"),
  ];
}

export function scanListing(input: {
  title: string;
  description?: string;
  tags?: string[];
}): ModerationFlag[] {
  const combined = [input.title, input.description ?? "", ...(input.tags ?? [])].join("\n");
  return scanContent(combined);
}

export function isBlockedByModeration(flags: ModerationFlag[]): boolean {
  return flags.some((f) => f.severity === "high");
}

export function moderationSummary(flags: ModerationFlag[]): string {
  if (flags.length === 0) return "";
  const high = flags.filter((f) => f.severity === "high");
  if (high.length > 0) {
    return `Kontent moderatsiyadan o'tmadi: ${high.map((f) => f.message).join("; ")}`;
  }
  return `Ogohlantirish: ${flags.map((f) => f.message).join("; ")}`;
}

/** Simple duplicate detection against existing titles (normalized). */
export function findDuplicateTitle(
  title: string,
  existingTitles: string[],
): boolean {
  const norm = normalize(title).replace(/\s+/g, " ");
  return existingTitles.some((t) => normalize(t).replace(/\s+/g, " ") === norm);
}
