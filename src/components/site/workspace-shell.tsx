import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Bell,
  Wallet,
  Shield,
} from "lucide-react";
import type { ReactNode } from "react";
import { SiteNav } from "./nav";

const nav = [
  { to: "/dashboard", label: "Client", icon: LayoutDashboard },
  { to: "/dashboard/freelancer", label: "Freelancer", icon: Briefcase },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/admin", label: "Admin", icon: Shield },
];

export function WorkspaceShell({
  title,
  eyebrow,
  actions,
  children,
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-20 space-y-0.5">
            {nav.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-default ${
                    active
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <n.icon className="size-4" />
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              {eyebrow && (
                <div className="font-mono mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  {eyebrow}
                </div>
              )}
              <h1 className="font-display truncate text-2xl font-bold tracking-tight sm:text-3xl">
                {title}
              </h1>
            </div>
            {actions && <div className="shrink-0">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}