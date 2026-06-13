import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, ShieldCheck, Briefcase, Package, ClipboardList,
  FileText, Lock, AlertTriangle, CreditCard, Eye, Headphones, BarChart3,
  ScrollText, Server, ChevronLeft, Menu, Search, Command,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { SiteNav } from "@/components/site/nav";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAdmin, useAdminKeyboard } from "./admin-context";
import { canAccessSection, ADMIN_ROLE_LABELS, type AdminSection } from "@/lib/admin-roles";
import { adminStats } from "@/lib/admin-mock-data";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  section: AdminSection;
  badge?: number;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, section: "dashboard", exact: true },
  { to: "/admin/users", label: "Users", icon: Users, section: "users" },
  { to: "/admin/verifications", label: "Verifications", icon: ShieldCheck, section: "verifications", badge: adminStats.verificationRequests },
  { to: "/admin/projects", label: "Projects", icon: Briefcase, section: "projects" },
  { to: "/admin/services", label: "Services", icon: Package, section: "services" },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList, section: "orders" },
  { to: "/admin/applications", label: "Applications", icon: FileText, section: "applications" },
  { to: "/admin/escrow", label: "Escrow", icon: Lock, section: "escrow" },
  { to: "/admin/disputes", label: "Disputes", icon: AlertTriangle, section: "disputes", badge: adminStats.disputes },
  { to: "/admin/payments", label: "Payments", icon: CreditCard, section: "payments" },
  { to: "/admin/moderation", label: "Moderation", icon: Eye, section: "moderation" },
  { to: "/admin/support", label: "Support", icon: Headphones, section: "support" },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, section: "analytics" },
  { to: "/admin/audit", label: "Audit Logs", icon: ScrollText, section: "audit" },
  { to: "/admin/system", label: "System Health", icon: Server, section: "system" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useAdmin();
  const items = NAV_ITEMS.filter((n) => canAccessSection(role, n.section));

  return (
    <nav className="space-y-0.5">
      {items.map((n) => {
        const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-default",
              active ? "bg-primary/8 font-medium text-primary" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-2.5">
              <n.icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {n.label}
            </span>
            {n.badge && !active && (
              <Badge variant="default" className="size-5 justify-center rounded-full p-0 text-[9px]">
                {n.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  title,
  eyebrow,
  actions,
  children,
  onSearchOpen,
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  onSearchOpen?: () => void;
}) {
  const { role, setRole, adminName } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  useAdminKeyboard(() => onSearchOpen?.());

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto grid max-w-[1600px] gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border lg:block">
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col p-4">
            <Link to="/" className="mb-4 flex items-center gap-2 text-xs font-medium text-muted-foreground transition-default hover:text-foreground">
              <ChevronLeft className="size-3.5" /> Marketplace
            </Link>

            <div className="mb-3 flex items-center gap-2 px-1">
              <Logo className="size-6" />
              <div>
                <div className="font-display text-sm font-bold">Admin OS</div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Ishbor Enterprise</div>
              </div>
            </div>

            <div className="mb-4 px-1">
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ADMIN_ROLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="mb-2 px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                Operations
              </div>
              <NavLinks />
            </div>

            <div className="mt-4 rounded-lg border border-border bg-card p-3">
              <div className="text-xs font-medium">{adminName}</div>
              <div className="font-mono text-[10px] text-muted-foreground">{ADMIN_ROLE_LABELS[role]}</div>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="sticky top-16 z-40 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-lg sm:px-6 lg:px-8">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="mb-4 font-display text-lg font-bold">Admin OS</div>
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            {onSearchOpen && (
              <Button variant="outline" className="hidden flex-1 justify-start gap-2 text-muted-foreground sm:flex sm:max-w-xs" onClick={onSearchOpen}>
                <Search className="size-4" />
                <span className="text-sm">Search admin…</span>
                <kbd className="ml-auto hidden rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] sm:inline">⌘K</kbd>
              </Button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:inline-flex">
                <Command className="mr-1 size-3" /> Live
              </Badge>
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
          </div>
        </main>
      </div>
    </div>
  );
}
