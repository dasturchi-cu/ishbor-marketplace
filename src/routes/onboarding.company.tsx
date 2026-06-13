import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2 } from "lucide-react";
import { OnboardingLayout, OnboardingNav } from "@/components/auth/onboarding-layout";
import { AuthField } from "@/components/auth/auth-field";
import { loadOnboardingState, saveOnboardingState } from "@/lib/auth-constants";

export const Route = createFileRoute("/onboarding/company")({
  head: () => ({
    meta: [{ title: "Kompaniya — Ishbor" }],
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
      title="Kompaniyangiz nomi nima?"
      subtitle="Bu nom ish e'lonlaringizda ko'rinadi va frilanserlar kim bilan ishlayotganini tushunishiga yordam beradi."
    >
      <AuthField
        label="Kompaniya nomi"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        icon={<Building2 className="size-4" />}
        placeholder="Asaka Capital"
        hint="Mijozlar ko'radigan rasmiy yoki savdo nomini kiriting."
      />

      <OnboardingNav
        backTo="/onboarding"
        onContinue={handleContinue}
        disabled={!company.trim()}
      />
    </OnboardingLayout>
  );
}
