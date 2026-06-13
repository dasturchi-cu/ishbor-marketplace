import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { OnboardingLayout, OnboardingNav } from "@/components/auth/onboarding-layout";
import { loadOnboardingState, saveOnboardingState, skillOptions } from "@/lib/auth-constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/skills")({
  head: () => ({
    meta: [{ title: "Select skills — Ishbor" }],
  }),
  component: OnboardingSkillsPage,
});

function OnboardingSkillsPage() {
  const navigate = useNavigate();
  const saved = loadOnboardingState();
  const [skills, setSkills] = useState<string[]>(saved.skills);

  const toggle = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : prev.length < 8 ? [...prev, skill] : prev,
    );
  };

  const handleContinue = () => {
    saveOnboardingState({ skills });
    navigate({ to: "/onboarding/categories" });
  };

  return (
    <OnboardingLayout
      stepId="skills"
      title="What are your skills?"
      subtitle="Select up to 8 skills that best represent your expertise. Clients search by these."
    >
      <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {skills.length}/8 selected
      </p>
      <div className="flex flex-wrap gap-2">
        {skillOptions.map((skill) => {
          const selected = skills.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggle(skill)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-default focus-ring",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:border-primary/30",
              )}
            >
              {selected && <Check className="size-3.5" />}
              {skill}
            </button>
          );
        })}
      </div>

      <OnboardingNav
        backTo="/onboarding/profile"
        onContinue={handleContinue}
        disabled={skills.length < 2}
        continueLabel={skills.length < 2 ? "Select at least 2 skills" : "Continue"}
      />
    </OnboardingLayout>
  );
}
