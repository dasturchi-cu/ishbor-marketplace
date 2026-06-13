import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, AlertTriangle } from "lucide-react";
import { SiteFooter } from "@/components/site/footer";
import { requireAuth } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { analyzePortfolio } from "@/lib/ai-portfolio-optimizer";
import { OpportunityScoreCard } from "@/components/ai/opportunity-score-card";

export const Route = createFileRoute("/ai/portfolio-optimizer")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Portfel optimizatsiyasi — Ishbor" }] }),
  component: PortfolioOptimizerPage,
});

function PortfolioOptimizerPage() {
  const { user } = useAuth();
  if (!user) return null;

  const analysis = analyzePortfolio(user);

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <span className="font-mono text-[10px] uppercase tracking-widest">AI tahlil</span>
        </div>
        <h1 className="font-display mt-2 text-2xl font-bold">Portfel optimizatori</h1>

        <div className="mt-6">
          <OpportunityScoreCard user={user} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Portfel" value={analysis.portfolioCount} />
          <Stat label="Loyiha hikoyalari" value={analysis.caseStudyCount} />
          <Stat label="Optimizatsiya" value={`${analysis.score}/100`} />
        </div>

        {analysis.weakAreas.length > 0 && (
          <div className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-center gap-2 font-semibold text-warning">
              <AlertTriangle className="size-4" /> Zaif joylar
            </div>
            <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
              {analysis.weakAreas.map((w) => <li key={w}>{w}</li>)}
            </ul>
          </div>
        )}

        <section className="mt-8">
          <h2 className="font-display font-semibold">Tavsiyalar</h2>
          <ul className="mt-4 space-y-3">
            {analysis.suggestions.map((s) => (
              <li key={s.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                      s.priority === "high" ? "bg-destructive/10 text-destructive" :
                      s.priority === "medium" ? "bg-warning/10 text-warning" : "bg-secondary text-muted-foreground"
                    }`}>{s.priority}</span>
                    <h3 className="mt-1 font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                    <p className="mt-1 text-xs text-primary">{s.impact}</p>
                  </div>
                  <Link to={s.href} className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/30">
                    Bajarish
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
