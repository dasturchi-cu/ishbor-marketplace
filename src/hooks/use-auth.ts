import { useSyncExternalStore } from "react";
import {
  getSessionSnapshot,
  subscribe,
  loginWithCredentials,
  logout,
  updateSessionUser,
  type AuthSession,
} from "@/lib/auth";

export function useAuth() {
  const session = useSyncExternalStore(
    subscribe,
    getSessionSnapshot,
    () => null,
  ) as AuthSession | null;

  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    login: loginWithCredentials,
    logout,
    updateUser: updateSessionUser,
  };
}
