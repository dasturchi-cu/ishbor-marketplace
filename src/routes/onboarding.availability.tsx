import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Calendar } from "lucide-react";
import { OnboardingLayout, OnboardingNav } from "@/components/auth/onboarding-layout";
import {
  loadOnboardingState,
  saveOnboardingState,
  hoursPerWeekOptions,
  responseTimeOptions,
  timezoneOptions,
} from "@/lib/auth-constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/availability")({
  head: () => ({
    meta: [{ title: "Availability — Ishbor" }],
  }),
  component: OnboardingAvailabilityPage,
});

function OnboardingAvailabilityPage() {
  const navigate = useNavigate();
  const saved = loadOnboardingState();
  const [available, setAvailable] = useState(saved.availability.available);
  const [hoursPerWeek, setHoursPerWeek] = useState(saved.availability.hoursPerWeek);
  const [timezone, setTimezone] = useState(saved.availability.timezone);
  const [responseTime, setResponseTime] = useState(saved.availability.responseTime);

  const canContinue = hoursPerWeek && responseTime;

  const handleContinue = () => {
    saveOnboardingState({
      availability: { available, hoursPerWeek, timezone, responseTime },
    });
    navigate({ to: "/welcome", search: { setup: "complete" } });
  };

  return (
    <OnboardingLayout
      stepId="availability"
      title="Set your availability"
      subtitle="Clients see this on your profile. You can update it anytime from your dashboard."
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Available for new work</div>
              <div className="text-xs text-muted-foreground">Show a green indicator on your profile</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={available}
              onClick={() => setAvailable(!available)}
              className={cn(
                "relative h-7 w-12 rounded-full transition-default",
                available ? "bg-primary" : "bg-secondary",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-6 rounded-full bg-white shadow transition-default",
                  available ? "left-[22px]" : "left-0.5",
                )}
              />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Calendar className="size-3.5" /> Hours per week
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {hoursPerWeekOptions.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHoursPerWeek(h)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm font-medium transition-default focus-ring",
                  hoursPerWeek === h
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/30",
                )}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Clock className="size-3.5" /> Typical response time
          </label>
          <div className="grid grid-cols-2 gap-2">
            {responseTimeOptions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setResponseTime(r)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm font-medium transition-default focus-ring",
                  responseTime === r
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/30",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-default focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {timezoneOptions.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </div>

      <OnboardingNav
        backTo="/onboarding/languages"
        onContinue={handleContinue}
        continueLabel="Finish setup"
        disabled={!canContinue}
      />
    </OnboardingLayout>
  );
}
