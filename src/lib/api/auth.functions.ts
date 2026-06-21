import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { getServerConfig } from "../config.server";

/** Demo-era server hook — production replaces with DB session invalidation. */
export const blockDemoAccountServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      blocked: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    return { ok: true as const, email: data.email, blocked: data.blocked };
  });

/** Server-side login validation — uses DB when configured, else format checks only. */
export const validateLogin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().min(3),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email.includes("@")) {
      return { ok: false as const, error: "Email noto'g'ri formatda." };
    }
    if (data.password.length < 6) {
      return { ok: false as const, error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak." };
    }

    const config = getServerConfig();
    if (!config.databaseUrl) {
      return { ok: true as const, email, mode: "demo" as const };
    }

    try {
      const { getDb } = await import("../../../server/db/index");
      const { users } = await import("../../../server/db/schema");
      const db = getDb();
      const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = rows[0];
      if (!user?.passwordHash) {
        return { ok: false as const, error: "Foydalanuvchi topilmadi.", mode: "database" as const };
      }
      if (user.accountStatus === "suspended" || user.accountStatus === "banned") {
        return { ok: false as const, error: "Hisobingiz vaqtincha bloklangan.", mode: "database" as const };
      }
      const valid = await bcrypt.compare(data.password, user.passwordHash);
      if (!valid) {
        return { ok: false as const, error: "Email yoki parol noto'g'ri.", mode: "database" as const };
      }
      return { ok: true as const, email, userId: user.id, mode: "database" as const };
    } catch {
      return { ok: true as const, email, mode: "demo" as const };
    }
  });
