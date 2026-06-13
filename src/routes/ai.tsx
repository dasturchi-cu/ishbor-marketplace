import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, LayoutDashboard } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { AuthGate } from "@/components/auth/auth-gate";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/ai")({
  beforeLoad: requireAuth,
  component: AiLayout,
});

function AiLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHub = pathname === "/ai" || pathname === "/ai/";

  if (isHub) {
    return (
      <AuthGate>
        <Outlet />
      </AuthGate>
    );
  }

  return (
    <AuthGate>
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/ai"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-default hover:border-primary/25 hover:text-foreground"
            >
              <LayoutDashboard className="size-3.5" />
              AI Markaz
            </Link>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="font-display text-sm font-semibold">Asbob</span>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1.5 text-xs sm:ml-auto">
            <AiNavLink to="/ai/onboarding">Boshlash</AiNavLink>
            <AiNavLink to="/ai/project-generator">Loyiha</AiNavLink>
            <AiNavLink to="/ai/proposal-assistant">Taklif</AiNavLink>
            <AiNavLink to="/ai/portfolio-optimizer">Portfel</AiNavLink>
            <AiNavLink to="/ai/trust-coach">Ishonch</AiNavLink>
          </nav>
        </div>
      </div>
      <Outlet />
    </div>
    </AuthGate>
  );
}


function AiNavLink({ to, children }: { to: string; children: import("react").ReactNode }) {

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const active = pathname === to || pathname.startsWith(`${to}/`);

  return (

    <Link

      to={to}

      className={`rounded-md px-2.5 py-1.5 font-medium transition-default ${

        active

          ? "bg-primary text-primary-foreground"

          : "text-muted-foreground hover:bg-secondary hover:text-foreground"

      }`}

    >

      {children}

    </Link>

  );

}

