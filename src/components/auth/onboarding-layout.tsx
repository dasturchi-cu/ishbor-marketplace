import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme";
import { getOnboardingSteps, loadOnboardingState } from "@/lib/auth-constants";
import { cn } from "@/lib/utils";

type OnboardingLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  stepId: string;
  showProgress?: boolean;
};

export function OnboardingLayout({ children, title, subtitle, stepId, showProgress = true }: OnboardingLayoutProps) {
  const state = loadOnboardingState();
  const steps = getOnboardingSteps(state.userType);
  const currentIndex = steps.findIndex((s) => s.id === stepId);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="transition-default hover:opacity-80">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {showProgress && (
        <div className="mb-10">
          <div className="flex items-center gap-1 sm:gap-2">
            {steps.map((step, i) => (
              <div key={step.id} className="flex flex-1 items-center gap-1 sm:gap-2">
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-semibold transition-default sm:size-7 sm:text-[10px]",
                    i < currentIndex && "bg-primary text-primary-foreground",
                    i === currentIndex && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    i > currentIndex && "border border-border bg-surface text-muted-foreground",
                  )}
                >
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full",
                      i < currentIndex ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 hidden gap-2 sm:flex">
            {steps.map((step) => (
              <span
                key={step.id}
                className={cn(
                  "flex-1 truncate font-mono text-[9px] uppercase tracking-widest",
                  pathname === step.path ? "text-primary" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            ))}
          </div>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-primary sm:hidden">
            {currentIndex + 1}-qadam / {steps.length} — {steps[currentIndex]?.label}
          </p>
        </div>
        )}

        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}

export function OnboardingNav({
  backTo,
  onContinue,
  continueLabel = "Davom etish",
  disabled,
}: {
  backTo?: string;
  onContinue: () => void;
  continueLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="mt-10 flex items-center justify-between gap-4">
      {backTo ? (
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-default hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Orqaga
        </Link>
      ) : (
        <div />
      )}
      <button
        type="button"
        onClick={onContinue}
        disabled={disabled}
        className="touch-target inline-flex items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {continueLabel}
      </button>
    </div>
  );
}

export function UserTypeCard({
  type,
  title,
  description,
  icon,
  selected,
  onSelect,
}: {
  type: "client" | "freelancer";
  title: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border p-5 text-left transition-default hover-lift focus-ring",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-card hover:border-primary/30",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "inline-flex size-12 shrink-0 items-center justify-center rounded-xl",
            selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
          )}
        >
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold">{title}</h3>
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              {type === "client" ? "mijoz" : "frilanser"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
}
