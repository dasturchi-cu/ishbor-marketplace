import { useLocation, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import { LoadingSpinner } from "@/components/site/feedback";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hydrated = useClientHydrated();

  useEffect(() => {
    if (!hydrated || isAuthenticated) return;
    navigate({ to: "/login", search: { redirect: location.pathname }, replace: true });
  }, [hydrated, isAuthenticated, location.pathname, navigate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
