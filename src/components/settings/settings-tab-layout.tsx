import type { ReactNode } from "react";

export function SettingsTabLayout({
  title,
  description,
  stats,
  children,
  sidebar,
}: {
  title: string;
  description?: string;
  stats?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
}) {
  return (
    <div className="premium-page-content space-y-6">
      {(title || description) && (
        <div className="border-b border-border pb-5">
          {title && <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>}
          {description && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
      )}
      {stats}
      <div className={sidebar ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]" : ""}>
        <div className="order-2 space-y-5 xl:order-1">{children}</div>
        {sidebar && (
          <div className="order-1 space-y-4 xl:order-2 xl:sticky xl:top-24 xl:self-start">{sidebar}</div>
        )}
      </div>
    </div>
  );
}

export function SettingsSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border bg-elevated/40 px-4 py-3.5 sm:px-5">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
