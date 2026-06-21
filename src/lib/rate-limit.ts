import { normalizeEmail } from "./sanitize";

const STORAGE_KEY = "ishbor-login-attempts";
const CLIENT_KEY = "ishbor-client-login-attempts";
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

type AttemptRecord = { count: number; firstAt: number };

function readAttempts(key: string): Record<string, AttemptRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, AttemptRecord>) : {};
  } catch {
    return {};
  }
}

function writeAttempts(key: string, data: Record<string, AttemptRecord>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function bumpAttempt(storeKey: string, bucketKey: string): AttemptRecord {
  const all = readAttempts(storeKey);
  const now = Date.now();
  const cur = all[bucketKey];
  const next =
    !cur || now - cur.firstAt > WINDOW_MS
      ? { count: 1, firstAt: now }
      : { count: cur.count + 1, firstAt: cur.firstAt };
  all[bucketKey] = next;
  writeAttempts(storeKey, all);
  return next;
}

export function recordFailedLogin(email: string): void {
  bumpAttempt(STORAGE_KEY, normalizeEmail(email));
}

export function isRateLimited(email: string): boolean {
  const key = normalizeEmail(email);
  const rec = readAttempts(STORAGE_KEY)[key];
  if (!rec) return false;
  if (Date.now() - rec.firstAt > WINDOW_MS) return false;
  return rec.count >= MAX_ATTEMPTS;
}

export function clearLoginAttempts(email?: string): void {
  if (typeof window === "undefined") return;
  if (!email) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  const all = readAttempts(STORAGE_KEY);
  delete all[normalizeEmail(email)];
  writeAttempts(STORAGE_KEY, all);
}

export function rateLimitMessage(): string {
  return "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring.";
}

/** Per-browser login throttle (login page). */
export function checkClientLoginRateLimit(): { allowed: boolean; retryAfterMinutes: number } {
  if (typeof window === "undefined") return { allowed: true, retryAfterMinutes: 0 };
  const rec = readAttempts(CLIENT_KEY)["client"];
  if (!rec) return { allowed: true, retryAfterMinutes: 0 };
  const elapsed = Date.now() - rec.firstAt;
  if (elapsed > WINDOW_MS) return { allowed: true, retryAfterMinutes: 0 };
  if (rec.count < MAX_ATTEMPTS) return { allowed: true, retryAfterMinutes: 0 };
  const retryAfterMinutes = Math.max(1, Math.ceil((WINDOW_MS - elapsed) / 60000));
  return { allowed: false, retryAfterMinutes };
}

export function recordLoginAttempt(): void {
  bumpAttempt(CLIENT_KEY, "client");
}
