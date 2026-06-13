import { Link, useRouterState } from "@tanstack/react-router";

import { useSyncExternalStore } from "react";

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

  FolderOpen,

  Plus,

  Images,

  Heart,

  BarChart3,

  Package,

  Users,

  Sparkles,

  Crown,

  Receipt,

  Building2,

} from "lucide-react";

import type { ReactNode } from "react";

import { SiteNav } from "./nav";

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



import type { UserType } from "@/lib/auth-constants";



type NavItem = {

  to: string;

  label: string;

  icon: typeof LayoutDashboard;

  exact: boolean;

  roles: UserType[];

  badgeKey?: "messages" | "notifications";

  adminOnly?: boolean;

  group?: "monetization" | "ai" | "agency";

  agencyOnly?: boolean;

  agencyPermission?: AgencyPermission;

};



const allNav: NavItem[] = [

  { to: "/dashboard", label: "Mijoz", icon: LayoutDashboard, exact: true, roles: ["client"] },

  { to: "/analytics/client", label: "Analitika", icon: BarChart3, exact: false, roles: ["client"] },

  { to: "/clients/manage", label: "Frilanserlar CRM", icon: Users, exact: false, roles: ["client"] },

  { to: "/my-projects", label: "Mening loyihalarim", icon: FolderOpen, exact: false, roles: ["client"] },

  { to: "/projects/create", label: "Loyiha joylash", icon: Plus, exact: false, roles: ["client"] },

  { to: "/ai", label: "AI Markaz", icon: Sparkles, exact: false, roles: ["client"], group: "ai" },

  { to: "/portfolio", label: "Portfel", icon: Images, exact: false, roles: ["freelancer"] },

  { to: "/dashboard/freelancer", label: "Frilanser", icon: Briefcase, exact: true, roles: ["freelancer"] },

  { to: "/my-services", label: "Mening xizmatlarim", icon: Package, exact: false, roles: ["freelancer"] },

  { to: "/freelancers/manage", label: "Mijozlar CRM", icon: Users, exact: false, roles: ["freelancer"] },

  { to: "/analytics/freelancer", label: "Analitika", icon: BarChart3, exact: false, roles: ["freelancer"] },

  { to: "/applications", label: "Mening arizalarim", icon: FileText, exact: false, roles: ["freelancer"] },

  { to: "/projects", label: "Ish topish", icon: Briefcase, exact: false, roles: ["freelancer"] },

  { to: "/ai", label: "AI Markaz", icon: Sparkles, exact: false, roles: ["freelancer"], group: "ai" },

  { to: "/dashboard/agency", label: "Agentlik paneli", icon: Building2, exact: true, roles: ["client", "freelancer"], group: "agency", agencyOnly: true },

  { to: "/agency/clients", label: "Agentlik CRM", icon: Users, exact: false, roles: ["client", "freelancer"], group: "agency", agencyOnly: true, agencyPermission: "view_crm" },

  { to: "/agencies", label: "Agentliklar bozori", icon: Building2, exact: false, roles: ["client", "freelancer"], group: "agency" },

  { to: "/orders", label: "Buyurtmalar", icon: ClipboardList, exact: false, roles: ["client", "freelancer"] },

  { to: "/saved", label: "Saqlangan", icon: Heart, exact: false, roles: ["client", "freelancer"] },

  { to: "/escrow", label: "Eskrou", icon: Lock, exact: false, roles: ["client", "freelancer"] },

  { to: "/messages", label: "Xabarlar", icon: MessageSquare, exact: false, roles: ["client", "freelancer"], badgeKey: "messages" as const },

  { to: "/notifications", label: "Bildirishnomalar", icon: Bell, exact: false, roles: ["client", "freelancer"], badgeKey: "notifications" as const },

  { to: "/wallet", label: "Hamyon", icon: Wallet, exact: false, roles: ["client", "freelancer"] },

  { to: "/pricing", label: "Tariflar", icon: Receipt, exact: false, roles: ["client", "freelancer"], group: "monetization" },

  { to: "/subscription", label: "Obuna", icon: Crown, exact: false, roles: ["client", "freelancer"], group: "monetization" },

  { to: "/promotions", label: "Rivojlantirish", icon: Sparkles, exact: false, roles: ["client", "freelancer"], group: "monetization" },

  { to: "/profile", label: "Profil", icon: User, exact: false, roles: ["client", "freelancer"] },

  { to: "/settings", label: "Sozlamalar", icon: Settings, exact: false, roles: ["client", "freelancer"] },

  { to: "/admin", label: "Boshqaruv", icon: Shield, exact: false, roles: ["client", "freelancer"], adminOnly: true },

  { to: "/revenue", label: "Daromad", icon: BarChart3, exact: false, roles: ["client", "freelancer"], adminOnly: true },

];



const GROUP_HEADERS: Record<NonNullable<NavItem["group"]>, string> = {

  ai: "AI yordamchi",

  agency: "Agentlik",

  monetization: "Obuna va kreditlar",

};



function navForUser(role: UserType, isAdmin: boolean, userId?: string) {

  const agencies = userId ? getAgenciesForUser(userId) : [];

  const hasAgency = agencies.length > 0;

  const agencyWithDashboard = agencies.find((a) => userId && hasAgencyPermission(a, userId, "view_dashboard"));



  return allNav.filter((n) => {

    if (!n.roles.includes(role)) return false;

    if (n.adminOnly && !isAdmin) return false;

    if (n.agencyOnly && !hasAgency) return false;

    if (n.agencyPermission && userId) {

      const can = agencies.some((a) => hasAgencyPermission(a, userId, n.agencyPermission!));

      if (!can) return false;

    }

    if (n.to === "/dashboard/agency" && !agencyWithDashboard && hasAgency) {

      return true;

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

  const { activeRole: role } = useActiveRole();



  useSyncExternalStore(subscribeAgencies, () => user?.id ?? "", () => "");



  const nav = navForUser(role, !!user?.isAdmin, user?.id);

  const mobileNav = nav.filter((n) => !["/admin", "/settings", "/revenue"].includes(n.to));

  const msgBadge = useNavBadge("messages", user?.id);

  const notifBadge = useNavBadge("notifications", user?.id);



  const badgeFor = (n: NavItem) => {

    if (n.badgeKey === "messages") return msgBadge;

    if (n.badgeKey === "notifications") return notifBadge;

    return 0;

  };



  const groupHeaderFor = (n: NavItem, prev?: NavItem) => {

    if (!n.group || prev?.group === n.group) return null;

    return GROUP_HEADERS[n.group];

  };



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



            {nav.map((n, i) => {

              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);

              const prev = nav[i - 1];

              const groupHeader = groupHeaderFor(n, prev);

              return (

                <div key={`${n.to}-${n.label}`}>

                  {groupHeader && (

                    <div className="mb-1 mt-3 px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">

                      {groupHeader}

                    </div>

                  )}

                  <Link

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

                    {"badgeKey" in n && badgeFor(n) > 0 && !active && (

                      <span className="font-mono inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">

                        {badgeFor(n) > 9 ? "9+" : badgeFor(n)}

                      </span>

                    )}

                  </Link>

                </div>

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

        aria-label="Ish maydoni navigatsiyasi"

      >

        <div className="mx-auto flex max-w-lg items-stretch justify-around overflow-x-auto px-1 py-1">

          {mobileNav.map((n) => {

            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);

            const shortLabel =

              n.label.length > 12

                ? n.label.includes("CRM")

                  ? "CRM"

                  : n.label.includes("AI")

                    ? "AI"

                    : n.label.split(" ")[0]!

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

                {"badgeKey" in n && badgeFor(n) > 0 && !active && (

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


