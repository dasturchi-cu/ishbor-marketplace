import { useSyncExternalStore } from "react";
import type { UserType } from "@/lib/auth-constants";
import {
  getActiveRole,
  setActiveRole,
  subscribeActiveRole,
} from "@/lib/active-role-store";
import { useAuth } from "@/hooks/use-auth";

export function useActiveRole() {
  const { user } = useAuth();
  const fallback = user?.userType ?? "client";

  const activeRole = useSyncExternalStore(
    subscribeActiveRole,
    getActiveRole,
    () => fallback,
  );

  const switchRole = (role: UserType) => setActiveRole(role);

  return { activeRole, switchRole };
}
