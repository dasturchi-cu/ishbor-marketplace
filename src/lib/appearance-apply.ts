import { getUserSettings } from "./settings-store";

let systemThemeCleanup: (() => void) | null = null;

function syncSystemThemeListener(userId: string, theme: "light" | "dark" | "system") {
  if (typeof window === "undefined") return;
  systemThemeCleanup?.();
  systemThemeCleanup = null;
  if (theme !== "system") return;

  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    const { appearance } = getUserSettings(userId);
    if (appearance.theme !== "system") return;
    document.documentElement.classList.toggle("dark", mq.matches);
  };
  mq.addEventListener("change", onChange);
  systemThemeCleanup = () => mq.removeEventListener("change", onChange);
}

export function applyThemeClass(theme: "light" | "dark" | "system") {
  if (typeof document === "undefined") return;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  if (theme === "system") {
    localStorage.removeItem("ishbor-theme");
  } else {
    localStorage.setItem("ishbor-theme", theme);
  }
}

export function applyAppearancePrefs(userId: string) {
  if (typeof document === "undefined") return;
  const { appearance } = getUserSettings(userId);
  applyThemeClass(appearance.theme);
  syncSystemThemeListener(userId, appearance.theme);
  document.documentElement.dataset.compact = appearance.compactMode ? "true" : "";
  document.documentElement.dataset.animations = appearance.animations ? "on" : "off";
  document.documentElement.style.fontSize =
    appearance.fontSize === "sm" ? "14px" : appearance.fontSize === "lg" ? "18px" : "16px";
}
