import bcrypt from "bcryptjs";

import type { AuthUser } from "../../src/lib/auth";

/** Server-side source of truth for demo credentials — mirrors client demo users. */
export const SERVER_DEMO_USERS: Record<
  string,
  { password: string; user: AuthUser }
> = {
  "sardor@asaka.uz": {
    password: "demo1234",
    user: {
      id: "u-client-1",
      email: "sardor@asaka.uz",
      fullName: "Sardor Mirkomilov",
      userType: "client",
      company: "Asaka Capital",
      companySlug: "asaka-capital",
      avatarHue: 215,
      verified: true,
      bio: "Head of Product at Asaka Capital. Hiring design and engineering talent for fintech.",
      location: "Tashkent, Uzbekistan",
    },
  },
  "nargiza@ishbor.uz": {
    password: "demo1234",
    user: {
      id: "u-freelancer-1",
      email: "nargiza@ishbor.uz",
      fullName: "Nargiza Akhmedova",
      userType: "freelancer",
      username: "nargiza",
      avatarHue: 250,
      verified: true,
      bio: "Senior Brand Strategist & UI Designer. 8 years, 120+ projects across Central Asia.",
      location: "Tashkent, Uzbekistan",
    },
  },
  "admin@ishbor.uz": {
    password: "demo1234",
    user: {
      id: "u-admin-1",
      email: "admin@ishbor.uz",
      fullName: "Bobur Niyazov",
      userType: "client",
      company: "Ishbor Platform",
      companySlug: "ishbor",
      avatarHue: 200,
      verified: true,
      isAdmin: true,
      bio: "Platform administrator for Ishbor marketplace operations.",
      location: "Tashkent, Uzbekistan",
    },
  },
};

const DUMMY_HASH =
  "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G2oX9K3F5m6Y8i";

export type VerifiedCredential = {
  user: AuthUser;
  source: "database" | "demo" | "dev-register";
  dbUserId?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapDbUser(row: {
  id: string;
  email: string;
  fullName: string;
  userType: "client" | "freelancer";
  username: string | null;
  companySlug: string | null;
  company: string | null;
  avatarHue: number;
  bio: string | null;
  location: string | null;
  isAdmin: boolean;
  verified: boolean;
}): AuthUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    userType: row.userType,
    username: row.username ?? undefined,
    companySlug: row.companySlug ?? undefined,
    company: row.company ?? undefined,
    avatarHue: row.avatarHue,
    bio: row.bio ?? undefined,
    location: row.location ?? undefined,
    verified: row.verified,
    isAdmin: row.isAdmin || undefined,
  };
}

/** Dev-only in-memory registrations when DATABASE_URL is unset. */
const devRegisteredUsers = new Map<
  string,
  { passwordHash: string; user: AuthUser }
>();

export function registerDevUser(
  email: string,
  password: string,
  user: AuthUser,
): void {
  devRegisteredUsers.set(normalizeEmail(email), {
    passwordHash: bcrypt.hashSync(password, 12),
    user,
  });
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<VerifiedCredential | null> {
  const normalized = normalizeEmail(email);

  try {
    const { isDatabaseConfigured, getDb } = await import("../db/index");
    if (isDatabaseConfigured()) {
      const { users } = await import("../db/schema");
      const { eq } = await import("drizzle-orm");
      const db = getDb();
      const rows = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
      const row = rows[0];
      const hash = row?.passwordHash ?? DUMMY_HASH;
      const valid = await bcrypt.compare(password, hash);
      if (!row || !valid) return null;
      if (row.accountStatus === "suspended" || row.accountStatus === "banned") return null;
      return {
        user: mapDbUser(row),
        source: "database",
        dbUserId: row.id,
      };
    }
  } catch {
    /* fall through to demo/dev stores */
  }

  const dev = devRegisteredUsers.get(normalized);
  if (dev && (await bcrypt.compare(password, dev.passwordHash))) {
    return { user: dev.user, source: "dev-register" };
  }

  const demo = SERVER_DEMO_USERS[normalized];
  if (demo && demo.password === password) {
    return { user: demo.user, source: "demo" };
  }

  // Constant-time dummy compare for unknown emails
  await bcrypt.compare(password, DUMMY_HASH);
  return null;
}

export function getBlockedMessage(): string {
  return "Hisobingiz vaqtincha bloklangan. Yordam markaziga murojaat qiling.";
}

export function getInvalidCredentialsMessage(): string {
  return "Email yoki parol noto'g'ri.";
}
