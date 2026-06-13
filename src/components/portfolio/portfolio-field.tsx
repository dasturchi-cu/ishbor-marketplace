import type { ReactNode } from "react";

export function PortfolioField({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="font-mono mb-2 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export const portfolioInputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-default focus:border-primary/30 focus:ring-2 focus:ring-primary/10";

export const portfolioTextareaClass =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-default focus:border-primary/30 focus:ring-2 focus:ring-primary/10 min-h-[100px] resize-y";
