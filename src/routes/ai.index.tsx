import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { OpportunityScoreCard } from "@/components/ai/opportunity-score-card";
import { SmartMatchPanel } from "@/components/ai/smart-match-panel";
import { requireAuth } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import { getActiveDashboardPath } from "@/lib/active-role-store";
import {
  getAiHubFeatures,
  getAiHubHeadline,
  isFounderAdmin,
  FOUNDER_AI_FEATURE,
  type AiFeature,
  type AiFeatureStatus,
} from "@/lib/ai-hub-config";
import { matchProjectsForFreelancer, matchFreelancersForClient } from "@/lib/ai-matching-store";
import { syncSmartNotifications } from "@/lib/ai-smart-notifications";

export const Route = createFileRoute("/ai/")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "AI Markaz — Ishbor" }] }),
  component: AiHubPage,
});

function AiHubPage() {
  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  const dashboardPath = getActiveDashboardPath(activeRole);

  useEffect(() => {
    if (user) syncSmartNotifications(user.id);
  }, [user?.id]);

  if (!user) return null;

  const headline = getAiHubHeadline(user);
  const features = getAiHubFeatures(user);
  const showFounder = isFounderAdmin(user);
  const matchedProjects = activeRole === "freelancer" ? matchProjectsForFreelancer(user.id, 3) : [];
  const matchedFreelancers = activeRole === "client" ? matchFreelancersForClient(user.id, 3) : [];

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={dashboardPath}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-default hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Boshqaruv paneli
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary">AI Markaz</span>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{headline.title}</h1>
            </div>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">{headline.subtitle}</p>
          </div>
          <p className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
            Qoidalar asosidagi AI — haqiqiy platforma ma&apos;lumotlari, LLM yo&apos;q.
          </p>
        </div>

        <div className="mt-8">
          <OpportunityScoreCard user={user} />
        </div>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Asboblar</h2>
            <span className="text-xs text-muted-foreground">{features.length} ta modul</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <FeatureCard key={f.id} feature={f} />
            ))}
            {showFounder && (
              <Link
                to={FOUNDER_AI_FEATURE.href}
                className="group flex flex-col rounded-2xl border border-primary/25 bg-primary/5 p-5 transition-default hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <FOUNDER_AI_FEATURE.icon className="size-5" />
                  </div>
                  <StatusBadge status="progress" label="Admin" />
                </div>
                <h3 className="font-display mt-4 font-semibold group-hover:text-primary">{FOUNDER_AI_FEATURE.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{FOUNDER_AI_FEATURE.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  Ochish <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            )}
          </div>
        </section>

        <section className="mt-8">
          {activeRole === "freelancer" ? (
            <SmartMatchPanel
              variant="projects"
              title="Sizga mos loyihalar"
              viewAllHref="/projects"
              items={matchedProjects}
              emptyMessage="Profil va ko'nikmalarni to'ldiring — mos loyihalar shu yerda paydo bo'ladi."
              links={[
                { label: "Taklif yordamchisi", to: "/ai/proposal-assistant" },
                { label: "Trust coach", to: "/ai/trust-coach" },
              ]}
            />
          ) : (
            <SmartMatchPanel
              variant="freelancers"
              title="Tavsiya etilgan frilanserlar"
              viewAllHref="/freelancers"
              items={matchedFreelancers}
              emptyMessage="Loyiha e'lon qiling — AI mos frilanserlarni tavsiya qiladi."
              links={[
                { label: "Loyiha generatori", to: "/ai/project-generator" },
                { label: "Onboarding", to: "/ai/onboarding" },
              ]}
            />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function FeatureCard({ feature }: { feature: AiFeature }) {
  const Icon = feature.icon;
  return (
    <Link
      to={feature.href}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-default hover:border-primary/25 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground/80 group-hover:bg-primary/10 group-hover:text-primary">
          <Icon className="size-5" />
        </div>
        <StatusBadge status={feature.status} label={feature.statusLabel} />
      </div>
      <h3 className="font-display mt-4 font-semibold group-hover:text-primary">{feature.title}</h3>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{feature.description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
        Boshqarish <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function StatusBadge({ status, label }: { status: AiFeatureStatus; label: string }) {
  const cls =
    status === "ready"
      ? "border-success/30 bg-success/10 text-success"
      : status === "progress"
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-warning/30 bg-warning/10 text-warning";
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium ${cls}`}>
      {label}
    </span>
  );
}
