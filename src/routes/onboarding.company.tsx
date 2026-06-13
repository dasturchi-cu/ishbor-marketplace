import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2 } from "lucide-react";
import { OnboardingLayout, OnboardingNav } from "@/components/auth/onboarding-layout";
import { AuthField } from "@/components/auth/auth-field";
import { loadOnboardingState, saveOnboardingState, companySizes, industries } from "@/lib/auth-constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/company")({
  head: () => ({
    meta: [{ title: "Company setup — Ishbor" }],
  }),
  component: OnboardingCompanyPage,
});

function OnboardingCompanyPage() {
  const navigate = useNavigate();
  const saved = loadOnboardingState();
  const [company, setCompany] = useState(saved.company);
  const [companySize, setCompanySize] = useState(saved.companySize);
  const [industry, setIndustry] = useState(saved.industry);

  const canContinue = company.trim() && companySize && industry;

  const handleContinue = () => {
    saveOnboardingState({ company, companySize, industry });
    navigate({ to: "/dashboard" });
  };

  return (
    <OnboardingLayout
      stepId="company"
      title="Tell us about your company"
      subtitle="This helps us match you with the right freelancers and streamline hiring."
    >
      <div className="space-y-6">
        <AuthField
          label="Company name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          icon={<Building2 className="size-4" />}
          placeholder="Asaka Capital"
        />

        <div className="space-y-2">
          <label className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Company size
          </label>
          <div className="flex flex-wrap gap-2">
            {companySizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setCompanySize(size)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-default focus-ring",
                  companySize === size
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/30",
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Industry
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {industries.map((ind) => (
              <button
                key={ind}
                type="button"
                onClick={() => setIndustry(ind)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-default focus-ring",
                  industry === ind
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/30",
                )}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>
      </div>

      <OnboardingNav
        backTo="/onboarding/categories"
        onContinue={handleContinue}
        continueLabel="Finish setup"
        disabled={!canContinue}
      />
    </OnboardingLayout>
  );
}
