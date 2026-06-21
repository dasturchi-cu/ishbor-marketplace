import { createServerFn } from "@tanstack/react-start";
import {
  getRequestHeader,
  setResponseHeader,
} from "@tanstack/react-start/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

import type { AuthSession, AuthUser } from "../auth";
import {
  getBlockedMessage,
  getInvalidCredentialsMessage,
  registerDevUser,
  verifyCredentials,
} from "../../../server/lib/credentials";
import {
  createServerSession,
  destroyServerSession,
  readServerSession,
} from "../../../server/lib/session-service";
import { assertSameOrigin } from "../../../server/lib/request-guard";

function toClientSession(payload: { user: AuthUser; remember: boolean }): AuthSession {
  return {
    user: payload.user,
    remember: payload.remember,
    loggedInAt: new Date().toISOString(),
  };
}

export const getServerSession = createServerFn({ method: "GET" }).handler(async () => {
  const cookie = getRequestHeader("cookie");
  const session = await readServerSession(cookie);
  if (!session) return { authenticated: false as const };
  return {
    authenticated: true as const,
    session: toClientSession(session),
  };
});

export const loginSession = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().min(3),
      password: z.string().min(1),
      remember: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    assertSameOrigin();
    const email = data.email.trim().toLowerCase();
    if (!email.includes("@")) {
      return { ok: false as const, error: "Email noto'g'ri formatda." };
    }
    if (data.password.length < 6) {
      return { ok: false as const, error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak." };
    }

    const credential = await verifyCredentials(email, data.password);
    if (!credential) {
      return { ok: false as const, error: getInvalidCredentialsMessage() };
    }

    const remember = data.remember ?? false;
    const ua = getRequestHeader("user-agent");
    const { cookie, user } = await createServerSession(credential, remember, ua);
    setResponseHeader("Set-Cookie", cookie);

    return {
      ok: true as const,
      session: toClientSession({ user, remember }),
    };
  });

export const logoutSession = createServerFn({ method: "POST" }).handler(async () => {
  assertSameOrigin();
  const cookie = getRequestHeader("cookie");
  const clearCookie = await destroyServerSession(cookie);
  setResponseHeader("Set-Cookie", clearCookie);
  return { ok: true as const };
});

const onboardingSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  otp: z.string().length(6),
  fullName: z.string().min(2),
  userType: z.enum(["client", "freelancer"]),
  company: z.string().optional(),
});

export const completeRegistrationSession = createServerFn({ method: "POST" })
  .validator(onboardingSchema)
  .handler(async ({ data }) => {
    assertSameOrigin();
    if (data.otp !== "123456") {
      return { ok: false as const, error: "Noto'g'ri tasdiqlash kodi." };
    }

    const email = data.email.trim().toLowerCase();
    const userId = `u-${Date.now()}`;
    const user: AuthUser = {
      id: userId,
      email,
      fullName: data.fullName,
      userType: data.userType,
      username:
        data.userType === "freelancer"
          ? data.fullName.toLowerCase().replace(/\s+/g, "-").slice(0, 20)
          : undefined,
      company: data.company || undefined,
      companySlug: data.company
        ? data.company.toLowerCase().replace(/\s+/g, "-")
        : undefined,
      avatarHue: data.userType === "freelancer" ? 250 : 215,
      verified: true,
      location: "Tashkent, Uzbekistan",
    };

    try {
      const { isDatabaseConfigured, getDb } = await import("../../../server/db/index");
      if (isDatabaseConfigured()) {
        const { users, userProfiles, activeRolePreferences } = await import(
          "../../../server/db/schema"
        );
        const { eq } = await import("drizzle-orm");
        const db = getDb();
        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing.length > 0) {
          return { ok: false as const, error: "Bu email allaqachon ro'yxatdan o'tgan." };
        }
        const passwordHash = await bcrypt.hash(data.password, 12);
        const [inserted] = await db
          .insert(users)
          .values({
            email,
            emailVerifiedAt: new Date(),
            passwordHash,
            fullName: data.fullName,
            userType: data.userType,
            username: user.username,
            company: user.company,
            companySlug: user.companySlug,
            avatarHue: user.avatarHue,
            verified: true,
            accountStatus: "active",
          })
          .returning();
        await db.insert(activeRolePreferences).values({
          userId: inserted.id,
          activeRole: data.userType,
        });
        await db.insert(userProfiles).values({
          userId: inserted.id,
          onboardingComplete: false,
        });
        user.id = inserted.id;
        const credential = await verifyCredentials(email, data.password);
        if (!credential) {
          return { ok: false as const, error: getBlockedMessage() };
        }
        const { cookie, user: authedUser } = await createServerSession(credential, true);
        setResponseHeader("Set-Cookie", cookie);
        return { ok: true as const, session: toClientSession({ user: authedUser, remember: true }) };
      }
    } catch {
      /* dev fallback */
    }

    registerDevUser(email, data.password, user);
    const credential = await verifyCredentials(email, data.password);
    if (!credential) {
      return { ok: false as const, error: "Ro'yxatdan o'tishda xatolik yuz berdi." };
    }
    const { cookie, user: authedUser } = await createServerSession(credential, true);
    setResponseHeader("Set-Cookie", cookie);
    return { ok: true as const, session: toClientSession({ user: authedUser, remember: true }) };
  });
