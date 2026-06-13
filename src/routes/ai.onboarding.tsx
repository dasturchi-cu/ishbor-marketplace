import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { requireAuth } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { enrichOnboardingPlan, markOnboardingStepDone } from "@/lib/ai-onboarding-wizard";
import { OpportunityScoreCard } from "@/components/ai/opportunity-score-card";
import { JourneyMap } from "@/components/ftue/journey-map";
import { syncSmartNotifications } from "@/lib/ai-smart-notifications";
import { getAgencyJourney } from "@/lib/ftue-store";
import { getAgenciesForUser } from "@/lib/agency-store";
import { getCaseStudiesByAgency } from "@/lib/agency-portfolio-store";

export const Route = createFileRoute("/ai/onboarding")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Boshlang'ich yo'riqnoma — Ishbor" }] }),
  component: AiOnboardingPage,
});

function AiOnboardingPage() {
  const { user } = useAuth();
  useEffect(() => {
    if (user) syncSmartNotifications(user.id);
  }, [user]);

  if (!user) return null;
  const plan = enrichOnboardingPlan(user);

  const roleLabel =
    plan.userType === "client" ? "Mijoz" : plan.userType === "agency" ? "Agentlik" : "Frilanser";

  const agency = plan.userType === "agency" ? getAgenciesForUser(user.id)[0] : null;
  const agencyStages =
    agency
      ? getAgencyJourney(
          agency.status === "published",
          agency.members.filter((m) => m.status === "active").length >= 2,
          getCaseStudiesByAgency(agency.slug).length > 0,
        )
      : null;

  return (
    <WorkspaceShell
      eyebrow="Boshlang'ich yo'riqnoma"
      title={`${roleLabel} uchun qadam-baqadam yo'l`}
    >
      <p className="text-sm text-muted-foreground">
        Har bir qadam keyingisini ochadi. Barchasini bir vaqtning o'zida emas — ketma-ket bajaring.
      </p>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${plan.progress}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{plan.progress}% bajarildi</p>

      {agencyStages && (
        <div className="mt-6">
          <JourneyMap stages={agencyStages} title="Agentlik yo'li" />
        </div>
      )}

      <div className="mt-6">
        <OpportunityScoreCard user={user} />
      </div>

      <ol className="mt-8 space-y-4">
        {plan.steps.map((step, i) => (
          <li key={step.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              {step.done ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{i + 1}. {step.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                {!step.done && (
                  <Link
                    to={step.href}
                    onClick={() => markOnboardingStepDone(user.id, step.id)}
                    className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    {step.cta}
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <Link
          to={plan.userType === "client" ? "/dashboard" : plan.userType === "agency" ? "/dashboard/agency" : "/dashboard/freelancer"}
          className="text-sm font-medium text-primary hover:underline"
        >
          Boshqaruv paneliga qaytish →
        </Link>
      </div>
    </WorkspaceShell>
  );
}
