import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, User } from "lucide-react";
import {
  OnboardingLayout,
  OnboardingNav,
  UserTypeCard,
} from "@/components/auth/onboarding-layout";
import { saveOnboardingState, loadOnboardingState, getFirstOnboardingPath, type UserType } from "@/lib/auth-constants";

export const Route = createFileRoute("/onboarding/")({
  head: () => ({
    meta: [{ title: "Hisob turini tanlang — Ishbor" }],
  }),
  component: OnboardingTypePage,
});

function OnboardingTypePage() {
  const navigate = useNavigate();
  const saved = loadOnboardingState();
  const [userType, setUserType] = useState<UserType>(saved.userType);

  const handleContinue = () => {
    saveOnboardingState({ userType });
    navigate({ to: getFirstOnboardingPath(userType) });
  };

  return (
    <OnboardingLayout
      stepId="type"
      showProgress={false}
      title="Ishbor'dan qanday foydalanasiz?"
      subtitle="Hisob turini tanlang. Keyinroq boshqa rolni ham qo'shishingiz mumkin."
    >
      <div className="mb-6 rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Ishbor nima?</span>{" "}
        Tekshirilgan frilanserlar bilan xavfsiz ish maydoni — loyiha joylang yoki ish toping, to&apos;lov eskrouda himoyalangan.
      </div>
      <div className="space-y-3">
        <UserTypeCard
          type="client"
          title="Men yollayman"
          description="Loyihalar joylang, mutaxassislarni ko'ring va eskrou himoyasi bilan shartnomalarni boshqaring."
          icon={<Briefcase className="size-5" />}
          selected={userType === "client"}
          onSelect={() => setUserType("client")}
        />
        <UserTypeCard
          type="freelancer"
          title="Men frilans qilaman"
          description="Xizmatlar taklif qiling, loyihalarga ariza bering va Ishbor orqali xavfsiz to'lov oling."
          icon={<User className="size-5" />}
          selected={userType === "freelancer"}
          onSelect={() => setUserType("freelancer")}
        />
      </div>

      <OnboardingNav onContinue={handleContinue} continueLabel="Davom etish" />
    </OnboardingLayout>
  );
}
