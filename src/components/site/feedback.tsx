import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  const sizes = { sm: "size-4 border-2", md: "size-5 border-2" };
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-primary/30 border-t-primary",
        sizes[size],
        className,
      )}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} aria-hidden />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", className)} aria-hidden>
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="size-12 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-14 rounded-md" />
      </div>
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card" aria-hidden>
      <Skeleton className="aspect-[5/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

export function MarketplaceGridSkeleton({ count = 6, variant = "card" }: { count?: number; variant?: "card" | "service" }) {
  const Item = variant === "service" ? ServiceCardSkeleton : CardSkeleton;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <Item key={i} />
      ))}
    </div>
  );
}

export function DashboardStatSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4" aria-hidden>
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="mb-2 h-8 w-28" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        compact ? "gap-3 py-10" : "gap-4 py-16",
        className,
      )}
    >
      <div className="inline-flex size-14 items-center justify-center rounded-2xl border border-border bg-gradient-to-b from-primary/8 to-transparent text-primary shadow-sm">
        <Icon className="size-6" aria-hidden />
      </div>
      <div className="max-w-sm">
        <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function InlineBanner({
  variant = "info",
  icon: Icon,
  children,
  className,
}: {
  variant?: "info" | "success" | "warning";
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-primary/20 bg-primary/5 text-foreground",
    success: "border-success/20 bg-success/5 text-foreground",
    warning: "border-warning/20 bg-warning/8 text-foreground",
  };
  const iconStyles = {
    info: "text-primary",
    success: "text-success",
    warning: "text-warning",
  };
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 text-sm", styles[variant], className)}>
      {Icon && <Icon className={cn("mt-0.5 size-4 shrink-0", iconStyles[variant])} aria-hidden />}
      <div className="min-w-0 leading-relaxed">{children}</div>
    </div>
  );
}

export function PipelineEmpty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface/50 px-3 py-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">No {label} yet</p>
    </div>
  );
}
