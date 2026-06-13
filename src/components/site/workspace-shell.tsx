import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Bell,
  Wallet,
  Shield,
  ChevronLeft,
  ClipboardList,
  FileText,
  Lock,
  User,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import { SiteNav } from "./nav";
import { useAuth } from "@/hooks/use-auth";

const allNav = [
  { to: "/dashboard", label: "Client", icon: LayoutDashboard, exact: true, roles: ["client"] as const },
  { to: "/dashboard/freelancer", label: "Freelancer", icon: Briefcase, exact: true, roles: ["freelancer"] as const },
  { to: "/orders", label: "Orders", icon: ClipboardList, exact: false, roles: ["client", "freelancer"] as const },
  { to: "/applications", label: "Applications", icon: FileText, exact: false, roles: ["freelancer"] as const },
  { to: "/escrow", label: "Escrow", icon: Lock, exact: false, roles: ["client", "freelancer"] as const },
  { to: "/messages", label: "Messages", icon: MessageSquare, exact: false, roles: ["client", "freelancer"] as const, badge: 3 },
  { to: "/notifications", label: "Notifications", icon: Bell, exact: false, roles: ["client", "freelancer"] as const, badge: 3 },
  { to: "/wallet", label: "Wallet", icon: Wallet, exact: false, roles: ["client", "freelancer"] as const },
  { to: "/profile", label: "Profile", icon: User, exact: false, roles: ["client", "freelancer"] as const },
  { to: "/settings", label: "Settings", icon: Settings, exact: false, roles: ["client", "freelancer"] as const },
  { to: "/admin", label: "Admin", icon: Shield, exact: false, roles: ["client", "freelancer"] as const },
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
  const { user } = useAuth();
  const role = user?.userType ?? "client";
  const nav = allNav.filter((n) => n.roles.includes(role));
  const mobileNav = nav.filter((n) => !["/admin", "/settings", "/profile", "/escrow"].includes(n.to));

  return (
    <div className="min-h-screen overflow-x-clip bg-background pb-[4.5rem] lg:pb-0">
      <SiteNav />
      <div className="mx-auto grid max-w-7xl gap-6 px-3 py-5 sm:gap-8 sm:px-6 sm:py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-20 space-y-0.5">
            <Link
              to="/"
              className="mb-4 flex items-center gap-2 text-xs font-medium text-muted-foreground transition-default hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" /> Marketplace
            </Link>

            <div className="mb-2 px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
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
                      ? "bg-primary/8 font-medium text-primary"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <n.icon className={`size-4 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                    {n.label}
                  </span>
                  {"badge" in n && n.badge && !active && (
                    <span className="font-mono inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {n.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              {eyebrow && (
                <div className="font-mono mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  {eyebrow}
                </div>
              )}
              <h1 className="font-display truncate text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                {title}
              </h1>
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
          </div>
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg lg:hidden"
        aria-label="Workspace navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-1">
          {mobileNav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`touch-target relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium transition-default ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <n.icon className="size-5" />
                <span className="truncate">{n.label}</span>
                {"badge" in n && n.badge && !active && (
                  <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
