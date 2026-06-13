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
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {stats}
      <div className={sidebar ? "grid gap-6 lg:grid-cols-[1fr_300px]" : ""}>
        <div className="space-y-4">{children}</div>
        {sidebar && <div className="space-y-4">{sidebar}</div>}
      </div>
    </div>
  );
}

export function SettingsSection({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-background/50 p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
