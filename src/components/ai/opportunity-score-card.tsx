import { Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { computeOpportunityScore, getOpportunityLabel } from "@/lib/ai-opportunity-store";
import type { AuthUser } from "@/lib/auth";
import { useActiveRole } from "@/hooks/use-active-role";

const BREAKDOWN_MAX = {
  profileCompletion: 25,
  portfolio: 20,
  services: 15,
  trust: 20,
  activity: 15,
} as const;

const BREAKDOWN_LABELS: Record<keyof typeof BREAKDOWN_MAX, string> = {
  profileCompletion: "Profil",
  portfolio: "Portfolio",
  services: "Xizmat",
  trust: "Ishonch",
  activity: "Faollik",
};

export function OpportunityScoreCard({ user }: { user: AuthUser }) {
  const { activeRole } = useActiveRole();
  const opp = computeOpportunityScore(user);
  const label = getOpportunityLabel(opp.total);
  const tone = opp.total >= 80 ? "text-success" : opp.total >= 60 ? "text-primary" : opp.total >= 40 ? "text-warning" : "text-muted-foreground";
  const improveHref = activeRole === "freelancer" ? "/ai/trust-coach" : "/ai/onboarding";
  const improveLabel = activeRole === "freelancer" ? "Ishonchni oshirish" : "Profilni yaxshilash";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/5 blur-2xl"
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <ScoreRing score={opp.total} />
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Sparkles className="size-3 text-primary" />
              Imkoniyat balli
            </div>
            <p className={`font-display mt-1 text-sm font-medium ${tone}`}>{label}</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Profil, portfolio va faollik asosida hisoblanadi — yaxshilang va ko&apos;proq mos takliflar oling.
            </p>
          </div>
        </div>

        <div className="grid flex-1 gap-2 sm:max-w-md">
          {(Object.keys(BREAKDOWN_MAX) as (keyof typeof BREAKDOWN_MAX)[]).map((key) => (
            <BreakdownRow
              key={key}
              label={BREAKDOWN_LABELS[key]}
              value={opp[key]}
              max={BREAKDOWN_MAX[key]}
            />
          ))}
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        <Link
          to={improveHref}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-default hover:opacity-90"
        >
          <Sparkles className="size-3" />
          {improveLabel}
        </Link>
        <Link
          to="/ai"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-default hover:border-primary/25 hover:text-primary"
        >
          AI markaz
        </Link>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="relative size-[88px] shrink-0">
      <svg viewBox="0 0 88 88" className="size-full -rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold leading-none">{score}</span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="grid grid-cols-[72px_1fr_28px] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-right font-mono font-semibold tabular-nums">{value}</span>
    </div>
  );
}
