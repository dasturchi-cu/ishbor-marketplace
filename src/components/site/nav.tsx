import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Bell, Wallet, MessageSquare, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme";
import { GradientAvatar } from "./avatar";

const links = [
  { to: "/services", label: "Services" },
  { to: "/freelancers", label: "Talent" },
  { to: "/projects", label: "Projects" },
];

export function SiteNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const onWorkspace = ["/dashboard", "/messages", "/notifications", "/wallet", "/admin"].some(
    (p) => pathname.startsWith(p),
  );

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
          <button className="touch-target hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs text-muted-foreground transition-default hover:border-primary/20 hover:text-foreground sm:flex focus-ring">
            <Search className="size-3.5" />
            <span>Search</span>
            <kbd className="font-mono ml-2 rounded border border-border px-1.5 py-0.5 text-[10px]">
              ⌘K
            </kbd>
          </button>

          {onWorkspace ? (
            <>
              <Link
                to="/messages"
                className="touch-target relative inline-flex items-center justify-center rounded-lg border border-border bg-surface text-foreground/70 hover:text-foreground transition-default focus-ring"
                aria-label="Messages"
              >
                <MessageSquare className="size-4" />
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary" />
              </Link>
              <Link
                to="/notifications"
                className="touch-target inline-flex items-center justify-center rounded-lg border border-border bg-surface text-foreground/70 hover:text-foreground transition-default focus-ring"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
              </Link>
              <Link
                to="/wallet"
                className="touch-target hidden items-center justify-center rounded-lg border border-border bg-surface text-foreground/70 hover:text-foreground sm:inline-flex transition-default focus-ring"
                aria-label="Wallet"
              >
                <Wallet className="size-4" />
              </Link>
              <Link to="/dashboard" className="touch-target ml-0.5 hidden sm:inline-flex">
                <GradientAvatar name="You There" hue={250} size={32} />
              </Link>
            </>
          ) : (
            <>
              <ThemeToggle className="!size-11" />
              <Link
                to="/login"
                className="touch-target hidden items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-default hover:text-foreground sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                to="/projects"
                className="touch-target inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring sm:px-4"
              >
                <span className="sm:hidden">Post</span>
                <span className="hidden sm:inline">Post a project</span>
              </Link>
            </>
          )}

          <button
            className="touch-target inline-flex items-center justify-center rounded-lg border border-border bg-surface md:hidden transition-default focus-ring"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
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
                placeholder="Search Ishbor…"
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
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="touch-target flex items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-secondary transition-default"
            >
              Sign in
            </Link>
            <div className="flex items-center justify-between gap-3 pt-2">
              <ThemeToggle className="!size-11" />
              <Link
                to="/projects"
                onClick={() => setOpen(false)}
                className="touch-target rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Post a project
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
