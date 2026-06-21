/** Client analytics route — moved from analytics.client.tsx (TanStack `.client.*` conflict). */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { DollarSign, FolderOpen, Shield, Users } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { EmptyState } from "@/components/site/feedback";
import { ProtectedGate } from "@/components/auth/protected-gate";
import {
  AnalyticsActivityChart,
  AnalyticsChartCard,
  AnalyticsRangeToggle,
  AnalyticsSpendChart,
  AnalyticsStatCard,
} from "@/components/analytics/analytics-charts";
import { requireRole } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { getClientAnalytics, getClientChartData, getClientSpendChart } from "@/lib/analytics-utils";
import { getWeeklyBuckets, subscribeAnalyticsEvents, getAllAnalyticsEvents } from "@/lib/analytics-events-store";

export const Route = createFileRoute("/analytics/client")({
  beforeLoad: requireRole(["client"]),
  head: () => ({ meta: [{ title: "Mijoz analitikasi — Ishbor" }] }),
  component: () => (
    <ProtectedGate roles={["client"]}>
      <ClientAnalyticsPage />
    </ProtectedGate>
  ),
});

function ClientAnalyticsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<7 | 30 | 90>(30);

  useSyncExternalStore(subscribeAnalyticsEvents, () => getAllAnalyticsEvents().length, () => 0);

  if (!user) return null;
  const analytics = getClientAnalytics(user, range);
  const activityChart =
    range === 90
      ? getWeeklyBuckets(["project_created", "proposal_received", "order_created", "escrow_funded"], 13).map(
          (d) => ({ label: d.label, value: d.value }),
        )
      : getClientChartData(user.id, range);
  const spendChart = getClientSpendChart(user);
  const hasData = analytics.projectsCreated > 0 || analytics.totalSpend > 0 || analytics.freelancersHired > 0;

  return (
    <WorkspaceShell
      eyebrow="Analitika markazi"
      title="Mijoz analitikasi"
      actions={<AnalyticsRangeToggle value={range} onChange={setRange} />}
    >
      {!hasData ? (
        <EmptyState
          icon={FolderOpen}
          title="Hali analitika ma'lumotlari yo'q"
          description="Birinchi loyihangizni joylang — yollash faolligi va xarajatlar shu yerda ko'rinadi."
          action={
            <Link to="/projects/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Loyiha joylash
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-[0_8px_32px_-8px_oklch(0.546_0.185_257/0.4)] sm:p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full opacity-25"
              style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.35), transparent)" }}
            />
            <div className="relative flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/60">
                  Jami xarajat
                </div>
                <div className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  ${analytics.totalSpend.toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-primary-foreground/65">
                  ≈ {Math.round(analytics.totalSpend * 12500).toLocaleString()} UZS · {range} kun davri
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-primary-foreground/55">Eskrou</div>
                  <div className="font-display mt-0.5 text-lg font-bold">${analytics.escrowFunded.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-primary-foreground/55">Takroriy</div>
                  <div className="font-display mt-0.5 text-lg font-bold">{analytics.repeatFreelancerRate}%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <AnalyticsStatCard label="Yaratilgan loyihalar" value={String(analytics.projectsCreated)} icon={FolderOpen} />
            <AnalyticsStatCard
              label="Yollangan frilanserlar"
              value={String(analytics.freelancersHired)}
              icon={Users}
              accent
            />
            <AnalyticsStatCard
              label="Jami xarajat"
              value={`$${analytics.totalSpend.toLocaleString()}`}
              icon={DollarSign}
            />
            <AnalyticsStatCard
              label="Eskrou moliyalashtirilgan"
              value={`$${analytics.escrowFunded.toLocaleString()}`}
              icon={Shield}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AnalyticsChartCard title="Yollash faolligi" subtitle={`So'nggi ${range} kun — loyiha, taklif va buyurtmalar`}>
              <AnalyticsActivityChart data={activityChart} range={range} />
            </AnalyticsChartCard>
            <AnalyticsChartCard title="Xarajat dinamikasi" subtitle="Oylik eskrou va yakunlangan buyurtmalar">
              <AnalyticsSpendChart data={spendChart} />
            </AnalyticsChartCard>
          </div>

          {analytics.proposalsReceived > 0 && (
            <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{analytics.proposalsReceived}</span> ta taklif qabul qilindi ·
              o&apos;rtacha yollash xarajati{" "}
              <span className="font-semibold text-foreground">
                {analytics.averageSpendPerHire > 0 ? `$${analytics.averageSpendPerHire.toLocaleString()}` : "—"}
              </span>
              {analytics.hiringSuccessRate > 0 && (
                <>
                  {" "}· yollash muvaffaqiyati{" "}
                  <span className="font-semibold text-foreground">{analytics.hiringSuccessRate}%</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </WorkspaceShell>
  );
}
