import { Lock, BadgeCheck, ShieldCheck } from "lucide-react";

const items = [
  { icon: Lock, label: "Eskrou himoyasi" },
  { icon: BadgeCheck, label: "Tasdiqlangan mutaxassislar" },
  { icon: ShieldCheck, label: "Mahalliy to'lovlar" },
];

export function AuthTrustStrip({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 sm:gap-4 ${className}`}>
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
