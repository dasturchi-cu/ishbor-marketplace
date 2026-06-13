import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { loginDemo, logout } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";

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
  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  const navigate = useNavigate();

  if (activeRole !== "freelancer") {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{description}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Siz{" "}
            <span className="font-medium text-foreground">{activeRole}</span> rejimidasiz.{" "}
            Portfolio faqat frilanser rejimida mavjud.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                logout();
                navigate({ to: "/login", search: { redirect: redirectPath } });
              }}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Freelancer sifatida kirish
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                loginDemo("freelancer");
                navigate({ to: redirectPath });
              }}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:border-primary/20"
            >
              Demo freelancerni sinab ko'rish (Nargiza)
            </button>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Mijoz paneliga qaytish
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return <>{children}</>;
}
