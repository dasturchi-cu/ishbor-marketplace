import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const primaryActionClass =
  "touch-target inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_oklch(0.546_0.185_257/0.25)] transition-default hover:opacity-95 focus-ring";

export const secondaryActionClass =
  "touch-target inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-default hover:border-primary/20 focus-ring";

export const textActionClass = "text-sm font-medium text-primary hover:underline";

export function PageActionBar({
  primary,
  secondary,
  className,
}: {
  primary: ReactNode;
  secondary?: ReactNode[];
  className?: string;
}) {
  const secondaries = (secondary ?? []).slice(0, 2);
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {secondaries.map((node, i) => (
        <span key={i}>{node}</span>
      ))}
      {primary}
    </div>
  );
}

export function PrimaryLink({
  to,
  params,
  search,
  children,
  className,
}: {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} params={params} search={search} className={cn(primaryActionClass, className)}>
      {children}
    </Link>
  );
}

export function SecondaryLink({
  to,
  params,
  search,
  children,
  className,
}: {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} params={params} search={search} className={cn(secondaryActionClass, className)}>
      {children}
    </Link>
  );
}
