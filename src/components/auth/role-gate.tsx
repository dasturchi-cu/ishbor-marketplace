import type { ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { WorkspaceRole } from "@/lib/active-role-store";
import { getActiveDashboardPath } from "@/lib/active-role-store";
import { useActiveRole } from "@/hooks/use-active-role";
import { useAuth } from "@/hooks/use-auth";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import { LoadingSpinner } from "@/components/site/feedback";

export function RoleGate({
  roles,
  children,
}: {
  roles: WorkspaceRole[];
  children: ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const { activeRole } = useActiveRole();
  const navigate = useNavigate();
  const hydrated = useClientHydrated();

  const allowed = roles.includes(activeRole);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || allowed) return;
    navigate({ to: getActiveDashboardPath(activeRole), replace: true });
  }, [hydrated, isAuthenticated, allowed, activeRole, navigate]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
