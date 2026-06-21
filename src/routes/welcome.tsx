import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowRight,
  Check,
  Sparkles,
  PartyPopper,
  Building2,
  Briefcase,
  Clock,
  BookOpen,
} from "lucide-react";
import { getOnboardingSteps, getFirstOnboardingPath, loadOnboardingState } from "@/lib/auth-constants";
import { persistOnboardingToProfile, persistOnboardingPortfolios } from "@/lib/profile-store";
import { getSession } from "@/lib/auth";
import { resolvePrimaryNextAction } from "@/lib/journey-guidance";
import { recordConversionEvent } from "@/lib/conversion-store";
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
  const firstStepPath = getFirstOnboardingPath(state.userType);
  const firstStepLabel = steps[0]?.label ?? "Profilingizni sozlang";
  const isComplete = setup === "complete";
  const isClient = state.userType === "client";
  const dashboardPath = isClient ? "/dashboard" : "/dashboard/freelancer";
  const roleLabel = isClient ? "Mijoz" : "Frilanser";
  const roleHint = isClient ? "mutaxassislarni yollash" : "ish topish va daromad olish";
  const session = getSession();
  const nextAfterComplete =
    isComplete && session
      ? resolvePrimaryNextAction(session.user, isClient ? "client" : "freelancer")
      : null;

  useEffect(() => {
    if (isComplete) {
      const session = getSession();
      if (session) {
        persistOnboardingToProfile(session.user.id);
        persistOnboardingPortfolios(session.user.id);
      }
    }
  }, [isComplete]);

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -15%, oklch(0.546 0.185 257 / 0.14), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 100%, oklch(0.546 0.185 257 / 0.06), transparent 50%)",
        }}
      />

      <header className="liquid-glass relative z-10 flex items-center justify-between border-b px-4 py-4 sm:px-6">
        <Link to="/" className="transition-default hover:opacity-80">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <div className="w-full max-w-lg animate-fade-up">
          {/* Hero card */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_-28px_oklch(0.546_0.185_257/0.22)]">
            <div className="border-b border-primary/10 bg-gradient-to-br from-primary/[0.08] via-card to-card px-6 py-8 sm:px-8 sm:py-10">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 scale-150 rounded-full bg-primary/15 blur-2xl" />
                  <div className="relative inline-flex size-[4.5rem] items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-[0_12px_32px_-12px_oklch(0.546_0.185_257/0.35)]">
                    {isComplete ? (
                      <PartyPopper className="size-8" strokeWidth={1.75} />
                    ) : (
                      <Sparkles className="size-8" strokeWidth={1.75} />
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 inline-flex size-7 items-center justify-center rounded-full bg-success text-success-foreground ring-[3px] ring-card">
                    <Check className="size-4" strokeWidth={3} />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">
                    {isComplete ? "Sozlash yakunlandi" : "Tasdiqlangansiz"}
                  </span>
                  <span className="size-1 rounded-full bg-primary/40" />
                  <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    {roleLabel}
                  </span>
                </div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-[2rem] sm:leading-tight">
                  {isComplete ? `Hammasi tayyor, ${firstName}` : `Xush kelibsiz, ${firstName}`}
                </h1>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {isComplete
                    ? `${roleLabel} profilingiz faol. Endi ${isClient ? "tekshirilgan mutaxassislarni yollashni" : "loyiha takliflarini olishni"} boshlang — to'liq eskrou himoyasi bilan.`
                    : `Hisobingiz tayyor. Ishbor'da ${roleHint} uchun ${steps.length} ta qisqa qadam qoldi.`}
                </p>
              </div>

              {isComplete && (
                <div className="mt-6 flex justify-center">
                  <EscrowShield size="md" />
                </div>
              )}
            </div>

            {/* Actions — stacked so buttons never overlap */}
            <div className="space-y-3 px-6 py-6 sm:px-8">
              {isComplete ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      recordConversionEvent("checkout_start", "welcome_complete");
                      navigate({ to: nextAfterComplete?.href ?? dashboardPath });
                    }}
                    className="touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.35)] transition-default hover:opacity-95 focus-ring"
                  >
                    {nextAfterComplete?.cta ?? "Boshqaruv paneliga o'tish"}
                    <ArrowRight className="size-4" />
                  </button>
                  <Link
                    to={dashboardPath}
                    className="touch-target flex w-full items-center justify-center rounded-xl border border-border bg-surface py-3 text-sm font-medium text-muted-foreground transition-default hover:border-primary/25 hover:text-foreground focus-ring"
                  >
                    Boshqaruv paneli
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate({ to: firstStepPath })}
                    className="touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.35)] transition-default hover:opacity-95 focus-ring"
                  >
                    {firstStepLabel} — boshlash
                    <ArrowRight className="size-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => navigate({ to: dashboardPath })}
                      className="touch-target flex items-center justify-center rounded-xl border border-border bg-surface py-3 text-sm font-medium text-muted-foreground transition-default hover:border-primary/20 hover:text-foreground focus-ring"
                    >
                      O&apos;tkazib yuborish
                    </button>
                    <Link
                      to="/ai/onboarding"
                      className="touch-target flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 py-3 text-sm font-medium text-primary transition-default hover:border-primary/35 hover:bg-primary/10 focus-ring"
                    >
                      <BookOpen className="size-3.5 shrink-0" />
                      Yo&apos;riqnoma
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Steps preview */}
          {!isComplete && (
            <div className="surface-card mt-5 overflow-hidden rounded-2xl p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {isClient ? (
                    <Building2 className="size-4 text-primary" />
                  ) : (
                    <Briefcase className="size-4 text-primary" />
                  )}
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest">
                    Keyingi qadamlar
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
                  <Clock className="size-3" />
                  ~3 daqiqa
                </span>
              </div>

              <ol className="space-y-0">
                {steps.map((step, i) => (
                  <li key={step.id} className="relative flex gap-4 pb-5 last:pb-0">
                    {i < steps.length - 1 && (
                      <span
                        className="absolute left-[0.6875rem] top-7 bottom-0 w-px bg-border"
                        aria-hidden
                      />
                    )}
                    <span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary ring-2 ring-card">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm font-medium text-foreground">{step.label}</p>
                      {i === 0 && (
                        <Link
                          to={firstStepPath}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Hozir boshlash <ArrowRight className="size-3" />
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
