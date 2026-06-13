import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Users } from "lucide-react";
import { OnboardingLayout, OnboardingNav } from "@/components/auth/onboarding-layout";
import { loadOnboardingState, saveOnboardingState, teamSizes } from "@/lib/auth-constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/team-size")({
  head: () => ({
    meta: [{ title: "Jamoa hajmi — Ishbor" }],
  }),
  component: OnboardingTeamSizePage,
});

function OnboardingTeamSizePage() {
  const navigate = useNavigate();
  const saved = loadOnboardingState();
  const [teamSize, setTeamSize] = useState(saved.teamSize);

  const handleContinue = () => {
    saveOnboardingState({ teamSize });
    navigate({ to: "/onboarding/hiring-goals" });
  };

  return (
    <OnboardingLayout
      stepId="team-size"
      title="Jamoangiz qanchalik katta?"
      subtitle="To'g'ri hamkorlik modellari va mutaxassislar bazasini tavsiya qilishimizga yordam beradi."
    >
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="size-4 text-primary" />
        Tashkilotingiz hajmini tanlang
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {teamSizes.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => setTeamSize(size)}
            className={cn(
              "rounded-xl border px-4 py-3 text-sm font-medium transition-default focus-ring",
              teamSize === size
                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                : "border-border bg-card hover:border-primary/30",
            )}
          >
            {size}
          </button>
        ))}
      </div>

      <OnboardingNav
        backTo="/onboarding/industry"
        onContinue={handleContinue}
        disabled={!teamSize}
      />
    </OnboardingLayout>
  );
}
