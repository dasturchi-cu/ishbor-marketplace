import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "./index";
import { activeRolePreferences, userProfiles, users } from "./schema";

const DEMO_PASSWORD = "demo1234";

const demoUsers = [
  {
    email: "sardor@asaka.uz",
    fullName: "Sardor Karimov",
    userType: "freelancer" as const,
    username: "sardor-karimov",
    avatarHue: 210,
    bio: "Full-stack dasturchi — React, Node.js, PostgreSQL",
    location: "Toshkent",
    verified: true,
    activeRole: "freelancer" as const,
    title: "Senior Full-Stack Developer",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    categories: ["Dasturlash", "Web"],
  },
  {
    email: "nargiza@ishbor.uz",
    fullName: "Nargiza Akhmedova",
    userType: "client" as const,
    company: "Asaka Bank",
    companySlug: "asaka-bank",
    avatarHue: 320,
    bio: "Fintech loyihalar uchun ishchi kuch topish",
    location: "Toshkent",
    verified: true,
    activeRole: "client" as const,
    industry: "Fintech",
    teamSize: "50-200",
    hiringGoals: ["Dasturlash", "Dizayn"],
  },
  {
    email: "admin@ishbor.uz",
    fullName: "Ishbor Admin",
    userType: "client" as const,
    avatarHue: 0,
    isAdmin: true,
    verified: true,
    activeRole: "client" as const,
  },
];

async function seed() {
  if (!isDatabaseConfigured()) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and start postgres.");
    process.exit(1);
  }

  const db = getDb();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const demo of demoUsers) {
    const existing = await db.select().from(users).where(eq(users.email, demo.email)).limit(1);
    if (existing.length > 0) {
      console.log(`Skip existing user: ${demo.email}`);
      continue;
    }

    const [user] = await db
      .insert(users)
      .values({
        email: demo.email,
        emailVerifiedAt: new Date(),
        passwordHash,
        fullName: demo.fullName,
        userType: demo.userType,
        username: demo.username,
        company: demo.company,
        companySlug: demo.companySlug,
        avatarHue: demo.avatarHue,
        bio: demo.bio,
        location: demo.location,
        isAdmin: demo.isAdmin ?? false,
        verified: demo.verified ?? false,
        accountStatus: "active",
      })
      .returning();

    await db.insert(activeRolePreferences).values({
      userId: user.id,
      activeRole: demo.activeRole,
    });

    await db.insert(userProfiles).values({
      userId: user.id,
      title: "title" in demo ? demo.title : undefined,
      skills: "skills" in demo ? demo.skills : [],
      categories: "categories" in demo ? demo.categories : [],
      industry: "industry" in demo ? demo.industry : undefined,
      teamSize: "teamSize" in demo ? demo.teamSize : undefined,
      hiringGoals: "hiringGoals" in demo ? demo.hiringGoals : [],
      onboardingComplete: true,
    });

    console.log(`Seeded: ${demo.email}`);
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
