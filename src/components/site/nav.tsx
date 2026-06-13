import { Link, useRouterState, useNavigate } from "@tanstack/react-router";

import { Search, Bell, Wallet, MessageSquare, Menu, X, LogOut, FolderOpen, FileText, Briefcase, Plus, Sparkles, LayoutDashboard } from "lucide-react";

import { useState } from "react";

import { Logo } from "./logo";

import { ThemeToggle } from "./theme";

import { GradientAvatar } from "./avatar";

import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import { getActiveDashboardPath } from "@/lib/active-role-store";

import type { AuthUser } from "@/lib/auth";

function NavProfileLink({ user }: { user: AuthUser }) {
  const { activeRole } = useActiveRole();
  const avatar = (
    <GradientAvatar name={user.fullName} hue={user.avatarHue} size={32} />
  );

  if (activeRole === "freelancer" && user.username) {
    return (
      <Link
        to="/freelancers/$username"
        params={{ username: user.username }}
        className="touch-target ml-0.5 hidden sm:inline-flex"
      >
        {avatar}
      </Link>
    );
  }

  if (user.companySlug) {
    return (
      <Link
        to="/clients/$company"
        params={{ company: user.companySlug }}
        className="touch-target ml-0.5 hidden sm:inline-flex"
      >
        {avatar}
      </Link>
    );
  }

  return (
    <Link to="/profile" className="touch-target ml-0.5 hidden sm:inline-flex">
      {avatar}
    </Link>
  );
}



function NavBusinessActions({ user, isAuthenticated }: { user: AuthUser | null; isAuthenticated: boolean }) {
  const { activeRole } = useActiveRole();
  const secondary =
    "touch-target hidden items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition-default hover:border-primary/20 focus-ring sm:inline-flex";
  const primary =
    "touch-target inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring sm:px-4";

  if (!isAuthenticated) {
    return (
      <>
        <Link to="/projects" className={secondary}>
          <Briefcase className="size-3.5" /> Ish topish
        </Link>
        <Link to="/login" search={{ redirect: "/projects/create" }} className={primary}>
          <Plus className="size-3.5" /> Loyiha joylash
        </Link>
      </>
    );
  }

  if (activeRole === "client") {
    return (
      <>
        <Link to="/my-projects" className={secondary}>
          <FolderOpen className="size-3.5" /> Mening loyihalarim
        </Link>
        <Link to="/projects/create" className={primary}>
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Loyiha joylash</span>
          <span className="sm:hidden">Joylash</span>
        </Link>
      </>
    );
  }

  return (
    <>
      <Link to="/applications" className={secondary}>
        <FileText className="size-3.5" /> Mening arizalarim
      </Link>
      <Link to="/projects" className={primary}>
        <Briefcase className="size-3.5" />
        <span className="hidden sm:inline">Ish topish</span>
        <span className="sm:hidden">Loyihalar</span>
      </Link>
    </>
  );
}



const links = [

  { to: "/services", label: "Xizmatlar" },

  { to: "/freelancers", label: "Mutaxassislar" },

  { to: "/projects", label: "Loyihalar" },

  { to: "/agencies", label: "Agentliklar" },

  { to: "/pricing", label: "Tariflar" },

];



export function SiteNav() {

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [open, setOpen] = useState(false);

  const [mobileQ, setMobileQ] = useState("");

  const navigate = useNavigate();

  const { isAuthenticated, user, logout } = useAuth();
  const { activeRole } = useActiveRole();
  const dashboardPath = getActiveDashboardPath(activeRole);

  const onWorkspace = ["/dashboard", "/my-projects", "/portfolio", "/messages", "/notifications", "/wallet", "/admin", "/orders", "/applications", "/escrow", "/profile", "/settings", "/subscription", "/promotions", "/revenue", "/analytics", "/saved", "/ai", "/agency", "/my-services"].some(
    (p) => pathname.startsWith(p),

  );

  const onMarketplace =
    ["/services", "/freelancers", "/projects", "/agencies", "/pricing"].some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );

  const goSearch = (q: string) => {
    navigate({ to: "/services", search: { q: q.trim() || undefined } });
    setOpen(false);
  };



  return (

    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">

      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6">

        <Link to="/" className="shrink-0 touch-target inline-flex items-center">

          <Logo />

        </Link>



        <nav className="ml-2 hidden items-center gap-0.5 md:flex lg:ml-4">

          {links.map((l) => {

            const active = pathname === l.to || pathname.startsWith(l.to + "/");

            return (

              <Link

                key={l.to}

                to={l.to}

                className={`touch-target inline-flex items-center rounded-md px-3 text-sm font-medium transition-default ${

                  active

                    ? "bg-secondary text-foreground"

                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"

                }`}

              >

                {l.label}

              </Link>

            );

          })}

        </nav>



        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">

          <button
            onClick={() => goSearch("")}
            className="touch-target hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs text-muted-foreground transition-default hover:border-primary/20 hover:text-foreground sm:flex focus-ring"
          >

            <Search className="size-3.5" />

            <span>Qidiruv</span>

            <kbd className="font-mono ml-2 rounded border border-border px-1.5 py-0.5 text-[10px]">

              ⌘K

            </kbd>

          </button>



          {(onWorkspace || onMarketplace) && isAuthenticated ? (

            <>

              <Link
                to={dashboardPath}
                className={`touch-target hidden items-center gap-1.5 rounded-lg border px-2.5 transition-default focus-ring sm:inline-flex ${
                  pathname.startsWith("/dashboard")
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-surface text-foreground/70 hover:border-primary/20 hover:text-foreground"
                }`}
                aria-label="Boshqaruv paneli"
              >
                <LayoutDashboard className="size-3.5" />
                <span className="hidden text-xs font-semibold xl:inline">Panel</span>
              </Link>

              <NavBusinessActions user={user} isAuthenticated={isAuthenticated} />

              <Link
                to="/ai"
                className={`touch-target hidden items-center gap-1.5 rounded-lg border px-2.5 transition-default focus-ring sm:inline-flex ${
                  pathname.startsWith("/ai")
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-surface text-foreground/70 hover:border-primary/20 hover:text-foreground"
                }`}
                aria-label="AI Markaz"
              >
                <Sparkles className="size-3.5" />
                <span className="hidden text-xs font-semibold lg:inline">AI Markaz</span>
              </Link>

              <Link

                to="/messages"

                className="touch-target relative inline-flex items-center justify-center rounded-lg border border-border bg-surface text-foreground/70 hover:text-foreground transition-default focus-ring"

                aria-label="Xabarlar"

              >

                <MessageSquare className="size-4" />

                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary" />

              </Link>

              <Link

                to="/notifications"

                className="touch-target inline-flex items-center justify-center rounded-lg border border-border bg-surface text-foreground/70 hover:text-foreground transition-default focus-ring"

                aria-label="Bildirishnomalar"

              >

                <Bell className="size-4" />

              </Link>

              <Link

                to="/wallet"

                className="touch-target hidden items-center justify-center rounded-lg border border-border bg-surface text-foreground/70 hover:text-foreground sm:inline-flex transition-default focus-ring"

                aria-label="Hamyon"

              >

                <Wallet className="size-4" />

              </Link>

              <NavProfileLink user={user!} />

            </>

          ) : isAuthenticated ? (

            <>

              <ThemeToggle className="!size-11" />

              <Link

                to={dashboardPath}

                className="touch-target hidden items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-default hover:text-foreground sm:inline-flex"

              >

                Boshqaruv paneli

              </Link>

              <NavBusinessActions user={user} isAuthenticated={isAuthenticated} />

            </>

          ) : (

            <>

              <ThemeToggle className="!size-11" />

              <Link

                to="/login"

                className="touch-target hidden items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-default hover:text-foreground sm:inline-flex"

              >

                Kirish

              </Link>

              <NavBusinessActions user={user} isAuthenticated={isAuthenticated} />

            </>

          )}



          <button

            className="touch-target inline-flex items-center justify-center rounded-lg border border-border bg-surface md:hidden transition-default focus-ring"

            onClick={() => setOpen((o) => !o)}

            aria-label="Menyu"

          >

            {open ? <X className="size-4" /> : <Menu className="size-4" />}

          </button>

        </div>

      </div>



      {open && (

        <div className="border-t border-border bg-background md:hidden">

          <div className="mx-auto max-w-7xl space-y-1 px-3 py-3">

            <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5">

              <Search className="size-4 shrink-0 text-muted-foreground" />

              <input

                placeholder="Ishborni qidirish…"

                value={mobileQ}

                onChange={(e) => setMobileQ(e.target.value)}

                onKeyDown={(e) => e.key === "Enter" && goSearch(mobileQ)}

                className="min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"

              />

            </div>

            {links.map((l) => (

              <Link

                key={l.to}

                to={l.to}

                onClick={() => setOpen(false)}

                className="touch-target flex items-center rounded-lg px-3 text-sm font-medium text-foreground hover:bg-secondary transition-default"

              >

                {l.label}

              </Link>

            ))}

            {isAuthenticated ? (
              <>
                <Link to="/ai" onClick={() => setOpen(false)} className="touch-target flex items-center gap-2 rounded-lg px-3 text-sm font-medium text-foreground hover:bg-secondary">
                  <Sparkles className="size-4 text-primary" /> AI Markaz
                </Link>
                <Link to={dashboardPath} onClick={() => setOpen(false)} className="touch-target flex items-center rounded-lg px-3 text-sm font-medium text-foreground hover:bg-secondary">
                  Boshqaruv paneli
                </Link>
                {activeRole === "client" ? (
                  <>
                    <Link to="/my-projects" onClick={() => setOpen(false)} className="touch-target flex items-center gap-2 rounded-lg px-3 text-sm font-medium text-foreground hover:bg-secondary">
                      <FolderOpen className="size-4" /> Mening loyihalarim
                    </Link>
                    <Link to="/projects/create" onClick={() => setOpen(false)} className="touch-target flex items-center gap-2 rounded-lg px-3 text-sm font-medium text-foreground hover:bg-secondary">
                      <Plus className="size-4" /> Loyiha joylash
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/applications" onClick={() => setOpen(false)} className="touch-target flex items-center gap-2 rounded-lg px-3 text-sm font-medium text-foreground hover:bg-secondary">
                      <FileText className="size-4" /> Mening arizalarim
                    </Link>
                    <Link to="/projects" onClick={() => setOpen(false)} className="touch-target flex items-center gap-2 rounded-lg px-3 text-sm font-medium text-foreground hover:bg-secondary">
                      <Briefcase className="size-4" /> Ish topish
                    </Link>
                  </>
                )}
                <button onClick={() => { logout(); setOpen(false); }} className="touch-target flex w-full items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-secondary">
                  <LogOut className="size-4" /> Chiqish
                </button>
              </>
            ) : (
              <>
                <Link to="/projects" onClick={() => setOpen(false)} className="touch-target flex items-center gap-2 rounded-lg px-3 text-sm font-medium text-foreground hover:bg-secondary">
                  <Briefcase className="size-4" /> Ish topish
                </Link>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="touch-target flex items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-secondary transition-default"
                >
                  Kirish
                </Link>
              </>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">

              <ThemeToggle className="!size-11" />

              {!isAuthenticated && (
                <Link
                  to="/login"
                  search={{ redirect: "/projects/create" }}
                  onClick={() => setOpen(false)}
                  className="touch-target rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  Loyiha joylash
                </Link>
              )}

            </div>

          </div>

        </div>

      )}

    </header>

  );

}

