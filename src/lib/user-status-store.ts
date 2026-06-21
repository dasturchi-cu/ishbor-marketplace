import { normalizeEmail } from "./sanitize";
import { isRateLimited, rateLimitMessage } from "./rate-limit";

const STORAGE_KEY = "ishbor-user-status";

export type AccountStatus = "active" | "suspended" | "banned" | "pending";

function readAll(): Record<string, AccountStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AccountStatus>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, AccountStatus>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function setUserAccountStatus(email: string, status: AccountStatus): void {
  const key = normalizeEmail(email);
  const all = readAll();
  all[key] = status;
  writeAll(all);
}

export function getUserAccountStatus(email: string): AccountStatus {
  return readAll()[normalizeEmail(email)] ?? "active";
}

export function isLoginBlocked(email: string): boolean {
  if (isRateLimited(email)) return true;
  const status = getUserAccountStatus(email);
  return status === "suspended" || status === "banned";
}

export function loginBlockedMessage(email: string): string {
  if (isRateLimited(email)) return rateLimitMessage();
  const status = getUserAccountStatus(email);
  if (status === "suspended") {
    return "Hisobingiz vaqtincha to'xtatilgan. Qo'llab-quvvatlash bilan bog'laning.";
  }
  if (status === "banned") {
    return "Hisobingiz bloklangan. Savollar uchun support@ishbor.uz ga yozing.";
  }
  return "Kirish mumkin emas.";
}
