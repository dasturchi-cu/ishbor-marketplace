import { eq } from "drizzle-orm";

import {
  buildClearSessionCookie,
  buildSessionCookie,
  generateSessionToken,
  hashSessionToken,
  readSessionTokenFromCookie,
} from "./session-cookie";
import type { VerifiedCredential } from "./credentials";
import type { AuthUser } from "../../src/lib/auth";

export type ServerSessionPayload = {
  user: AuthUser;
  remember: boolean;
  dbSessionId?: string;
};

/** In-memory sessions for demo/dev when DB unavailable. */
const memorySessions = new Map<
  string,
  { user: AuthUser; remember: boolean; expiresAt: number }
>();

function cleanupMemorySessions() {
  const now = Date.now();
  for (const [hash, session] of memorySessions) {
    if (session.expiresAt <= now) memorySessions.delete(hash);
  }
}

export async function createServerSession(
  credential: VerifiedCredential,
  remember: boolean,
  userAgent?: string,
): Promise<{ token: string; cookie: string; user: AuthUser }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const cookie = buildSessionCookie(token, remember);

  try {
    const { isDatabaseConfigured, getDb } = await import("../db/index");
    if (isDatabaseConfigured() && credential.dbUserId) {
      const { sessions } = await import("../db/schema");
      const db = getDb();
      const ttlMs = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      await db.insert(sessions).values({
        userId: credential.dbUserId,
        tokenHash,
        remember,
        userAgent,
        expiresAt: new Date(Date.now() + ttlMs),
      });
      return { token, cookie, user: credential.user };
    }
  } catch {
    /* memory fallback */
  }

  const ttlMs = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  memorySessions.set(tokenHash, {
    user: credential.user,
    remember,
    expiresAt: Date.now() + ttlMs,
  });
  cleanupMemorySessions();
  return { token, cookie, user: credential.user };
}

export async function readServerSession(
  cookieHeader: string | undefined,
): Promise<ServerSessionPayload | null> {
  const token = readSessionTokenFromCookie(cookieHeader);
  if (!token) return null;
  const tokenHash = hashSessionToken(token);

  try {
    const { isDatabaseConfigured, getDb } = await import("../db/index");
    if (isDatabaseConfigured()) {
      const { sessions, users } = await import("../db/schema");
      const db = getDb();
      const rows = await db
        .select({
          session: sessions,
          user: users,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.tokenHash, tokenHash))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      if (row.session.expiresAt.getTime() <= Date.now()) return null;
      if (row.user.accountStatus === "suspended" || row.user.accountStatus === "banned") {
        return null;
      }
      return {
        user: {
          id: row.user.id,
          email: row.user.email,
          fullName: row.user.fullName,
          userType: row.user.userType,
          username: row.user.username ?? undefined,
          companySlug: row.user.companySlug ?? undefined,
          company: row.user.company ?? undefined,
          avatarHue: row.user.avatarHue,
          bio: row.user.bio ?? undefined,
          location: row.user.location ?? undefined,
          verified: row.user.verified,
          isAdmin: row.user.isAdmin || undefined,
        },
        remember: row.session.remember,
        dbSessionId: row.session.id,
      };
    }
  } catch {
    /* memory fallback */
  }

  const mem = memorySessions.get(tokenHash);
  if (!mem || mem.expiresAt <= Date.now()) {
    memorySessions.delete(tokenHash);
    return null;
  }
  return { user: mem.user, remember: mem.remember };
}

export async function destroyServerSession(cookieHeader: string | undefined): Promise<string> {
  const token = readSessionTokenFromCookie(cookieHeader);
  if (token) {
    const tokenHash = hashSessionToken(token);
    try {
      const { isDatabaseConfigured, getDb } = await import("../db/index");
      if (isDatabaseConfigured()) {
        const { sessions } = await import("../db/schema");
        const db = getDb();
        await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
      }
    } catch {
      /* ignore */
    }
    memorySessions.delete(tokenHash);
  }
  return buildClearSessionCookie();
}

export { buildClearSessionCookie, buildSessionCookie };
