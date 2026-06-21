import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useLayoutEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import { LoadingSpinner } from "@/components/site/feedback";

function redirectToLogin(pathname: string, search: string) {
  const redirect = encodeURIComponent(`${pathname}${search}`);
  window.location.replace(`/login?redirect=${redirect}`);
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const hydrated = useClientHydrated();

  useLayoutEffect(() => {
    if (!hydrated || isAuthenticated) return;
    redirectToLogin(location.pathname, window.location.search);
  }, [hydrated, isAuthenticated, location.pathname]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
