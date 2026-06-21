import { useSyncExternalStore, useCallback } from "react";
import {
  getSessionSnapshot,
  subscribe,
  applyServerSession,
  logout as clearLocalSession,
  updateSessionUser,
  type AuthSession,
} from "@/lib/auth";
import { loginSession, logoutSession, getServerSession } from "@/lib/api/session.functions";
import { ApiError, callServerFn, isOffline } from "@/lib/api-client";

let serverHydrated = false;
let hydratePromise: Promise<void> | null = null;

export function hydrateAuthFromServer(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (serverHydrated) return Promise.resolve();
  if (hydratePromise) return hydratePromise;
  hydratePromise = callServerFn(() => getServerSession(), { label: "getServerSession", retries: 1 })
    .then((result) => {
      if (result.authenticated) {
        applyServerSession(result.session);
      }
      serverHydrated = true;
    })
    .catch((error) => {
      console.warn("[auth] server session hydrate failed", error);
      serverHydrated = true;
    });
  return hydratePromise;
}

export function useAuth() {
  const session = useSyncExternalStore(
    subscribe,
    getSessionSnapshot,
    () => null,
  ) as AuthSession | null;

  const login = useCallback(async (email: string, password: string, remember = false) => {
    if (isOffline()) {
      return { ok: false as const, error: "Internet aloqasi yo'q. Qayta urinib ko'ring." };
    }
    try {
      const result = await callServerFn(
        () => loginSession({ data: { email, password, remember } }),
        { label: "loginSession" },
      );
      if (!result.ok) return result;
      applyServerSession(result.session);
      return result;
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Kirishda xatolik. Qayta urinib ko'ring.";
      return { ok: false as const, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await callServerFn(() => logoutSession(), { label: "logoutSession", retries: 0 });
    } catch (error) {
      console.warn("[auth] logout session failed", error);
    } finally {
      clearLocalSession();
    }
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: !!(session?.user?.id && session.user.email),
    login,
    logout,
    updateUser: updateSessionUser,
  };
}
