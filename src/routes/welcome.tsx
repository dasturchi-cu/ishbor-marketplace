import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Check, Sparkles, PartyPopper } from "lucide-react";
import { getOnboardingSteps, loadOnboardingState } from "@/lib/auth-constants";
import { persistOnboardingToProfile } from "@/lib/profile-store";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme";
import { EscrowShield } from "@/components/site/trust";

type WelcomeSearch = {
  setup?: "complete";
};

export const Route = createFileRoute("/welcome")({
  validateSearch: (search: Record<string, unknown>): WelcomeSearch => {
    if (search.setup === "complete") return { setup: "complete" };
    return {};
  },
  head: () => ({
    meta: [{ title: "Ishbor'ga xush kelibsiz" }],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();
  const { setup } = useSearch({ from: "/welcome" });
  const state = loadOnboardingState();
  const firstName = state.fullName.split(" ")[0] || "do'st";
  const steps = getOnboardingSteps(state.userType);
  const previewSteps = steps.slice(0, 3);
  const isComplete = setup === "complete";
  const dashboardPath = state.userType === "client" ? "/dashboard" : "/dashboard/freelancer";
  const userTypeLabel = state.userType === "client" ? "mijoz" : "frilanser";

  useEffect(() => {
    if (isComplete) {
      const session = getSession();
      if (session) persistOnboardingToProfile(session.user.id);
    }
  }, [isComplete]);

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.546 0.185 257 / 0.12), transparent 60%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
        <Link to="/" className="transition-default hover:opacity-80">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md animate-fade-up">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-[0_16px_48px_-24px_oklch(0.546_0.185_257/0.18)] sm:p-10">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
                <div className="relative inline-flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  {isComplete ? <PartyPopper className="size-7" /> : <Sparkles className="size-7" />}
                </div>
                <div className="absolute -bottom-1 -right-1 inline-flex size-6 items-center justify-center rounded-full bg-success text-success-foreground ring-4 ring-card">
                  <Check className="size-3.5" strokeWidth={3} />
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                {isComplete ? "Sozlash yakunlandi" : "Tasdiqlangansiz"}
              </p>
              <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {isComplete ? `Hammasi tayyor, ${firstName}` : `Xush kelibsiz, ${firstName}`}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {isComplete
                  ? `${userTypeLabel.charAt(0).toUpperCase() + userTypeLabel.slice(1)} profilingiz faol. To'liq eskrou himoyasi bilan ${state.userType === "client" ? "tekshirilgan mutaxassislarni yollashni" : "loyiha takliflarini olishni"} boshlang.`
                  : `Hisobingiz tayyor. Ishbor'da ${state.userType === "client" ? "mutaxassislarni yollash" : "ish topish"} uchun tez ${steps.length} qadamli sozlashni yakunlang.`}
              </p>
            </div>

            {isComplete && (
              <div className="mt-6 flex justify-center">
                <EscrowShield size="md" />
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              {isComplete ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate({ to: dashboardPath })}
                    className="touch-target inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.3)] hover:opacity-90 focus-ring"
                  >
                    Boshqaruv paneliga o&apos;tish <ArrowRight className="size-4" />
                  </button>
                  <Link
                    to={state.userType === "client" ? "/freelancers" : "/projects"}
                    className="touch-target inline-flex items-center justify-center rounded-xl border border-border bg-surface px-5 text-sm font-medium text-muted-foreground transition-default hover:border-primary/20 hover:text-foreground focus-ring"
                  >
                    {state.userType === "client" ? "Mutaxassislarni ko'rish" : "Loyihalarni topish"}
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/onboarding" })}
                    className="touch-target inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.3)] hover:opacity-90 focus-ring"
                  >
                    Profilingizni sozlang <ArrowRight className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate({ to: dashboardPath })}
                    className="touch-target inline-flex items-center justify-center rounded-xl border border-border bg-surface px-5 text-sm font-medium text-muted-foreground transition-default hover:border-primary/20 hover:text-foreground focus-ring"
                  >
                    Hozircha o&apos;tkazib yuborish
                  </button>
                  <Link
                    to="/ai/onboarding"
                    className="touch-target inline-flex items-center justify-center rounded-xl border border-primary/20 bg-primary/5 px-5 text-sm font-medium text-primary transition-default hover:border-primary/30 focus-ring"
                  >
                    Yo&apos;riqnomani ko&apos;rish
                  </Link>
                </>
              )}
            </div>
          </div>

          {!isComplete && (
            <div className="mt-6 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
              <div className="font-mono mb-4 text-center text-[9px] uppercase tracking-widest text-muted-foreground">
                Keyingi qadamlar — {steps.length} qadam · ~3 daqiqa
              </div>
              <div className="flex items-start justify-between gap-2">
                {previewSteps.map((step, i) => (
                  <div key={step.id} className="flex flex-1 flex-col items-center text-center">
                    <div className="relative flex w-full items-center justify-center">
                      {i > 0 && <div className="absolute right-1/2 left-0 top-3 h-px bg-border" />}
                      {i < previewSteps.length - 1 && <div className="absolute right-0 left-1/2 top-3 h-px bg-border" />}
                      <div className="relative z-10 inline-flex size-6 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary ring-4 ring-card">
                        {i + 1}
                      </div>
                    </div>
                    <span className="mt-2 font-mono text-[9px] uppercase tracking-widest text-foreground">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
              {steps.length > 3 && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Undan keyin yana +{steps.length - 3} ta
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
