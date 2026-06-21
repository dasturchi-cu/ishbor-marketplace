import { cn } from "@/lib/utils";

type GlyphProps = {
  className?: string;
  size?: number;
};

/** Telegram uslubidagi o'qildi belgisi — ikki ko'k check. */
export function PremiumReadReceipt({ className, size = 14 }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={cn("premium-glyph shrink-0", className)}
    >
      <path
        d="M1.5 8.2 3.8 10.5 6.8 6.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M5.5 8.2 7.8 10.5 14.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Premium tasdiqlash — yashil 3D check. */
export function PremiumCheckGlyph({ className, size = 16 }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={cn("premium-glyph shrink-0", className)}
    >
      <defs>
        <linearGradient id="ishbor-check-grad" x1="4" y1="4" x2="16" y2="16">
          <stop offset="0%" stopColor="oklch(0.72 0.17 155)" />
          <stop offset="100%" stopColor="oklch(0.58 0.16 155)" />
        </linearGradient>
        <filter id="ishbor-check-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.6" floodColor="oklch(0.45 0.12 155)" floodOpacity="0.35" />
        </filter>
      </defs>
      <circle cx="10" cy="10" r="9" fill="url(#ishbor-check-grad)" filter="url(#ishbor-check-shadow)" />
      <path
        d="M6 10.2 8.6 12.8 14 7.4"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Qadash — premium pin glyph. */
export function PremiumPinGlyph({ className, size = 14 }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={cn("premium-glyph shrink-0", className)}
    >
      <defs>
        <linearGradient id="ishbor-pin-grad" x1="4" y1="2" x2="12" y2="14">
          <stop offset="0%" stopColor="oklch(0.62 0.19 257)" />
          <stop offset="100%" stopColor="oklch(0.48 0.17 257)" />
        </linearGradient>
      </defs>
      <path
        d="M8 1.5 5.5 5.5H3.5L6 8v3.5l1.5 1.5V8l2.5-2.5H10.5L8 1.5Z"
        fill="url(#ishbor-pin-grad)"
      />
    </svg>
  );
}

/** Bo'sh holat — premium doira. */
export function PremiumPendingGlyph({ className, size = 16 }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={cn("premium-glyph shrink-0 opacity-50", className)}
    >
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  );
}
