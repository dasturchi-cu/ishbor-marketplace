import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Bell,
  Wallet,
  Shield,
  ChevronLeft,
} from "lucide-react";
import type { ReactNode } from "react";
import { SiteNav } from "./nav";

const nav = [
  { to: "/dashboard", label: "Client", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/freelancer", label: "Freelancer", icon: Briefcase, exact: true },
  { to: "/messages", label: "Messages", icon: MessageSquare, exact: false, badge: 3 },
  { to: "/notifications", label: "Notifications", icon: Bell, exact: false, badge: 3 },
  { to: "/wallet", label: "Wallet", icon: Wallet, exact: false },
  { to: "/admin", label: "Admin", icon: Shield, exact: false },
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
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-20 space-y-0.5">
            {/* Back to marketplace */}
            <Link
              to="/"
              className="mb-4 flex items-center gap-2 text-xs font-medium text-muted-foreground transition-default hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" /> Marketplace
            </Link>

            <div className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 px-3">
              Workspace
            </div>

            {nav.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-default ${
                    active
                      ? "bg-primary/8 text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <n.icon className={`size-4 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                    {n.label}
                  </span>
                  {n.badge && !active && (
                    <span className="font-mono inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {n.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
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
