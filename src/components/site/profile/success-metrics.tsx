import { Briefcase, TrendingUp, Star, Clock, Repeat2 } from "lucide-react";
import type { EnrichedFreelancer } from "@/lib/mock-data";

export function SuccessMetrics({ f }: { f: EnrichedFreelancer }) {
  const metrics = [
    { label: "Total earned", value: `$${(f.earned / 1000).toFixed(0)}k`, icon: Briefcase, accent: true },
    { label: "Jobs completed", value: f.jobs, icon: TrendingUp },
    { label: "Success score", value: `${f.successScore}/100`, icon: Star },
    { label: "On-time delivery", value: `${f.onTimeDelivery}%`, icon: Clock },
    { label: "Repeat clients", value: `${f.repeatClients}%`, icon: Repeat2 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {metrics.map((m) => (
        <div
          key={m.label}
          className={`rounded-xl border p-4 ${m.accent ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}
        >
          <div className="mb-2 inline-flex size-8 items-center justify-center rounded-lg bg-primary/8 text-primary">
            <m.icon className="size-4" />
          </div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
          <div className={`font-display mt-0.5 text-xl font-bold ${m.accent ? "text-primary" : ""}`}>
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );
}
