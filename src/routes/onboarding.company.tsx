import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2 } from "lucide-react";
import { OnboardingLayout, OnboardingNav } from "@/components/auth/onboarding-layout";
import { AuthField } from "@/components/auth/auth-field";
import { loadOnboardingState, saveOnboardingState } from "@/lib/auth-constants";

export const Route = createFileRoute("/onboarding/company")({
  head: () => ({
    meta: [{ title: "Company — Ishbor" }],
  }),
  component: OnboardingCompanyPage,
});

function OnboardingCompanyPage() {
  const navigate = useNavigate();
  const saved = loadOnboardingState();
  const [company, setCompany] = useState(saved.company);

  const handleContinue = () => {
    saveOnboardingState({ company });
    navigate({ to: "/onboarding/industry" });
  };

  return (
    <OnboardingLayout
      stepId="company"
      title="What's your company name?"
      subtitle="This appears on your job posts and helps freelancers understand who they're working with."
    >
      <AuthField
        label="Company name"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        icon={<Building2 className="size-4" />}
        placeholder="Asaka Capital"
        hint="Use your legal or trading name as clients will see it."
      />

      <OnboardingNav
        backTo="/onboarding"
        onContinue={handleContinue}
        disabled={!company.trim()}
      />
    </OnboardingLayout>
  );
}
