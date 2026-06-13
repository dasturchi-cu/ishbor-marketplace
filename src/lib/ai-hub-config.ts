import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Wand2,
  FileText,
  FolderKanban,
  Shield,
  Route,
  Building2,
} from "lucide-react";
import type { AuthUser } from "./auth";
import { enrichOnboardingPlan } from "./ai-onboarding-wizard";
import { analyzePortfolio } from "./ai-portfolio-optimizer";
import { getTrustCoachInsights } from "./ai-trust-coach";
import { getMyPublishedProjects } from "./projects-store";
import { getMyPublishedServices } from "./services-store";
import { getPublishedPortfoliosByUsername } from "./portfolio-store";
import { readStoredApplications } from "./applications-store";
import { getAgenciesForUser } from "./agency-store";

export type AiFeatureStatus = "ready" | "progress" | "action";

export type AiFeature = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  roles: ("client" | "freelancer")[];
  statusLabel: string;
  status: AiFeatureStatus;
};

function resolveRole(user: AuthUser): "client" | "freelancer" {
  const agencies = getAgenciesForUser(user.id);
  if (agencies.some((a) => a.ownerUserId === user.id)) return "client";
  return user.userType === "freelancer" ? "freelancer" : "client";
}

export function getAiHubFeatures(user: AuthUser): AiFeature[] {
  const role = resolveRole(user);
  const username = user.username ?? "";
  const onboarding = enrichOnboardingPlan(user);
  const portfolio = role === "freelancer" ? analyzePortfolio(user) : null;
  const trust = getTrustCoachInsights(user);

  const all: Omit<AiFeature, "statusLabel" | "status">[] = [
    {
      id: "onboarding",
      title: "AI Onboarding",
      description: "Rol bo'yicha qadam-baqadam yo'riqnoma va progress kuzatuvi.",
      href: "/ai/onboarding",
      icon: Route,
      roles: ["client", "freelancer"],
    },
    {
      id: "project-generator",
      title: "Loyiha generatori",
      description: "G'oya, byudjet va muddatdan tayyor loyiha tavsifi.",
      href: "/ai/project-generator",
      icon: Wand2,
      roles: ["client"],
    },
    {
      id: "proposal-assistant",
      title: "Taklif yordamchisi",
      description: "Loyiha uchun taklif, bosqichlar va qo'shimcha xat.",
      href: "/ai/proposal-assistant",
      icon: FileText,
      roles: ["freelancer"],
    },
    {
      id: "portfolio-optimizer",
      title: "Portfolio optimizatsiyasi",
      description: "Portfolio tahlili, zaif joylar va yaxshilash tavsiyalari.",
      href: "/ai/portfolio-optimizer",
      icon: FolderKanban,
      roles: ["freelancer"],
    },
    {
      id: "trust-coach",
      title: "Trust Coach",
      description: "Ishonch balli sabablari va aniq yaxshilash harakatlari.",
      href: "/ai/trust-coach",
      icon: Shield,
      roles: ["client", "freelancer"],
    },
  ];

  return all
    .filter((f) => f.roles.includes(role))
    .map((f) => {
      let statusLabel = "Tayyor";
      let status: AiFeatureStatus = "ready";

      if (f.id === "onboarding") {
        statusLabel = `${onboarding.progress}% bajarildi`;
        status = onboarding.progress >= 100 ? "ready" : onboarding.progress > 0 ? "progress" : "action";
      }
      if (f.id === "project-generator") {
        const count = getMyPublishedProjects(user.id).length;
        statusLabel = count > 0 ? `${count} ta loyiha` : "Loyiha yarating";
        status = count > 0 ? "ready" : "action";
      }
      if (f.id === "proposal-assistant") {
        const count = readStoredApplications().filter((a) => a.freelancerUsername === username).length;
        statusLabel = count > 0 ? `${count} ta taklif` : "Taklif yuboring";
        status = count > 0 ? "ready" : "action";
      }
      if (f.id === "portfolio-optimizer" && portfolio) {
        statusLabel = `${portfolio.score}/100 ball`;
        status = portfolio.score >= 70 ? "ready" : portfolio.score >= 40 ? "progress" : "action";
      }
      if (f.id === "trust-coach") {
        statusLabel = `${trust.currentTrustScore} ishonch`;
        status = trust.currentTrustScore >= 80 ? "ready" : trust.currentTrustScore >= 60 ? "progress" : "action";
      }

      return { ...f, statusLabel, status };
    });
}

export function getAiHubHeadline(user: AuthUser): { title: string; subtitle: string } {
  const role = resolveRole(user);
  if (role === "client") {
    return {
      title: "AI Markaz",
      subtitle: "Loyiha yaratish, frilanser topish va ishonchni oshirish — bitta panelda.",
    };
  }
  return {
    title: "AI Markaz",
    subtitle: "Taklif yozish, portfolio optimizatsiyasi va mos loyihalar — bitta panelda.",
  };
}

/** Admin-only founder insight card */
export function isFounderAdmin(user: AuthUser): boolean {
  return user.email === "admin@ishbor.uz" || user.email.includes("founder");
}

export const FOUNDER_AI_FEATURE = {
  id: "founder-ai",
  title: "Founder AI Center",
  description: "Likvidlik, retention, kategoriya trendlari va platforma tavsiyalari.",
  href: "/admin/ai",
  icon: Building2,
} as const;
