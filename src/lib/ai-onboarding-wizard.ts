import type { AuthUser } from "./auth";
import { getAgenciesForUser } from "./agency-store";
import { getMyPublishedProjects } from "./projects-store";
import { getPublishedPortfoliosByUsername } from "./portfolio-store";
import { getMyPublishedServices } from "./services-store";
import { readStoredApplications } from "./applications-store";

export type OnboardingWizardStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  done: boolean;
  cta: string;
};

export type AiOnboardingPlan = {
  userType: "client" | "freelancer" | "agency";
  steps: OnboardingWizardStep[];
  progress: number;
};

export function getAiOnboardingPlan(user: AuthUser): AiOnboardingPlan {
  const agencies = getAgenciesForUser(user.id);
  const isAgencyOwner = agencies.some((a) => a.ownerUserId === user.id);

  if (isAgencyOwner) {
    return getAgencyOnboarding(agencies[0]!);
  }

  if (user.userType === "client") {
    return getClientOnboarding(user);
  }

  return getFreelancerOnboarding(user);
}

function getClientOnboarding(_user: AuthUser): AiOnboardingPlan {
  const steps: OnboardingWizardStep[] = [
    {
      id: "profile",
      title: "Profilni to'ldiring",
      description: "Kompaniya ma'lumotlari va tavsif — frilanserlar sizni taniydi.",
      href: "/settings",
      done: false,
      cta: "Profil sozlash",
    },
    {
      id: "verify",
      title: "Hisobni tasdiqlang",
      description: "Tasdiqlangan mijozlar ko'proq sifatli taklif oladi.",
      href: "/settings",
      done: false,
      cta: "Tasdiqlash",
    },
    {
      id: "publish",
      title: "Birinchi loyihani joylang",
      description: "Frilanserlar taklif yuborishni boshlaydi.",
      href: "/projects/create",
      done: false,
      cta: "Loyiha joylash",
    },
    {
      id: "hire",
      title: "Frilanser yollang",
      description: "Mos frilanserlarni AI tavsiya qiladi.",
      href: "/freelancers",
      done: false,
      cta: "Frilanser topish",
    },
  ];
  return { userType: "client", steps, progress: 0 };
}

function getFreelancerOnboarding(_user: AuthUser): AiOnboardingPlan {
  const steps: OnboardingWizardStep[] = [
    {
      id: "profile",
      title: "Profilni to'ldiring",
      description: "Ko'nikmalar, tavsif va joylashuv — mijozlar sizni topadi.",
      href: "/settings",
      done: false,
      cta: "Profil sozlash",
    },
    {
      id: "portfolio",
      title: "Portfel yarating",
      description: "Ish natijalaringizni ko'rsating — ishonch +8 ball.",
      href: "/portfolio/create",
      done: false,
      cta: "Portfel yaratish",
    },
    {
      id: "service",
      title: "Xizmat yarating",
      description: "Tayyor xizmat paketi bilan passiv daromad oling.",
      href: "/services/create",
      done: false,
      cta: "Xizmat yaratish",
    },
    {
      id: "proposal",
      title: "Birinchi loyihaga ariza yuboring",
      description: "AI yordamida professional taklif yozing.",
      href: "/projects",
      done: false,
      cta: "Loyihalarni ko'rish",
    },
  ];
  return { userType: "freelancer", steps, progress: 0 };
}

function getAgencyOnboarding(agency: { slug: string; members: { status: string }[]; status: string }): AiOnboardingPlan {
  const hasMembers = agency.members.filter((m) => m.status === "active").length >= 2;
  const steps: OnboardingWizardStep[] = [
    {
      id: "create",
      title: "Agentlik profili",
      description: "Agentlik ma'lumotlarini to'ldiring.",
      href: `/agencies/${agency.slug}`,
      done: agency.status === "published",
      cta: "Profilni ko'rish",
    },
    {
      id: "invite",
      title: "Jamoa a'zolarini taklif qiling",
      description: "Kamida 2 ta a'zo tasdiqlangan daraja uchun kerak.",
      href: "/dashboard/agency",
      done: hasMembers,
      cta: "Jamoa boshqaruvi",
    },
    {
      id: "portfolio",
      title: "Loyiha hikoyasini e'lon qiling",
      description: "Agentlik portfolio bilan ishonch oshiring.",
      href: "/dashboard/agency",
      done: false,
      cta: "Portfolio",
    },
  ];
  const done = steps.filter((s) => s.done).length;
  return { userType: "agency", steps, progress: Math.round((done / steps.length) * 100) };
}

const WIZARD_KEY = "ishbor-ai-onboarding-progress";

export function markOnboardingStepDone(userId: string, stepId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(WIZARD_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    const steps = all[userId] ?? [];
    if (!steps.includes(stepId)) {
      all[userId] = [...steps, stepId];
      localStorage.setItem(WIZARD_KEY, JSON.stringify(all));
    }
  } catch { /* ignore */ }
}

export function getOnboardingStepsDone(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WIZARD_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    return all[userId] ?? [];
  } catch {
    return [];
  }
}

export function enrichOnboardingPlan(user: AuthUser): AiOnboardingPlan {
  const plan = getAiOnboardingPlan(user);
  const doneIds = new Set(getOnboardingStepsDone(user.id));
  const username = user.username ?? "";

  const steps = plan.steps.map((s) => {
    let done = s.done || doneIds.has(s.id);
    if (plan.userType === "client") {
      if (s.id === "profile") done = done || (!!user.company && !!user.bio);
      if (s.id === "verify") done = done || !!user.verified;
      if (s.id === "publish") done = done || getMyPublishedProjects(user.id).length > 0;
      if (s.id === "hire") done = done || readStoredApplications().some((a) => a.clientSlug === user.companySlug);
    }
    if (plan.userType === "freelancer") {
      if (s.id === "profile") done = done || (!!user.bio && !!user.location);
      if (s.id === "service") done = done || getMyPublishedServices(user.id).length > 0;
      if (s.id === "portfolio") done = done || (username ? getPublishedPortfoliosByUsername(username).length > 0 : false);
      if (s.id === "proposal") done = done || readStoredApplications().some((a) => a.freelancerUsername === username);
    }
    return { ...s, done };
  });

  const progress = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
  return { ...plan, steps, progress };
}
