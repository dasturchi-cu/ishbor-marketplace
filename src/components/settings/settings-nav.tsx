import {
  User,
  Shield,
  Bell,
  CreditCard,
  BadgeCheck,
  BellRing,
  Gift,
  Sun,
  Languages,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SettingsSectionId =
  | "Hisob"
  | "Xavfsizlik"
  | "Bildirishnomalar"
  | "To'lov usullari"
  | "Shaxsni tasdiqlash"
  | "Ogohlantirishlar"
  | "Taklif dasturi"
  | "Ko'rinish"
  | "Til";

export const SETTINGS_SECTION_META: Record<
  SettingsSectionId,
  { icon: LucideIcon; description: string }
> = {
  Hisob: { icon: User, description: "Profil, bio va ijtimoiy havolalar" },
  Xavfsizlik: { icon: Shield, description: "Parol, 2FA va faol seanslar" },
  Bildirishnomalar: { icon: Bell, description: "Email va push bildirishnomalar" },
  "To'lov usullari": { icon: CreditCard, description: "Karta va to'lov usullari" },
  "Shaxsni tasdiqlash": { icon: BadgeCheck, description: "Hujjatlar va ishonch belgisi" },
  Ogohlantirishlar: { icon: BellRing, description: "Ish e'lonlari bo'yicha ogohlantirishlar" },
  "Taklif dasturi": { icon: Gift, description: "Referral havola va mukofotlar" },
  "Ko'rinish": { icon: Sun, description: "Mavzu va interfeys" },
  Til: { icon: Languages, description: "Til va formatlar" },
};

export function SettingsNavButton({
  section,
  active,
  completion,
  onSelect,
  compact,
}: {
  section: SettingsSectionId;
  active: boolean;
  completion: string | null | undefined;
  onSelect: () => void;
  compact?: boolean;
}) {
  const Icon = SETTINGS_SECTION_META[section].icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "touch-target premium-sidebar-link flex items-center gap-2.5 rounded-xl text-left text-sm focus-ring",
        compact ? "shrink-0 px-3.5 py-2" : "w-full px-3 py-2.5",
        active
          ? "bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_oklch(0.546_0.185_257/0.45)]"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-primary-foreground" : "text-primary/70")} />
      <span className={cn("min-w-0 truncate font-medium", compact && "whitespace-nowrap")}>{section}</span>
      {completion && !compact && (
        <span
          className={cn(
            "ml-auto font-mono text-[10px]",
            completion === "✓" ? (active ? "text-primary-foreground/90" : "text-success") : active ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {completion}
        </span>
      )}
    </button>
  );
}

export function SettingsMoreToggle({
  open,
  active,
  onToggle,
}: {
  open: boolean;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "touch-target premium-sidebar-link flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm",
        active ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/60",
      )}
    >
      <span>Yana</span>
      <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
    </button>
  );
}
