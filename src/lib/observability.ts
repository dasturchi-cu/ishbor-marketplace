/** Client observability — error capture hook (Sentry-ready via env). */

import { reportLovableError } from "./lovable-error-reporting";

let initialized = false;

export function getClientSentryDsn(): string | undefined {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_SENTRY_DSN) {
    return String(import.meta.env.VITE_SENTRY_DSN);
  }
  return undefined;
}

export function initObservability(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("error", (event) => {
    captureClientError(event.error ?? event.message, { boundary: "window_onerror" });
  });
  window.addEventListener("unhandledrejection", (event) => {
    captureClientError(event.reason, { boundary: "unhandledrejection" });
  });
}

export function captureClientError(error: unknown, context?: Record<string, unknown>): void {
  reportLovableError(error, { observability: true, ...context });
}

export function getObservabilityStatus() {
  return {
    sentry: getClientSentryDsn() ? ("configured" as const) : ("demo" as const),
    clientErrors: true,
  };
}
