import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PartyPopper, X, ArrowRight } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { dismissWelcome, isWelcomeDismissed } from "@/lib/ftue-store";

export function WelcomeBanner({
  user,
  roleLabel,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  user: AuthUser;
  roleLabel: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  const [visible, setVisible] = useState(() => !isWelcomeDismissed(user.id));
  const firstName = user.fullName.split(" ")[0] ?? "do'st";

  if (!visible) return null;

  const handleDismiss = () => {
    dismissWelcome(user.id);
    setVisible(false);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl"
      />
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition-default hover:bg-secondary hover:text-foreground"
        aria-label="Yopish"
      >
        <X className="size-4" />
      </button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <PartyPopper className="size-6" />
        </div>
        <div className="min-w-0 flex-1 pr-8">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
            Xush kelibsiz · {roleLabel}
          </div>
          <h2 className="font-display mt-1 text-xl font-bold">
            Salom, {firstName}! Ishbor siz uchun tayyor.
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quyidagi qadamlar bilan tezda boshlang. Har bir qadam sizga keyingi harakatni ko'rsatadi.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            to={primaryHref}
            className="touch-target inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {primaryLabel} <ArrowRight className="size-4" />
          </Link>
          <Link
            to={secondaryHref}
            className="touch-target inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/20"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
