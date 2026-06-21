import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userTypeEnum = pgEnum("user_type", ["client", "freelancer"]);
export const accountStatusEnum = pgEnum("account_status", ["active", "suspended", "banned", "pending"]);
export const activeRoleEnum = pgEnum("active_role", ["client", "freelancer", "agency"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    passwordHash: text("password_hash"),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    userType: userTypeEnum("user_type").notNull(),
    username: varchar("username", { length: 50 }).unique(),
    companySlug: varchar("company_slug", { length: 80 }).unique(),
    company: varchar("company", { length: 200 }),
    avatarHue: integer("avatar_hue").notNull().default(220),
    bio: text("bio"),
    location: varchar("location", { length: 120 }),
    isAdmin: boolean("is_admin").notNull().default(false),
    accountStatus: accountStatusEnum("account_status").notNull().default("active"),
    verified: boolean("verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  },
  (t) => [index("idx_users_email").on(t.email), index("idx_users_status").on(t.accountStatus)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    remember: boolean("remember").notNull().default(false),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_sessions_user_id").on(t.userId)],
);

export const activeRolePreferences = pgTable("active_role_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  activeRole: activeRoleEnum("active_role").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }),
  skills: text("skills").array().notNull().default([]),
  categories: text("categories").array().notNull().default([]),
  languages: jsonb("languages").$type<{ language: string; level: string }[]>().default([]),
  availability: jsonb("availability").$type<Record<string, unknown>>().default({}),
  rateUsd: integer("rate_usd"),
  industry: varchar("industry", { length: 100 }),
  teamSize: varchar("team_size", { length: 50 }),
  hiringGoals: text("hiring_goals").array().notNull().default([]),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
