import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { getServerConfig } from "../../src/lib/config.server";

export const SESSION_COOKIE = "ishbor_sid";
const REMEMBER_TTL_SEC = 60 * 60 * 24 * 30;
const SESSION_TTL_SEC = 60 * 60 * 24;

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function getSessionMaxAge(remember: boolean): number {
  return remember ? REMEMBER_TTL_SEC : SESSION_TTL_SEC;
}

export function readSessionTokenFromCookie(header: string | undefined): string | null {
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq) === SESSION_COOKIE) {
      const value = part.slice(eq + 1);
      return value || null;
    }
  }
  return null;
}

export function buildSessionCookie(token: string, remember: boolean): string {
  const config = getServerConfig();
  const secure = config.nodeEnv === "production";
  const maxAge = getSessionMaxAge(remember);
  const flags = [
    `${SESSION_COOKIE}=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) flags.push("Secure");
  return flags.join("; ");
}

export function buildClearSessionCookie(): string {
  const config = getServerConfig();
  const secure = config.nodeEnv === "production";
  const flags = [
    `${SESSION_COOKIE}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) flags.push("Secure");
  return flags.join("; ");
}

export function safeCompare(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
