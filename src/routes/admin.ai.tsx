import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, AlertTriangle, TrendingUp, Lightbulb } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { useAdminSearchOpen } from "@/components/admin/search";
import { computeFounderAiInsights } from "@/lib/ai-insights-store";
import { subscribeRevenue } from "@/lib/revenue-store";
import { subscribeAnalyticsEvents } from "@/lib/analytics-events-store";
import { subscribeAgencies } from "@/lib/agency-store";
import { useStoreVersion } from "@/hooks/use-store-version";
import { STORE_KEYS } from "@/lib/store-version";

export const Route = createFileRoute("/admin/ai")({
  head: () => ({ meta: [{ title: "AI Markaz — Ishbor Admin" }] }),
  component: AdminAiCenterPage,
});

function severityColor(s: "opportunity" | "warning" | "critical") {
  if (s === "opportunity") return "border-primary/30 bg-primary/5 text-primary";
  if (s === "warning") return "border-warning/30 bg-warning/5 text-warning";
  return "border-destructive/30 bg-destructive/5 text-destructive";
}

function AdminAiCenterPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  useStoreVersion(STORE_KEYS.revenue, subscribeRevenue);
  useStoreVersion(STORE_KEYS.analyticsEvents, subscribeAnalyticsEvents);
  useStoreVersion(STORE_KEYS.agencies, subscribeAgencies);
  const ai = computeFounderAiInsights(30);

  return (
    <AdminShell eyebrow="AI Markaz" title="Asoschilar AI markazi" onSearchOpen={onSearchOpen}>
      <div className="mb-6 flex flex-wrap gap-3">
        {ai.liquidityWarning && (
          <Badge icon={AlertTriangle} label="Likvidlik ogohlantirishi" variant="warning" />
        )}
        {ai.retentionWarning && (
          <Badge icon={AlertTriangle} label="Qaytish darajasi ogohlantirishi" variant="warning" />
        )}
        {!ai.liquidityWarning && !ai.retentionWarning && (
          <Badge icon={TrendingUp} label="Bozor sog'lom" variant="success" />
        )}
        <Link to="/admin/founder" className="text-xs text-primary hover:underline">Asoschilar paneli →</Link>
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold">Bozor imkoniyatlari</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {ai.insights.map((ins) => (
            <div key={ins.id} className={`rounded-xl border p-4 ${severityColor(ins.severity)}`}>
              <div className="font-semibold">{ins.title}</div>
              <p className="mt-1 text-sm opacity-90">{ins.description}</p>
              {ins.metric && <div className="mt-2 font-mono text-xs">{ins.metric}</div>}
              <Link to={ins.href} className="mt-3 inline-block text-xs font-medium underline">
                {ins.action}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold">Zaif kategoriyalar</h3>
          {ai.weakCategories.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Hozircha yetishmovchilik yo'q</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {ai.weakCategories.map((c) => (
                <li key={c.category} className="flex justify-between py-2 text-sm">
                  <span>{c.category}</span>
                  <span className="font-mono text-muted-foreground">talab {c.demand} · ta'minot {c.supply} · yetishmovchilik {c.gap}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold">Tez o'sayotgan ko'nikmalar</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {ai.fastGrowingSkills.map((s) => (
              <span key={s.skill} className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {s.skill} ({s.count})
              </span>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 font-display font-semibold">
          <Lightbulb className="size-4 text-primary" /> Tavsiya etilgan harakatlar
        </h3>
        <ul className="mt-4 space-y-3">
          {ai.suggestedActions.map((a, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
              <div>
                <div className="font-medium">{a.action}</div>
                <div className="text-xs text-primary">{a.impact}</div>
              </div>
              <Link to={a.href} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/30">
                Bajarish
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" />
          <span className="text-sm font-medium">Qoidalar asosidagi AI — haqiqiy platforma ma'lumotlari</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Barcha tahlillar buyurtmalar, loyihalar, xizmatlar, arizalar va analitika hodisalaridan hisoblanadi.
        </p>
      </section>
    </AdminShell>
  );
}

function Badge({ icon: Icon, label, variant }: { icon: typeof Sparkles; label: string; variant: "warning" | "success" }) {
  const cls = variant === "warning" ? "border-warning/30 bg-warning/10 text-warning" : "border-success/30 bg-success/10 text-success";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      <Icon className="size-3.5" /> {label}
    </span>
  );
}
