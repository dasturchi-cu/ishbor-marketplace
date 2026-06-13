import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getAgenciesForUser } from "@/lib/agency-store";

export function AgencyGate({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return null;

  const agencies = getAgenciesForUser(user.id);
  if (agencies.length === 0) {
    return <Navigate to="/agencies/create" replace />;
  }

  return <>{children}</>;
}
