import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Shield } from "lucide-react";
import { SiteFooter } from "@/components/site/footer";
import { requireAuth } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { getTrustCoachInsights } from "@/lib/ai-trust-coach";

export const Route = createFileRoute("/ai/trust-coach")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Ishonch murabbiyi — Ishbor" }] }),
  component: TrustCoachPage,
});

function TrustCoachPage() {
  const { user } = useAuth();
  if (!user) return null;

  const coach = getTrustCoachInsights(user);

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <span className="font-mono text-[10px] uppercase tracking-widest">Ishonch murabbiyi</span>
        </div>
        <h1 className="font-display mt-2 text-2xl font-bold">Ishonch balli maslahatchi</h1>

        <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-card p-5">
          <Shield className="size-10 text-primary" />
          <div>
            <div className="font-display text-4xl font-bold">{coach.currentTrustScore}</div>
            <div className="text-sm text-muted-foreground">{coach.trustLabel} · +{coach.estimatedGain} potensial</div>
          </div>
        </div>

        {coach.whyLow.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display font-semibold">Nima uchun past?</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {coach.whyLow.map((w, i) => <li key={i}>• {w}</li>)}
            </ul>
          </section>
        )}

        {coach.missingProfileSections.length > 0 && (
          <section className="mt-6 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">To'ldirilmagan profil bo'limlari</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {coach.missingProfileSections.map((s) => (
                <li key={s} className="rounded-md bg-secondary px-2 py-1 text-xs">{s}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8">
          <h2 className="font-display font-semibold">Qanday oshirish mumkin</h2>
          <ul className="mt-4 space-y-3">
            {coach.howToImprove.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div>
                  <div className="font-medium">{h.action}</div>
                  <div className="text-xs text-primary">{h.impact}</div>
                </div>
                <Link to={h.href} className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                  Boshlash
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
