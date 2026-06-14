import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { RoleSwitcher } from "@/components/site/role-switcher";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import { getActiveDashboardPath, getRedirectAfterRoleSwitch } from "@/lib/active-role-store";

export function FreelancerOnlyGate({
  title,
  description,
  redirectPath,
  children,
}: {
  title: string;
  description: string;
  redirectPath: string;
  children: ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const { activeRole } = useActiveRole();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (activeRole === "freelancer") return;
    const redirect = getRedirectAfterRoleSwitch(activeRole, pathname);
    if (redirect) {
      navigate({ to: redirect, replace: true });
    }
  }, [activeRole, pathname, navigate]);

  if (activeRole !== "freelancer") {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{description}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Siz hozir{" "}
            <span className="font-medium text-foreground">
              {activeRole === "client" ? "mijoz" : activeRole}
            </span>{" "}
            rejimidasiz. Portfolio faqat frilanser rejimida mavjud.
          </p>
          {isAuthenticated ? (
            <div className="mt-8 space-y-4">
              <RoleSwitcher variant="compact" className="mx-auto w-fit" />
              <Link
                to={getActiveDashboardPath(activeRole)}
                className="inline-block text-sm text-muted-foreground hover:text-foreground"
              >
                {activeRole === "client" ? "Mijoz paneliga qaytish" : "Panelga qaytish"}
              </Link>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-3">
              <Link
                to="/login"
                search={{ redirect: redirectPath }}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Kirish
              </Link>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                Bosh sahifaga qaytish
              </Link>
            </div>
          )}
        </div>
        <SiteFooter />
      </div>
    );
  }

  return <>{children}</>;
}
