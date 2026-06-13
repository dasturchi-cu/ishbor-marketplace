import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { enrichOnboardingPlan } from "@/lib/ai-onboarding-wizard";
import {
  computeProfileCompletionPercent,
  getProfileCompletionItems,
} from "@/lib/profile-store";

export function NextActionCard({ user }: { user: AuthUser }) {
  const plan = enrichOnboardingPlan(user);
  const nextWizardStep = plan.steps.find((s) => !s.done);

  const userType = user.userType === "client" ? "client" : "freelancer";
  const completionItems = getProfileCompletionItems(user.id, userType);
  const completionPercent = computeProfileCompletionPercent(user.id, userType);
  const nextProfileItem = completionItems.find((i) => !i.done);

  const action = nextWizardStep ?? (nextProfileItem && completionPercent < 100
    ? { title: nextProfileItem.label, description: "Profil to'ldirish", href: nextProfileItem.href, cta: "Davom etish" }
    : null);

  if (!action) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Keyingi eng yaxshi harakat</div>
        <div className="mt-1 font-semibold">{action.title}</div>
        {"description" in action && (
          <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
        )}
      </div>
      <Link
        to={action.href}
        className="touch-target inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        {action.cta ?? "Boshlash"} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
