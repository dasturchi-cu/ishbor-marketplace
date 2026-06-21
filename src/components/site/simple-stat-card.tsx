import { cn } from "@/lib/utils";

type SimpleStatCardProps = {
  label: string;
  value: string;
  sub?: string;
  className?: string;
};

/** Sodda stat kartochka — barcha ish maydoni sahifalarida bir xil ko'rinish. */
export function SimpleStatCard({ label, value, sub, className }: SimpleStatCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card px-4 py-3", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display mt-1 text-xl font-bold tracking-tight">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
