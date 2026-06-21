import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import type { JourneyBanner } from "@/lib/journey-guidance";
import { cn } from "@/lib/utils";

/** Single-purpose banner: what this page is for + one primary next step. */
export function JourneyBannerCard({
  banner,
  className,
}: {
  banner: JourneyBanner;
  className?: string;
}) {
  const isUrgent = banner.variant === "urgent";
  const isSuccess = banner.variant === "success";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        isUrgent && "border-primary/30 bg-primary/5",
        isSuccess && "border-success/25 bg-success/5",
        !isUrgent && !isSuccess && "border-border bg-card",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <Sparkles className="size-4 shrink-0 text-success" />
          ) : (
            <Compass className="size-4 shrink-0 text-primary" />
          )}
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {banner.purpose}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{banner.nextStep}</p>
      </div>
      <Link
        to={banner.href}
        search={banner.search}
        className={cn(
          "touch-target inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-default",
          isUrgent || isSuccess
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "border border-border bg-surface hover:border-primary/25",
        )}
      >
        {banner.cta} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

/** Logged-in landing strip — what IshBor is + one next action. */
export function HomeNextStepStrip({
  greeting,
  roleLabel,
  nextHref,
  nextCta,
  nextHint,
}: {
  greeting: string;
  roleLabel: string;
  nextHref: string;
  nextCta: string;
  nextHint: string;
}) {
  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-left">
      <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
        {greeting} · {roleLabel}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{nextHint}</p>
      <Link
        to={nextHref}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        {nextCta} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
