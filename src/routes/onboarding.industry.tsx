import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { OnboardingLayout, OnboardingNav } from "@/components/auth/onboarding-layout";
import { loadOnboardingState, saveOnboardingState, industries } from "@/lib/auth-constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/industry")({
  head: () => ({
    meta: [{ title: "Soha — Ishbor" }],
  }),
  component: OnboardingIndustryPage,
});

function OnboardingIndustryPage() {
  const navigate = useNavigate();
  const saved = loadOnboardingState();
  const [industry, setIndustry] = useState(saved.industry);

  const handleContinue = () => {
    saveOnboardingState({ industry });
    navigate({ to: "/onboarding/team-size" });
  };

  return (
    <OnboardingLayout
      stepId="industry"
      title="Qaysi sohadasiz?"
      subtitle="Sektoringizga mos tajribaga ega frilanserlarni ko'rsatamiz."
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {industries.map((ind) => (
          <button
            key={ind}
            type="button"
            onClick={() => setIndustry(ind)}
            className={cn(
              "rounded-xl border px-4 py-3 text-sm font-medium transition-default focus-ring",
              industry === ind
                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                : "border-border bg-card hover:border-primary/30",
            )}
          >
            {ind}
          </button>
        ))}
      </div>

      <OnboardingNav
        backTo="/onboarding/company"
        onContinue={handleContinue}
        disabled={!industry}
      />
    </OnboardingLayout>
  );
}
