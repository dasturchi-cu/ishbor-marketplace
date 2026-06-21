import type { UserType } from "./auth-constants";
import { getRegisteredDemoUsers } from "./auth";
import { freelancers } from "./mock-data";

export type PlatformUser = {
  id: string;
  email: string;
  fullName: string;
  userType: UserType;
  username?: string;
  avatarHue: number;
  subtitle?: string;
};

const DEMO_EMAIL_BY_USERNAME: Record<string, string> = {
  nargiza: "nargiza@ishbor.uz",
};

function freelancerEmail(username: string): string {
  return DEMO_EMAIL_BY_USERNAME[username] ?? `${username}@ishbor.uz`;
}

let cachedUsers: PlatformUser[] | null = null;

export function getPlatformUsers(): PlatformUser[] {
  if (cachedUsers) return cachedUsers;

  const byEmail = new Map<string, PlatformUser>();

  for (const user of getRegisteredDemoUsers()) {
    byEmail.set(user.email.toLowerCase(), {
      id: user.id,
      email: user.email.toLowerCase(),
      fullName: user.fullName,
      userType: user.userType,
      username: user.username,
      avatarHue: user.avatarHue,
      subtitle: user.company ?? (user.isAdmin ? "Platform admin" : undefined),
    });
  }

  for (const freelancer of freelancers) {
    const email = freelancerEmail(freelancer.username).toLowerCase();
    if (byEmail.has(email)) continue;
    byEmail.set(email, {
      id: freelancer.id,
      email,
      fullName: freelancer.name,
      userType: "freelancer",
      username: freelancer.username,
      avatarHue: freelancer.hue,
      subtitle: freelancer.title,
    });
  }

  cachedUsers = [...byEmail.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, "uz"));
  return cachedUsers;
}

export function searchPlatformUsers(
  query: string,
  options?: {
    excludeEmails?: string[];
    userType?: UserType;
  },
): PlatformUser[] {
  const exclude = new Set((options?.excludeEmails ?? []).map((email) => email.toLowerCase()));
  const q = query.trim().toLowerCase();

  return getPlatformUsers().filter((user) => {
    if (exclude.has(user.email)) return false;
    if (options?.userType && user.userType !== options.userType) return false;
    if (!q) return true;
    return (
      user.fullName.toLowerCase().includes(q) ||
      user.email.includes(q) ||
      (user.username?.toLowerCase().includes(q) ?? false) ||
      (user.subtitle?.toLowerCase().includes(q) ?? false)
    );
  });
}
