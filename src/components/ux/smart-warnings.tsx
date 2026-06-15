import { Link } from "@tanstack/react-router";
import { AlertCircle, ChevronRight } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { useActiveRole } from "@/hooks/use-active-role";
import {
  computeProfileCompletionPercent,
  getProfileCompletionItems,
} from "@/lib/profile-store";
import { getMyPublishedProjects } from "@/lib/projects-store";
import { getMyPublishedServices } from "@/lib/services-store";
import { getPublishedPortfoliosByUsername } from "@/lib/portfolio-store";

import { getAgenciesForUser } from "@/lib/agency-store";
import { getCaseStudiesByAgency } from "@/lib/agency-portfolio-store";

type Warning = {
  id: string;
  message: string;
  href: string;
  cta: string;
};

function collectWarnings(user: AuthUser, role: ReturnType<typeof useActiveRole>["activeRole"]): Warning[] {
  const warnings: Warning[] = [];

  if (role === "agency") {
    const agency = getAgenciesForUser(user.id)[0];
    if (agency) {
      const members = agency.members.filter((m) => m.status === "active").length;
      if (members < 2) {
        warnings.push({
          id: "team",
          message: "Jamoa hali kichik — kamida 2 ta a'zo tasdiqlangan daraja uchun kerak.",
          href: "/dashboard/agency",
          cta: "Jamoa qo'shish",
        });
      }
      if (getCaseStudiesByAgency(agency.slug).length === 0) {
        warnings.push({
          id: "portfolio",
          message: "Agentlik portfolio yo'q — loyiha hikoyalari ishonchni oshiradi.",
          href: "/dashboard/agency",
          cta: "Portfolio qo'shish",
        });
      }
    }
    return warnings.slice(0, 2);
  }

  const completion = computeProfileCompletionPercent(user.id, role);
  const items = getProfileCompletionItems(user.id, role);
  const incomplete = items.filter((i) => !i.done);

  if (completion < 100 && incomplete.length > 0) {
    const next = incomplete[0]!;
    warnings.push({
      id: "profile",
      message: `Profil ${completion}% to'ldirilgan — ${next.label.toLowerCase()} qo'shing.`,
      href: next.href,
      cta: "To'ldirish",
    });
  }

  if (!user.verified) {
    warnings.push({
      id: "verify",
      message: "Hisob tasdiqlanmagan — tasdiqlangan profillar ko'proq ishonch uyg'otadi.",
      href: "/settings",
      cta: "Tasdiqlash",
    });
  }

  if (role === "freelancer") {
    const username = user.username ?? "";
    const portfolios = username ? getPublishedPortfoliosByUsername(username) : [];
    const services = getMyPublishedServices(user.id);

    if (portfolios.length === 0) {
      warnings.push({
        id: "portfolio",
        message: "Portfolio yo'q — ish namunalaringizni ko'rsating, qabul qilinish ehtimoli oshadi.",
        href: "/portfolio/create",
        cta: "Portfolio yaratish",
      });
    }
    if (services.length === 0) {
      warnings.push({
        id: "service",
        message: "Xizmat yo'q — tayyor paket bilan to'g'ridan-to'g'ri buyurtma oling.",
        href: "/services/create",
        cta: "Xizmat yaratish",
      });
    }
  }

  if (role === "client") {
    const projects = getMyPublishedProjects(user.id);
    if (projects.length === 0) {
      warnings.push({
        id: "project",
        message: "Hali loyiha joylanmagan — frilanserlar sizga taklif yubora olmaydi.",
        href: "/projects/create",
        cta: "Loyiha joylash",
      });
    }
  }

  return warnings.slice(0, 2);
}

export function SmartWarningStack({ user }: { user: AuthUser }) {
  const { activeRole } = useActiveRole();
  const warnings = collectWarnings(user, activeRole);

  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((w) => (
        <div
          key={w.id}
          className="flex flex-col gap-2 rounded-xl border border-warning/15 bg-warning/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <span className="leading-relaxed text-muted-foreground">{w.message}</span>
          </div>
          <Link
            to={w.href}
            className="touch-target inline-flex shrink-0 items-center gap-0.5 self-start text-xs font-semibold text-primary hover:underline sm:self-center"
          >
            {w.cta} <ChevronRight className="size-3.5" />
          </Link>
        </div>
      ))}
    </div>
  );
}
