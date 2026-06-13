import { Briefcase, TrendingUp, Star, Clock, Repeat2 } from "lucide-react";
import type { EnrichedFreelancer } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type LiveMetrics = {
  earned: number;
  jobs: number;
  successScore: number;
  onTimeDelivery: number;
  repeatClients: number;
};

export function SuccessMetrics({
  f,
  live,
  className = "",
}: {
  f: EnrichedFreelancer;
  live?: LiveMetrics;
  className?: string;
}) {
  const earned = live?.earned ?? f.earned;
  const jobs = live?.jobs ?? f.jobs;
  const successScore = live?.successScore ?? f.successScore;
  const onTimeDelivery = live?.onTimeDelivery ?? f.onTimeDelivery;
  const repeatClients = live?.repeatClients ?? f.repeatClients;

  const metrics = [
    { label: "Jami daromad", value: `$${(earned / 1000).toFixed(0)}k`, icon: Briefcase, highlight: true },
    { label: "Bajarilgan ishlar", value: String(jobs), icon: TrendingUp },
    { label: "Muvaffaqiyat balli", value: `${successScore}`, icon: Star, suffix: "/100" },
    { label: "O'z vaqtida yetkazish", value: `${onTimeDelivery}%`, icon: Clock },
    { label: "Takror mijozlar", value: `${repeatClients}%`, icon: Repeat2 },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-5",
        className,
      )}
    >
      {metrics.map((m) => (
        <div
          key={m.label}
          className={cn(
            "group flex flex-col justify-between bg-card px-4 py-4 transition-default hover:bg-secondary/30",
            m.highlight && "bg-primary/[0.04] hover:bg-primary/[0.07]",
          )}
        >
          <div
            className={cn(
              "mb-3 inline-flex size-9 items-center justify-center rounded-lg transition-default",
              m.highlight ? "bg-primary/12 text-primary" : "bg-secondary text-muted-foreground group-hover:text-primary",
            )}
          >
            <m.icon className="size-4" strokeWidth={2} />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{m.label}</div>
            <div className="mt-1 flex items-baseline gap-0.5">
              <span
                className={cn(
                  "font-display text-2xl font-bold tracking-tight",
                  m.highlight ? "text-primary" : "text-foreground",
                )}
              >
                {m.value}
              </span>
              {m.suffix && (
                <span className="font-mono text-xs text-muted-foreground">{m.suffix}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
