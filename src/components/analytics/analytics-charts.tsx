import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const ActivityChartInner = lazy(() =>
  import("./analytics-recharts-inner").then((m) => ({ default: m.ActivityChartInner })),
);
const SpendChartInner = lazy(() =>
  import("./analytics-recharts-inner").then((m) => ({ default: m.SpendChartInner })),
);

const PRIMARY = "#2563EB";

export function AnalyticsChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}>
      <div className="border-b border-border bg-elevated/30 px-5 py-4">
        <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function AnalyticsRangeToggle({
  value,
  onChange,
}: {
  value: 7 | 30 | 90;
  onChange: (v: 7 | 30 | 90) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
      {([7, 30, 90] as const).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "touch-target rounded-lg px-3.5 py-1.5 text-xs font-medium transition-default focus-ring",
            value === r
              ? "bg-primary text-primary-foreground shadow-[0_4px_12px_-2px_oklch(0.546_0.185_257/0.35)]"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
          )}
        >
          {r} kun
        </button>
      ))}
    </div>
  );
}

export function AnalyticsStatCard({
  label,
  value,
  sub,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border px-4 py-4 transition-default",
        accent
          ? "border-primary/20 bg-gradient-to-br from-primary/[0.08] to-primary/[0.02]"
          : "border-border bg-card",
      )}
    >
      {accent && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full opacity-30"
          style={{ background: `radial-gradient(closest-side, ${PRIMARY}59, transparent)` }}
        />
      )}
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className={cn("font-display mt-1.5 text-xl font-bold tracking-tight sm:text-2xl", accent && "text-primary")}>
            {value}
          </div>
          {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
        </div>
        {Icon && (
          <div
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl",
              accent ? "bg-primary/10 text-primary" : "bg-secondary/80 text-muted-foreground",
            )}
          >
            <Icon className="size-4" />
          </div>
        )}
      </div>
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/10 px-4 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-52 items-end gap-2 rounded-xl border border-border bg-secondary/10 px-4 pb-4 pt-8">
      {[40, 65, 30, 80, 50, 70].map((h, i) => (
        <div key={i} className="flex-1 animate-pulse rounded-t-md bg-primary/15" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

function ClientChart({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <ChartSkeleton />;
  return <Suspense fallback={<ChartSkeleton />}>{children}</Suspense>;
}

export function AnalyticsActivityChart({
  data,
  range,
}: {
  data: { label: string; value: number }[];
  range: 7 | 30 | 90;
}) {
  const chartData = data.map((d) => ({ name: d.label, value: d.value }));
  const hasData = chartData.some((d) => d.value > 0);

  if (!hasData) {
    return <ChartEmpty message="Tanlangan davrda yollash faolligi qayd etilmagan." />;
  }

  return (
    <ClientChart>
      <ActivityChartInner chartData={chartData} range={range} />
    </ClientChart>
  );
}

export function AnalyticsSpendChart({ data }: { data: { month: string; value: number }[] }) {
  const chartData = data.map((d) => ({ name: d.month, value: d.value }));
  const hasData = chartData.some((d) => d.value > 0);
  const max = Math.max(...chartData.map((d) => d.value), 0);

  if (!hasData) {
    return <ChartEmpty message="Oylik xarajatlar hali qayd etilmagan — buyurtma yoki eskrou boshlanganda ko'rinadi." />;
  }

  return (
    <ClientChart>
      <SpendChartInner chartData={chartData} max={max} />
    </ClientChart>
  );
}
