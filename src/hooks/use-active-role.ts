import { useSyncExternalStore } from "react";
import type { WorkspaceRole } from "@/lib/active-role-store";
import {
  getActiveRole,
  setActiveRole,
  subscribeActiveRole,
  getAvailableWorkspaceRoles,
} from "@/lib/active-role-store";
import { useAuth } from "@/hooks/use-auth";

export function useActiveRole() {
  const { user } = useAuth();
  const fallback: WorkspaceRole = user?.userType ?? "client";

  const activeRole = useSyncExternalStore(
    subscribeActiveRole,
    getActiveRole,
    () => fallback,
  );

  const availableRoles = user ? getAvailableWorkspaceRoles(user.id) : (["client", "freelancer"] as WorkspaceRole[]);

  const switchRole = (role: WorkspaceRole) => setActiveRole(role);

  return { activeRole, switchRole, availableRoles };
}
