import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { enrichOnboardingPlan } from "@/lib/ai-onboarding-wizard";
import {
  computeProfileCompletionPercent,
  getProfileCompletionItems,
} from "@/lib/profile-store";
import { resolveContextualNextAction } from "@/lib/next-action-resolver";
import { useActiveRole } from "@/hooks/use-active-role";

export function NextActionCard({ user }: { user: AuthUser }) {
  const { activeRole } = useActiveRole();
  const plan = enrichOnboardingPlan(user);
  const nextWizardStep = plan.steps.find((s) => !s.done);

  const completionItems = getProfileCompletionItems(user.id, activeRole);
  const completionPercent = computeProfileCompletionPercent(user.id, activeRole);
  const nextProfileItem = completionItems.find((i) => !i.done);

  const contextual = resolveContextualNextAction(user, activeRole);

  const action =
    nextWizardStep ??
    (nextProfileItem && completionPercent < 100
      ? {
          title: nextProfileItem.label,
          description: "Profil to'ldirish — ishonch ballingiz oshadi.",
          href: nextProfileItem.href,
          cta: "Davom etish",
        }
      : contextual);

  if (!action) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
          Keyingi nima qilish kerak?
        </div>
        <div className="mt-1 font-semibold">{action.title}</div>
        {"description" in action && action.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{action.description}</p>
        )}
      </div>
      <Link
        to={action.href}
        className="touch-target inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-4px_oklch(0.546_0.185_257/0.4)] hover:opacity-90"
      >
        {action.cta ?? "Boshlash"} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
