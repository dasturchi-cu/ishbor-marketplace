import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, User } from "lucide-react";
import {
  OnboardingLayout,
  OnboardingNav,
  UserTypeCard,
} from "@/components/auth/onboarding-layout";
import { saveOnboardingState, loadOnboardingState, type UserType } from "@/lib/auth-constants";

export const Route = createFileRoute("/onboarding/")({
  head: () => ({
    meta: [{ title: "Choose account type — Ishbor" }],
  }),
  component: OnboardingTypePage,
});

function OnboardingTypePage() {
  const navigate = useNavigate();
  const saved = loadOnboardingState();
  const [userType, setUserType] = useState<UserType>(saved.userType);

  const handleContinue = () => {
    saveOnboardingState({ userType });
    navigate({ to: "/onboarding/profile" });
  };

  return (
    <OnboardingLayout
      stepId="type"
      title="How will you use Ishbor?"
      subtitle="Choose your account type. You can always add the other role later."
    >
      <div className="space-y-3">
        <UserTypeCard
          type="client"
          title="I'm hiring"
          description="Post projects, browse talent, and manage contracts with escrow protection."
          icon={<Briefcase className="size-5" />}
          selected={userType === "client"}
          onSelect={() => setUserType("client")}
        />
        <UserTypeCard
          type="freelancer"
          title="I'm freelancing"
          description="Offer services, apply to projects, and get paid securely through Ishbor."
          icon={<User className="size-5" />}
          selected={userType === "freelancer"}
          onSelect={() => setUserType("freelancer")}
        />
      </div>

      <OnboardingNav onContinue={handleContinue} continueLabel="Continue" />
    </OnboardingLayout>
  );
}
