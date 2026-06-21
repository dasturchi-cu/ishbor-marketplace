import { useSyncExternalStore } from "react";

function subscribeSystemTheme(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getSystemDarkSnapshot() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerDarkSnapshot() {
  return false;
}

export function useEffectiveDark(theme: "light" | "dark" | "system"): boolean {
  const systemDark = useSyncExternalStore(subscribeSystemTheme, getSystemDarkSnapshot, getServerDarkSnapshot);
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return systemDark;
}
