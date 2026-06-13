import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Target } from "lucide-react";
import { OnboardingLayout, OnboardingNav } from "@/components/auth/onboarding-layout";
import { loadOnboardingState, saveOnboardingState, hiringGoalOptions } from "@/lib/auth-constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/hiring-goals")({
  head: () => ({
    meta: [{ title: "Yollash maqsadlari — Ishbor" }],
  }),
  component: OnboardingHiringGoalsPage,
});

function OnboardingHiringGoalsPage() {
  const navigate = useNavigate();
  const saved = loadOnboardingState();
  const [goals, setGoals] = useState<string[]>(saved.hiringGoals);

  const toggle = (id: string) => {
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : prev.length < 4 ? [...prev, id] : prev,
    );
  };

  const handleContinue = () => {
    saveOnboardingState({ hiringGoals: goals });
    navigate({ to: "/welcome", search: { setup: "complete" } });
  };

  return (
    <OnboardingLayout
      stepId="hiring-goals"
      title="Yollash maqsadlaringiz qanday?"
      subtitle="4 tagacha maqsad tanlang. Lentangiz, tavsiyalar va loyiha shablonlarini shunga moslashtiramiz."
    >
      <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <Target className="size-3.5 text-primary" />
        {goals.length}/4 tanlandi
      </div>
      <div className="space-y-2">
        {hiringGoalOptions.map((goal) => {
          const selected = goals.includes(goal.id);
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggle(goal.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-default focus-ring",
                selected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}
              >
                {selected && <Check className="size-3" />}
              </div>
              <div>
                <div className="text-sm font-semibold">{goal.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{goal.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      <OnboardingNav
        backTo="/onboarding/team-size"
        onContinue={handleContinue}
        continueLabel="Sozlashni yakunlash"
        disabled={goals.length < 1}
      />
    </OnboardingLayout>
  );
}
