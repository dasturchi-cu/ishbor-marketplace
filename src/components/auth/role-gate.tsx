import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { UserType } from "@/lib/auth-constants";
import { getActiveDashboardPath } from "@/lib/active-role-store";
import { useActiveRole } from "@/hooks/use-active-role";
import { useAuth } from "@/hooks/use-auth";

export function RoleGate({
  roles,
  children,
}: {
  roles: UserType[];
  children: ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const { activeRole } = useActiveRole();

  if (!isAuthenticated) return null;

  if (!roles.includes(activeRole)) {
    return <Navigate to={getActiveDashboardPath(activeRole)} replace />;
  }

  return <>{children}</>;
}
