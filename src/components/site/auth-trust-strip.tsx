import { Lock, BadgeCheck, ShieldCheck, Globe, Clock } from "lucide-react";

const authItems = [
  { icon: Lock, label: "Eskrou himoyasi" },
  { icon: BadgeCheck, label: "Tasdiqlangan mutaxassislar" },
  { icon: ShieldCheck, label: "Mahalliy to'lovlar" },
];

const landingItems = [
  { icon: ShieldCheck, label: "Humo · Uzcard" },
  { icon: Lock, label: "Eskrou himoyasi" },
  { icon: Globe, label: "O'zbek interfeys" },
  { icon: Clock, label: "24 soat nizo" },
  { icon: BadgeCheck, label: "Ishonch balli" },
];

export function AuthTrustStrip({
  className = "",
  variant = "auth",
}: {
  className?: string;
  variant?: "auth" | "landing";
}) {
  const items = variant === "landing" ? landingItems : authItems;
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 ${className}`}>
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-medium text-muted-foreground"
        >
          <item.icon className="size-3.5 text-primary" aria-hidden />
          {item.label}
        </span>
      ))}
    </div>
  );
}
