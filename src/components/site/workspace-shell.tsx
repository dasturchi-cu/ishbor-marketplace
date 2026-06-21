import { Link, useRouterState } from "@tanstack/react-router";
import { useSyncExternalStore, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Wallet,
  ChevronLeft,
  ChevronDown,
  ClipboardList,
  FileText,
  Lock,
  User,
  Settings,
  FolderOpen,
  Images,
  Heart,
  BarChart3,
  Package,
  Users,
  Sparkles,
  Crown,
  Receipt,
  Building2,
  Shield,
  Bell,
} from "lucide-react";
import type { ReactNode } from "react";
import { SiteNav } from "./nav";
import { RoleSwitcher } from "./role-switcher";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import { getUnreadCount, subscribeNotifications } from "@/lib/notifications-store";
import { getTotalUnread, subscribeMessages } from "@/lib/messages-store";
import {
  getAgenciesForUser,
  hasAgencyPermission,
  subscribeAgencies,
  type AgencyPermission,
} from "@/lib/agency-store";
import type { WorkspaceRole } from "@/lib/active-role-store";
import { messagesPath } from "@/lib/messages-routing";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact: boolean;
  roles: WorkspaceRole[];
  tier: "core" | "more";
  badgeKey?: "messages" | "notifications";
  adminOnly?: boolean;
  group?: "monetization" | "ai" | "agency";
  agencyOnly?: boolean;
  agencyPermission?: AgencyPermission;
};

const allNav: NavItem[] = [
  // —— Agency core ——
  { to: "/dashboard/agency", label: "Panel", icon: LayoutDashboard, exact: true, roles: ["agency"], tier: "core", group: "agency" },
  { to: "/agency/clients", label: "Agentlik CRM", icon: Users, exact: false, roles: ["agency"], tier: "core", group: "agency", agencyPermission: "view_crm" },
  { to: "/messages", label: "Xabarlar", icon: MessageSquare, exact: false, roles: ["agency"], tier: "core", badgeKey: "messages" },
  { to: "/wallet", label: "Hamyon", icon: Wallet, exact: false, roles: ["agency"], tier: "core" },

  // —— Client core (5) ——
  { to: "/dashboard", label: "Panel", icon: LayoutDashboard, exact: true, roles: ["client"], tier: "core" },
  { to: "/my-projects", label: "Loyihalarim", icon: FolderOpen, exact: false, roles: ["client"], tier: "core" },
  { to: "/orders", label: "Buyurtmalar", icon: ClipboardList, exact: false, roles: ["client"], tier: "core" },
  { to: "/messages", label: "Xabarlar", icon: MessageSquare, exact: false, roles: ["client"], tier: "core", badgeKey: "messages" },
  { to: "/wallet", label: "Hamyon", icon: Wallet, exact: false, roles: ["client"], tier: "core" },

  // —— Freelancer core (5) ——
  { to: "/dashboard/freelancer", label: "Panel", icon: LayoutDashboard, exact: true, roles: ["freelancer"], tier: "core" },
  { to: "/applications", label: "Arizalarim", icon: FileText, exact: false, roles: ["freelancer"], tier: "core" },
  { to: "/my-services", label: "Xizmatlarim", icon: Package, exact: false, roles: ["freelancer"], tier: "core" },
  { to: "/messages", label: "Xabarlar", icon: MessageSquare, exact: false, roles: ["freelancer"], tier: "core", badgeKey: "messages" },
  { to: "/wallet", label: "Hamyon", icon: Wallet, exact: false, roles: ["freelancer"], tier: "core" },

  // —— Shared secondary ——
  { to: "/analytics/client", label: "Analitika", icon: BarChart3, exact: false, roles: ["client"], tier: "more" },
  { to: "/clients/manage", label: "Frilanserlar CRM", icon: Users, exact: false, roles: ["client"], tier: "more" },
  { to: "/saved", label: "Saqlangan", icon: Heart, exact: false, roles: ["client", "freelancer", "agency"], tier: "more" },
  { to: "/escrow", label: "Eskrou", icon: Lock, exact: false, roles: ["client", "freelancer", "agency"], tier: "more" },
  { to: "/notifications", label: "Bildirishnomalar", icon: Bell, exact: false, roles: ["client", "freelancer", "agency"], tier: "more", badgeKey: "notifications" },

  { to: "/analytics/freelancer", label: "Analitika", icon: BarChart3, exact: false, roles: ["freelancer"], tier: "more" },
  { to: "/freelancers/manage", label: "Mijozlar CRM", icon: Users, exact: false, roles: ["freelancer"], tier: "more" },
  { to: "/portfolio", label: "Portfel", icon: Images, exact: false, roles: ["freelancer"], tier: "more" },
  { to: "/projects", label: "Ish topish", icon: Briefcase, exact: false, roles: ["freelancer"], tier: "more" },

  { to: "/ai", label: "AI Markaz", icon: Sparkles, exact: false, roles: ["client", "freelancer"], tier: "more", group: "ai" },
  { to: "/dashboard/agency", label: "Agentlik paneli", icon: Building2, exact: true, roles: ["client", "freelancer"], tier: "more", group: "agency", agencyOnly: true },
  { to: "/agency/clients", label: "Agentlik CRM", icon: Users, exact: false, roles: ["client", "freelancer"], tier: "more", group: "agency", agencyOnly: true, agencyPermission: "view_crm" },
  { to: "/agencies", label: "Agentliklar bozori", icon: Building2, exact: false, roles: ["client", "freelancer"], tier: "more", group: "agency" },

  { to: "/pricing", label: "Tariflar", icon: Receipt, exact: false, roles: ["client", "freelancer"], tier: "more", group: "monetization" },
  { to: "/subscription", label: "Obuna", icon: Crown, exact: false, roles: ["client", "freelancer"], tier: "more", group: "monetization" },
  { to: "/promotions", label: "Rivojlantirish", icon: Sparkles, exact: false, roles: ["client", "freelancer"], tier: "more", group: "monetization" },

  { to: "/profile", label: "Profil", icon: User, exact: false, roles: ["client", "freelancer", "agency"], tier: "more" },
  { to: "/settings", label: "Sozlamalar", icon: Settings, exact: false, roles: ["client", "freelancer", "agency"], tier: "more" },
  { to: "/admin", label: "Boshqaruv", icon: Shield, exact: false, roles: ["client", "freelancer"], tier: "more", adminOnly: true },
  { to: "/revenue", label: "Daromad", icon: BarChart3, exact: false, roles: ["client", "freelancer"], tier: "more", adminOnly: true },
];

const GROUP_HEADERS: Record<NonNullable<NavItem["group"]>, string> = {
  ai: "AI yordamchi",
  agency: "Agentlik",
  monetization: "Obuna va kreditlar",
};

function navForUser(role: WorkspaceRole, isAdmin: boolean, userId?: string) {
  const agencies = userId ? getAgenciesForUser(userId) : [];
  const hasAgency = agencies.length > 0;

  return allNav.filter((n) => {
    if (!n.roles.includes(role)) return false;
    if (n.adminOnly && !isAdmin) return false;
    if (role !== "agency" && n.agencyOnly && !hasAgency) return false;
    if (n.agencyPermission && userId) {
      const can = agencies.some((a) => hasAgencyPermission(a, userId, n.agencyPermission!));
      if (!can) return false;
    }
    return true;
  });
}

function useNavBadge(key: "messages" | "notifications", userId?: string): number {
  return useSyncExternalStore(
    key === "messages" ? subscribeMessages : subscribeNotifications,
    () => (key === "messages" ? getTotalUnread() : getUnreadCount(userId)),
    () => 0,
  );
}

function NavLink({
  n,
  pathname,
  badge,
  onClick,
}: {
  n: NavItem;
  pathname: string;
  badge: number;
  onClick?: () => void;
}) {
  const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
  const linkTarget = n.to === "/messages" ? messagesPath() : { to: n.to };
  return (
    <Link
      {...linkTarget}
      onClick={onClick}
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
      {badge > 0 && !active && (
        <span className="font-mono inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

function groupHeaderFor(n: NavItem, prev?: NavItem) {
  if (!n.group || prev?.group === n.group) return null;
  return GROUP_HEADERS[n.group];
}

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
  const { activeRole: role, availableRoles } = useActiveRole();
  const [moreOpen, setMoreOpen] = useState(false);

  useSyncExternalStore(subscribeAgencies, () => user?.id ?? "", () => "");

  const nav = navForUser(role, !!user?.isAdmin, user?.id);
  const coreNav = nav.filter((n) => n.tier === "core");
  const moreNav = nav.filter((n) => n.tier === "more");
  const msgBadge = useNavBadge("messages", user?.id);
  const notifBadge = useNavBadge("notifications", user?.id);

  const badgeFor = (n: NavItem) => {
    if (n.badgeKey === "messages") return msgBadge;
    if (n.badgeKey === "notifications") return notifBadge;
    return 0;
  };

  const moreActive = moreNav.some((n) => (n.exact ? pathname === n.to : pathname.startsWith(n.to)));

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
              <ChevronLeft className="size-3.5" /> Bozor
            </Link>

            <div className="mb-2 px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
              Ish maydoni
            </div>

            {availableRoles.length > 1 && (
              <RoleSwitcher variant="compact" className="mb-3 mx-1" />
            )}

            {coreNav.map((n) => (
              <NavLink key={`${n.to}-${n.label}`} n={n} pathname={pathname} badge={badgeFor(n)} />
            ))}

            {moreNav.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setMoreOpen((o) => !o)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-default ${
                    moreActive ? "font-medium text-primary" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <span>Yana</span>
                  <ChevronDown className={`size-4 transition-transform ${moreOpen || moreActive ? "rotate-180" : ""}`} />
                </button>
                {(moreOpen || moreActive) && (
                  <div className="mt-0.5 space-y-0.5">
                    {moreNav.map((n, i) => {
                      const prev = moreNav[i - 1];
                      const header = groupHeaderFor(n, prev);
                      return (
                        <div key={`${n.to}-${n.label}`}>
                          {header && (
                            <div className="mb-1 mt-2 px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                              {header}
                            </div>
                          )}
                          <NavLink n={n} pathname={pathname} badge={badgeFor(n)} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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
        className="liquid-glass fixed inset-x-0 bottom-0 z-50 border-t lg:hidden"
        aria-label="Ish maydoni navigatsiyasi"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-1">
          {coreNav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const shortLabel =
              n.label === "Loyihalarim" ? "Loyihalar"
              : n.label === "Xizmatlarim" ? "Xizmatlar"
              : n.label === "Arizalarim" ? "Arizalar"
              : n.label === "Buyurtmalar" ? "Buyurtma"
              : n.label;
            return (
              <Link
                key={`${n.to}-mobile`}
                to={n.to}
                className={`touch-target relative flex min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium transition-default ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <n.icon className="size-5" />
                <span className="max-w-[4.5rem] truncate">{shortLabel}</span>
                {badgeFor(n) > 0 && !active && (
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
