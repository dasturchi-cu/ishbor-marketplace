import {
  UserPlus, ShoppingCart, Lock, AlertTriangle, Flag, type LucideIcon,
} from "lucide-react";
import { GradientAvatar } from "@/components/site/avatar";
import type { ActivityEvent } from "@/lib/admin-mock-data";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<ActivityEvent["type"], LucideIcon> = {
  registration: UserPlus,
  order: ShoppingCart,
  escrow: Lock,
  dispute: AlertTriangle,
  report: Flag,
};

const TYPE_COLORS: Record<ActivityEvent["type"], string> = {
  registration: "text-primary bg-primary/10",
  order: "text-success bg-success/10",
  escrow: "text-primary bg-primary/10",
  dispute: "text-destructive bg-destructive/10",
  report: "text-warning bg-warning/10",
};

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="space-y-1">
      {events.map((e) => {
        const Icon = TYPE_ICONS[e.type];
        return (
          <div key={e.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 premium-list-row hover:bg-secondary/30">
            {e.hue ? (
              <GradientAvatar name={e.description.split("—")[0]?.trim() ?? e.title} hue={e.hue} size={32} />
            ) : (
              <div className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-lg", TYPE_COLORS[e.type])}>
                <Icon className="size-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{e.title}</div>
              <div className="text-xs text-muted-foreground">{e.description}</div>
            </div>
            <div className="font-mono shrink-0 text-[10px] text-muted-foreground">{e.time}</div>
          </div>
        );
      })}
    </div>
  );
}

export function HealthIndicator({ status }: { status: "healthy" | "degraded" | "down" }) {
  const colors = {
    healthy: "bg-success",
    degraded: "bg-warning",
    down: "bg-destructive",
  };
  return (
    <span className="relative inline-flex size-2.5">
      <span className={cn("absolute inline-flex size-full rounded-full opacity-75 animate-ping", colors[status])} />
      <span className={cn("relative inline-flex size-2.5 rounded-full", colors[status])} />
    </span>
  );
}
