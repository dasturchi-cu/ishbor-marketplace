import type { LucideIcon } from "lucide-react";
import { Clock } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type WaitingStateProps = {
  title: string;
  eta?: string;
  hint?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  compact?: boolean;
  className?: string;
};

/** Kutilmoqda holati — empty emas, lekin foydalanuvchi keyingi qadamni biladi. */
export function WaitingState({
  title,
  eta,
  hint,
  action,
  icon: Icon = Clock,
  compact,
  className,
}: WaitingStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-warning/20 bg-warning/5",
        compact ? "px-3 py-2.5" : "p-4",
        className,
      )}
    >
      <div className={cn("flex gap-3", compact ? "items-center" : "items-start")}>
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium text-foreground", compact ? "text-xs" : "text-sm")}>{title}</p>
          {eta && <p className="mt-0.5 text-xs text-muted-foreground">Taxminiy vaqt: {eta}</p>}
          {hint && !compact && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {hint && compact && <p className="mt-2 pl-11 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
