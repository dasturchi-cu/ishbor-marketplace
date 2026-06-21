import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { enrichOnboardingPlan, type OnboardingWizardStep } from "@/lib/ai-onboarding-wizard";
import { useActiveRole } from "@/hooks/use-active-role";
import {
  dismissGettingStarted,
  getUnlockedStepCount,
  advanceUnlockedSteps,
  isGettingStartedDismissed,
} from "@/lib/ftue-store";
import { cn } from "@/lib/utils";

export function GettingStartedCard({ user }: { user: AuthUser }) {
  const { activeRole } = useActiveRole();
  const plan = enrichOnboardingPlan(user);
  const completedCount = plan.steps.filter((s) => s.done).length;
  const allDone = completedCount === plan.steps.length;
  const [dismissed, setDismissed] = useState(() => isGettingStartedDismissed(user.id));
  const [expanded, setExpanded] = useState(!allDone);
  const unlockedCount = getUnlockedStepCount(user.id, completedCount);

  useEffect(() => {
    if (completedCount > 0) advanceUnlockedSteps(user.id, completedCount);
  }, [completedCount, user.id]);

  if (dismissed || allDone) return null;

  const visibleSteps = plan.steps.slice(0, unlockedCount);
  const nextStep = plan.steps.find((s) => !s.done);

  const handleDismiss = () => {
    dismissGettingStarted(user.id);
    setDismissed(true);
  };

  const roleLabel =
    activeRole === "client" ? "Mijoz" : plan.userType === "agency" ? "Agentlik" : "Frilanser";

  return (
    <div className="premium-surface-panel rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
              {roleLabel} · Boshlang'ich yo'riqnoma
            </div>
            <h3 className="font-display mt-1 text-lg font-bold">Ishbor bilan birinchi qadamlar</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {completedCount}/{plan.steps.length} bajarildi — qadam-baqadam yo'l ko'rsatamiz.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="touch-target shrink-0 rounded-lg p-1.5 text-muted-foreground transition-default hover:bg-secondary hover:text-foreground"
          aria-label="Yopish"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 h-2 rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${plan.progress}%` }}
        />
      </div>

      {nextStep && (
        <Link
          to={nextStep.href}
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-primary/25 bg-card px-4 py-3 transition-default hover:border-primary/40 hover:shadow-sm"
        >
          <div>
            <div className="text-xs font-medium text-primary">Keyingi qadam</div>
            <div className="font-semibold">{nextStep.title}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{nextStep.description}</p>
          </div>
          <span className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            {nextStep.cta}
          </span>
        </Link>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {expanded ? "Kamroq ko'rsatish" : "Barcha qadamlarni ko'rish"}
        {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>

      {expanded && (
        <ul className="mt-3 space-y-2">
          {visibleSteps.map((step, i) => (
            <StepRow key={step.id} step={step} index={i} isLocked={i >= unlockedCount} />
          ))}
          {unlockedCount < plan.steps.length && (
            <li className="rounded-lg border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground">
              +{plan.steps.length - unlockedCount} ta qadam keyin ochiladi
            </li>
          )}
        </ul>
      )}

      <Link
        to="/ai/onboarding"
        className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
      >
        To'liq yo'riqnomani ko'rish →
      </Link>
    </div>
  );
}

function StepRow({
  step,
  index,
  isLocked,
}: {
  step: OnboardingWizardStep;
  index: number;
  isLocked: boolean;
}) {
  if (isLocked) {
    return (
      <li className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground/50">
        <Circle className="size-4 shrink-0" />
        <span>{index + 1}. {step.title}</span>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={step.href}
        className={cn(
          "premium-press flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-secondary/60",
          step.done && "opacity-60",
        )}
      >
        {step.done ? (
          <CheckCircle2 className="size-4 shrink-0 text-success" />
        ) : (
          <Circle className="size-4 shrink-0 text-primary" />
        )}
        <span className={step.done ? "line-through" : "font-medium"}>
          {index + 1}. {step.title}
        </span>
      </Link>
    </li>
  );
}
