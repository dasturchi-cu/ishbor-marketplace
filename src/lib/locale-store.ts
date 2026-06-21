export type AppLocale = "uz" | "en" | "ru";

const STORAGE_KEY = "ishbor-locale";
const listeners = new Set<() => void>();

let cachedLocale: AppLocale | null = null;

function notify() {
  listeners.forEach((l) => l());
}

function readLocale(): AppLocale {
  if (typeof window === "undefined") return "uz";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "en" || raw === "ru" || raw === "uz") return raw;
  } catch {
    /* ignore */
  }
  return "uz";
}

export function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocale(): AppLocale {
  if (cachedLocale === null) {
    cachedLocale = readLocale();
  }
  return cachedLocale;
}

export function setLocale(locale: AppLocale) {
  if (typeof window === "undefined") return;
  cachedLocale = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale === "uz" ? "uz" : locale;
  notify();
}
