import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { getActiveDashboardPath } from "@/lib/active-role-store";
import { loginWithCredentials, logout } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";

export function AdminOnlyGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Admin kirishi talab qilinadi</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Ishbor admin konsoliga kirish uchun administrator hisobiga kiring.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/login", search: { redirect: "/admin" } })}
            className="mt-8 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Kirish
          </button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Kirish rad etildi</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Admin konsoli faqat Ishbor platforma administratorlari uchun cheklangan.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{user.fullName}</span> ({activeRole === "freelancer" ? "frilanser" : "mijoz"} rejimida) kirdingiz.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              to={getActiveDashboardPath(activeRole)}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Ish maydoniga qaytish
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                loginWithCredentials("admin@ishbor.uz", "demo1234");
                navigate({ to: "/admin" });
              }}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:border-primary/20"
            >
              Demo adminni sinab ko'rish
            </button>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return <>{children}</>;
}
