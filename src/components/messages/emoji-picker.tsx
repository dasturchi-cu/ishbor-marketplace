import { lazy, Suspense, useSyncExternalStore, type CSSProperties } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Loader2 } from "lucide-react";
import { Categories, EmojiStyle, SkinTonePickerLocation, Theme, type EmojiClickData } from "emoji-picker-react";
import { cn } from "@/lib/utils";
import { PREMIUM_EMOJI_STYLE } from "@/lib/premium-emoji/config";
import { PremiumEmoji } from "@/components/premium/premium-emoji";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

const EMOJI_CATEGORIES = [
  { category: Categories.SUGGESTED, name: "So'nggi" },
  { category: Categories.SMILEYS_PEOPLE, name: "Smayliklar" },
  { category: Categories.ANIMALS_NATURE, name: "Hayvonlar" },
  { category: Categories.FOOD_DRINK, name: "Ovqat" },
  { category: Categories.TRAVEL_PLACES, name: "Sayohat" },
  { category: Categories.ACTIVITIES, name: "Sport" },
  { category: Categories.OBJECTS, name: "Buyumlar" },
  { category: Categories.SYMBOLS, name: "Belgilar" },
  { category: Categories.FLAGS, name: "Bayroqlar" },
] as const;

function subscribeDarkMode(onChange: () => void) {
  const root = document.documentElement;
  const observer = new MutationObserver(onChange);
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    mq.removeEventListener("change", onChange);
  };
}

function getDarkSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function PickerFallback() {
  return (
    <div className="flex h-[420px] w-[min(340px,calc(100vw-2rem))] items-center justify-center bg-card text-muted-foreground">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="sr-only">Emojilar yuklanmoqda</span>
    </div>
  );
}

function EmojiPickerPanel({
  theme,
  onSelect,
}: {
  theme: Theme;
  onSelect: (emoji: string) => void;
}) {
  return (
    <Suspense fallback={<PickerFallback />}>
      <div className="premium-emoji-picker">
        <EmojiPicker
          onEmojiClick={(data: EmojiClickData) => onSelect(data.emoji)}
          theme={theme}
          emojiStyle={PREMIUM_EMOJI_STYLE}
          searchPlaceholder="Emoji qidirish..."
          searchClearButtonLabel="Tozalash"
          categories={[...EMOJI_CATEGORIES]}
          lazyLoadEmojis
          autoFocusSearch
          width="100%"
          height={420}
          previewConfig={{
            showPreview: true,
            defaultCaption: "Emoji tanlang",
          }}
          skinTonePickerLocation={SkinTonePickerLocation.SEARCH}
          style={
            {
              "--epr-highlight-color": "#2563EB",
              "--epr-hover-bg-color": "oklch(0.546 0.185 257 / 0.12)",
              "--epr-focus-bg-color": "oklch(0.546 0.185 257 / 0.16)",
              "--epr-bg-color": "transparent",
              "--epr-category-icon-active-color": "#2563EB",
            } as CSSProperties
          }
        />
      </div>
    </Suspense>
  );
}

export function MessageEmojiPicker({
  onSelect,
  className,
}: {
  onSelect: (emoji: string) => void;
  className?: string;
}) {
  const isDark = useSyncExternalStore(subscribeDarkMode, getDarkSnapshot, () => false);
  const theme = isDark ? Theme.DARK : Theme.LIGHT;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "premium-emoji-btn touch-target inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground focus-ring data-[state=open]:bg-primary/10 data-[state=open]:text-primary",
            className,
          )}
          aria-label="Emoji qo'shish"
        >
          <PremiumEmoji unified="1f642" emoji="🙂" size="sm" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="liquid-glass-panel z-[100] w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <EmojiPickerPanel theme={theme} onSelect={onSelect} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Modal ichida ishlatish uchun — kengroq picker */
export function EmojiPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}) {
  const isDark = useSyncExternalStore(subscribeDarkMode, getDarkSnapshot, () => false);
  const theme = isDark ? Theme.DARK : Theme.LIGHT;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="liquid-glass-overlay absolute inset-0" aria-label="Yopish" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Emoji qo'shish"
        className="liquid-glass-panel relative z-10 w-full max-w-[360px] overflow-hidden rounded-2xl"
      >
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Emoji qo&apos;shish</h2>
          <p className="text-xs text-muted-foreground">Premium emoji — Apple sifat, OS emas</p>
        </div>
        <EmojiPickerPanel
          theme={theme}
          onSelect={(emoji) => {
            onSelect(emoji);
          }}
        />
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={onClose}
            className="touch-target w-full rounded-lg border border-border py-2 text-xs font-medium transition-default hover:bg-secondary"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}

export { EmojiStyle };
