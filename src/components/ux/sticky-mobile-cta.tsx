import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Mobil checkout/form oxirida summa + primary action. */
export function StickyMobileCta({
  label,
  amount,
  action,
  className,
}: {
  label: string;
  amount: string;
  action: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "liquid-glass fixed inset-x-0 bottom-0 z-40 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden",
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display truncate text-lg font-bold">{amount}</div>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </div>
  );
}
