import { Check } from "lucide-react";
import type { JourneyStage } from "@/lib/ftue-store";
import { cn } from "@/lib/utils";

export function JourneyMap({
  stages,
  title = "Sizning yo'lingiz",
  compact = false,
}: {
  stages: JourneyStage[];
  title?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card", compact ? "p-4" : "p-5")}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="mt-4 flex items-start justify-between gap-1 overflow-x-auto pb-1">
        {stages.map((stage, i) => (
          <div key={stage.id} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="relative flex w-full items-center justify-center">
              {i > 0 && (
                <div
                  className={cn(
                    "absolute right-1/2 left-0 top-3 h-px",
                    stages[i - 1]?.done ? "bg-primary/40" : "bg-border",
                  )}
                />
              )}
              {i < stages.length - 1 && (
                <div
                  className={cn(
                    "absolute right-0 left-1/2 top-3 h-px",
                    stage.done ? "bg-primary/40" : "bg-border",
                  )}
                />
              )}
              <div
                className={cn(
                  "relative z-10 grid size-6 place-items-center rounded-full ring-4 ring-card",
                  stage.done
                    ? "bg-primary text-primary-foreground"
                    : stage.current
                      ? "bg-primary/15 text-primary ring-primary/20"
                      : "bg-secondary text-muted-foreground",
                )}
              >
                {stage.done ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : (
                  <span className="font-mono text-[9px] font-bold">{i + 1}</span>
                )}
              </div>
            </div>
            <span
              className={cn(
                "mt-2 text-center font-mono text-[8px] uppercase leading-tight tracking-wider sm:text-[9px]",
                stage.current ? "font-bold text-primary" : stage.done ? "text-muted-foreground" : "text-muted-foreground/70",
              )}
            >
              {stage.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
