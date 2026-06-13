import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { loadOnboardingState } from "@/lib/auth-constants";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [{ title: "Welcome to Ishbor" }],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();
  const state = loadOnboardingState();
  const firstName = state.fullName.split(" ")[0] || "there";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-lg text-center">
        <div className="mx-auto mb-8 inline-flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Sparkles className="size-9" />
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">You&apos;re verified</p>
        <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Welcome, {firstName}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Your account is ready. Let&apos;s set up your{" "}
          {state.userType === "client" ? "hiring" : "freelance"} profile so you can start{" "}
          {state.userType === "client" ? "finding talent" : "getting hired"} on Ishbor.
        </p>

        <div className="mt-10 space-y-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/onboarding" })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.25)] hover:opacity-90 focus-ring sm:w-auto sm:min-w-[240px]"
          >
            Set up your profile <ArrowRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: state.userType === "client" ? "/dashboard" : "/dashboard/freelancer" })}
            className="text-sm text-muted-foreground transition-default hover:text-foreground"
          >
            Skip for now
          </button>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 rounded-2xl border border-border bg-card p-5">
          {[
            { step: "1", label: state.userType === "client" ? "Company" : "Skills" },
            { step: "2", label: state.userType === "client" ? "Industry" : "Portfolio" },
            { step: "3", label: state.userType === "client" ? "Hiring goals" : "Availability" },
          ].map((s) => (
            <div key={s.step}>
              <div className="font-display text-lg font-bold text-primary">{s.step}</div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
