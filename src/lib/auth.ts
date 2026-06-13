import type { UserType } from "./auth-constants";
import { loadOnboardingState } from "./auth-constants";

export const SESSION_STORAGE_KEY = "ishbor-session";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  userType: UserType;
  username?: string;
  companySlug?: string;
  company?: string;
  avatarHue: number;
  verified: boolean;
  bio?: string;
  location?: string;
};

export type AuthSession = {
  user: AuthUser;
  remember: boolean;
  loggedInAt: string;
};

const demoUsers: Record<string, { password: string; user: AuthUser }> = {
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
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function readStorage(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(SESSION_STORAGE_KEY) ??
      sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function writeStorage(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  if (!session) return;
  const storage = session.remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSession(): AuthSession | null {
  return readStorage();
}

export function getCurrentUser(): AuthUser | null {
  return getSession()?.user ?? null;
}

export function isAuthenticated(): boolean {
  return !!getSession();
}

export function loginWithCredentials(
  email: string,
  password: string,
  remember = false,
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();
  const demo = demoUsers[normalized];
  if (demo && demo.password === password) {
    const session: AuthSession = {
      user: demo.user,
      remember,
      loggedInAt: new Date().toISOString(),
    };
    writeStorage(session);
    notify();
    return { ok: true, session };
  }
  if (password.length >= 6 && normalized.includes("@")) {
    const onboarding = loadOnboardingState();
    const session: AuthSession = {
      user: {
        id: `u-${Date.now()}`,
        email: normalized,
        fullName: onboarding.fullName || normalized.split("@")[0]!,
        userType: onboarding.userType,
        username: onboarding.userType === "freelancer" ? onboarding.fullName.toLowerCase().replace(/\s+/g, "-").slice(0, 20) : undefined,
        company: onboarding.company || undefined,
        companySlug: onboarding.company
          ? onboarding.company.toLowerCase().replace(/\s+/g, "-")
          : undefined,
        avatarHue: onboarding.userType === "freelancer" ? 250 : 215,
        verified: false,
        location: "Tashkent, Uzbekistan",
      },
      remember,
      loggedInAt: new Date().toISOString(),
    };
    writeStorage(session);
    notify();
    return { ok: true, session };
  }
  return { ok: false, error: "Invalid email or password." };
}

export function loginDemo(userType: UserType, remember = false): AuthSession {
  const email = userType === "client" ? "sardor@asaka.uz" : "nargiza@ishbor.uz";
  const result = loginWithCredentials(email, "demo1234", remember);
  return result.ok ? result.session : getSession()!;
}

export function logout() {
  writeStorage(null);
  notify();
}

export function updateSessionUser(patch: Partial<AuthUser>) {
  const session = getSession();
  if (!session) return;
  const next: AuthSession = {
    ...session,
    user: { ...session.user, ...patch },
  };
  writeStorage(next);
  notify();
}

export function getDefaultDashboard(userType: UserType): string {
  return userType === "freelancer" ? "/dashboard/freelancer" : "/dashboard";
}

export function getProfilePath(user: AuthUser): string {
  if (user.userType === "freelancer" && user.username) {
    return `/freelancers/${user.username}`;
  }
  if (user.companySlug) {
    return `/clients/${user.companySlug}`;
  }
  return "/profile";
}
