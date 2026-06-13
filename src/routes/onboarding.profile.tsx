import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, User } from "lucide-react";
import { OnboardingLayout, OnboardingNav } from "@/components/auth/onboarding-layout";
import { AuthField } from "@/components/auth/auth-field";
import { loadOnboardingState, saveOnboardingState } from "@/lib/auth-constants";

export const Route = createFileRoute("/onboarding/profile")({
  head: () => ({
    meta: [{ title: "Set up profile — Ishbor" }],
  }),
  component: OnboardingProfilePage,
});

function OnboardingProfilePage() {
  const navigate = useNavigate();
  const saved = loadOnboardingState();
  const [fullName, setFullName] = useState(saved.fullName);
  const [title, setTitle] = useState(saved.title);
  const [city, setCity] = useState(saved.city);
  const [bio, setBio] = useState(saved.bio);

  const isClient = saved.userType === "client";
  const canContinue = fullName.trim() && title.trim() && city.trim();

  const handleContinue = () => {
    saveOnboardingState({ fullName, title, city, bio });
    navigate({
      to: isClient ? "/onboarding/categories" : "/onboarding/skills",
    });
  };

  return (
    <OnboardingLayout
      stepId="profile"
      title="Build your profile"
      subtitle={
        isClient
          ? "Help freelancers understand who they're working with."
          : "A complete profile gets you hired 3× more often on Ishbor."
      }
    >
      <div className="space-y-4">
        <AuthField
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          icon={<User className="size-4" />}
          placeholder="Your full name"
        />
        <AuthField
          label={isClient ? "Your role" : "Professional title"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isClient ? "Head of Product at Asaka Capital" : "Senior UI Designer & Brand Strategist"}
        />
        <AuthField
          label="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          icon={<MapPin className="size-4" />}
          placeholder="Tashkent"
        />
        <div className="space-y-1.5">
          <label
            htmlFor="bio"
            className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            {isClient ? "About your company needs" : "Bio"}
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder={
              isClient
                ? "What kind of projects do you typically hire for?"
                : "Describe your expertise, experience, and what makes your work stand out."
            }
            className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-default placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <OnboardingNav
        backTo="/onboarding"
        onContinue={handleContinue}
        disabled={!canContinue}
      />
    </OnboardingLayout>
  );
}
