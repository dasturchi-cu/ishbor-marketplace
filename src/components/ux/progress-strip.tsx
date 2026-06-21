import { Link } from "@tanstack/react-router";
import type { AuthUser } from "@/lib/auth";
import { useActiveRole } from "@/hooks/use-active-role";
import {
  computeProfileCompletionPercent,
  getProfileCompletionItems,
} from "@/lib/profile-store";
import { computeClientTrust, computeFreelancerTrust } from "@/lib/trust-utils";
import {
  computeFreelancerReputation,
  computeClientReputation,
} from "@/lib/reputation-store";
import { ReputationBadge } from "@/components/reputation/reputation-badge";
import { TrustScoreBadge } from "@/components/trust/trust-profile-card";
import {
  EcosystemMetricPills,
  PendingReviewsBanner,
} from "@/components/ecosystem/ecosystem-indicators";
import { getEcosystemMetrics } from "@/lib/ecosystem-progress";
import { getAgenciesForUser } from "@/lib/agency-store";
import { getCaseStudiesByAgency } from "@/lib/agency-portfolio-store";
import { AgencyVerificationBadge } from "@/components/agency/agency-verification-badge";

export function ProgressStrip({ user }: { user: AuthUser }) {
  const { activeRole } = useActiveRole();

  if (activeRole === "agency") {
    return <AgencyProgressStrip user={user} />;
  }

  const profilePercent = computeProfileCompletionPercent(user.id, activeRole);
  const profileItems = getProfileCompletionItems(user.id, activeRole);
  const profileDone = profileItems.filter((i) => i.done).length;

  const trust =
    activeRole === "client"
      ? computeClientTrust(user)
      : computeFreelancerTrust(user);

  const reputation =
    activeRole === "client"
      ? computeClientReputation(user.companySlug ?? "", user.fullName, user)
      : user.username
        ? computeFreelancerReputation(user.username, user)
        : null;

  const ecosystem = getEcosystemMetrics(user, activeRole);

  const bars = [
    {
      label: "Profil",
      value: profilePercent,
      detail: `${profileDone}/${profileItems.length}`,
      color: "bg-primary",
    },
    {
      label: "Ishonch",
      value: trust.trustScore,
      detail: trust.label,
      color: "bg-success",
    },
    {
      label: "Tasdiqlash",
      value: user.verified ? 100 : trust.verificationProgress,
      detail: user.verified ? "Tasdiqlangan" : "Kutilmoqda",
      color: "bg-[oklch(0.78_0.15_75)]",
    },
  ];

  if (activeRole === "freelancer" && trust.portfolioStrength > 0) {
    bars.push({
      label: "Portfolio",
      value: trust.portfolioStrength,
      detail: `${trust.portfolioStrength}%`,
      color: "bg-primary/70",
    });
  }

  if (activeRole === "freelancer" && ecosystem.successScore > 0) {
    bars.push({
      label: "Muvaffaqiyat",
      value: ecosystem.successScore,
      detail: `${ecosystem.completedOrders} ish`,
      color: "bg-success/80",
    });
  }

  if (ecosystem.repeatClientRate > 0 || ecosystem.repeatHireCount > 0) {
    bars.push({
      label: activeRole === "client" ? "Takror yollash" : "Takror mijoz",
      value: activeRole === "client" ? Math.min(100, ecosystem.repeatHireCount * 25) : ecosystem.repeatClientRate,
      detail:
        activeRole === "client"
          ? `${ecosystem.repeatHireCount} frilanser`
          : `${ecosystem.repeatClientCount} mijoz`,
      color: "bg-[oklch(0.72_0.14_145)]",
    });
  }

  if (activeRole === "freelancer" && ecosystem.rankingScore > 0) {
    bars.push({
      label: "Qidiruv",
      value: ecosystem.rankingScore,
      detail: `${ecosystem.rankingScore}/100`,
      color: "bg-primary",
    });
  }

  return (
    <div className="space-y-3">
      <PendingReviewsBanner count={ecosystem.pendingReviews} />
      <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Rivojlanish
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TrustScoreBadge score={trust.trustScore} label={trust.label} />
          {reputation && <ReputationBadge tier={reputation.tier} />}
          <EcosystemMetricPills metrics={ecosystem} role={activeRole === "client" ? "client" : "freelancer"} />
          {user.verified && (
            <span className="rounded-full border border-success/20 bg-success/5 px-2 py-0.5 text-[10px] font-semibold text-success">
              Tasdiqlangan
            </span>
          )}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">{b.label}</span>
              <span className="font-mono font-medium">{b.detail}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all ${b.color}`}
                style={{ width: `${Math.min(100, b.value)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {profilePercent < 100 && (() => {
        const nextItem = profileItems.find((i) => !i.done);
        if (!nextItem) return null;
        return (
          <Link
            to={nextItem.href}
            className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
          >
            {nextItem.label} → {profilePercent}%
          </Link>
        );
      })()}
      </div>
    </div>
  );
}

function AgencyProgressStrip({ user }: { user: AuthUser }) {
  const agency = getAgenciesForUser(user.id)[0];
  if (!agency) return null;

  const activeMembers = agency.members.filter((m) => m.status === "active").length;
  const caseStudies = getCaseStudiesByAgency(agency.slug).length;
  const published = agency.status === "published";

  const bars = [
    { label: "Profil", value: published ? 100 : 40, detail: published ? "E'lon qilingan" : "Qoralama", color: "bg-primary" },
    { label: "Jamoa", value: Math.min(100, (activeMembers / 5) * 100), detail: `${activeMembers} a'zo`, color: "bg-success" },
    { label: "Portfolio", value: caseStudies > 0 ? Math.min(100, caseStudies * 25) : 0, detail: `${caseStudies} hikoya`, color: "bg-[oklch(0.78_0.15_75)]" },
    { label: "Tasdiqlash", value: agency.verificationLevel === "none" ? 0 : agency.verificationLevel === "verified" ? 50 : agency.verificationLevel === "premium" ? 75 : 100, detail: agency.verificationLevel, color: "bg-primary/70" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Agentlik rivojlanishi</div>
        <AgencyVerificationBadge level={agency.verificationLevel} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">{b.label}</span>
              <span className="font-mono font-medium capitalize">{b.detail}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary">
              <div className={`h-full rounded-full transition-all ${b.color}`} style={{ width: `${b.value}%` }} />
            </div>
          </div>
        ))}
      </div>
      {!published && (
        <Link to="/dashboard/agency" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
          Agentlikni e'lon qilish →
        </Link>
      )}
    </div>
  );
}
