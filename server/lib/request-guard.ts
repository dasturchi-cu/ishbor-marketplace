import { getRequestHeader } from "@tanstack/react-start/server";

function normalizeHost(host: string): string {
  const lower = host.toLowerCase();
  if (lower.startsWith("localhost")) return lower.replace("localhost", "127.0.0.1");
  return lower;
}

function hostFromUrl(url: string): string | null {
  try {
    return normalizeHost(new URL(url).host);
  } catch {
    return null;
  }
}

/**
 * Reject cross-origin POST requests (CSRF mitigation for cookie-based auth).
 * Skips when Origin/Referer headers are absent (same-origin navigation, some fetch clients).
 */
export function assertSameOrigin(): void {
  const host = getRequestHeader("host");
  if (!host) return;

  const expected = normalizeHost(host);
  const origin = getRequestHeader("origin");
  const referer = getRequestHeader("referer");

  if (origin) {
    const originHost = hostFromUrl(origin);
    if (originHost && originHost !== expected) {
      throw new Error("CSRF: origin mismatch");
    }
    return;
  }

  if (referer) {
    const refererHost = hostFromUrl(referer);
    if (refererHost && refererHost !== expected) {
      throw new Error("CSRF: referer mismatch");
    }
  }
}
