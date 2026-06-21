import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { SimpleStatCard } from "@/components/site/simple-stat-card";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { EmptyState } from "@/components/site/feedback";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireRole } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import {
  getFreelancerAnalytics,
  getFreelancerChartData,
  getFreelancerEarningsChart,
  getTopPortfolioItems,
  getTopServicesForFreelancer,
} from "@/lib/analytics-utils";
import { subscribeAnalyticsEvents } from "@/lib/analytics-events-store";
import { subscribeRevenue } from "@/lib/revenue-store";
import { useStoreVersion } from "@/hooks/use-store-version";
import { STORE_KEYS } from "@/lib/store-version";

export const Route = createFileRoute("/analytics/freelancer")({
  beforeLoad: requireRole(["freelancer"]),
  head: () => ({ meta: [{ title: "Frilanser analitikasi — Ishbor" }] }),
  component: () => (
    <ProtectedGate roles={["freelancer"]}>
      <FreelancerAnalyticsPage />
    </ProtectedGate>
  ),
});

function FreelancerAnalyticsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<7 | 30 | 90>(30);

  useStoreVersion(STORE_KEYS.analyticsEvents, subscribeAnalyticsEvents);
  useStoreVersion(STORE_KEYS.revenue, subscribeRevenue);

  if (!user) return null;
  const analytics = getFreelancerAnalytics(user, range);
  const chartData = user.username ? getFreelancerChartData(user.username, range) : [];
  const earningsChart = user.username ? getFreelancerEarningsChart(user.username) : [];
  const topPortfolio = user.username ? getTopPortfolioItems(user.username) : [];
  const topServices = user.username ? getTopServicesForFreelancer(user.username) : [];
  const maxChart = Math.max(...chartData.map((d) => d.value), 1);
  const maxEarnings = Math.max(...earningsChart.map((d) => d.value), 1);

  return (
    <WorkspaceShell
      eyebrow="Analitika markazi"
      title="Frilanser analitikasi"
      actions={
        <div className="flex flex-wrap gap-2">
          {([7, 30, 90] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${range === r ? "bg-primary text-primary-foreground" : "border border-border"}`}
            >
              {r} kun
            </button>
          ))}
        </div>
      }
    >
      {analytics.profileViews === 0 && analytics.earnings30 === 0 && analytics.ordersCompleted === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Hali analitika ma'lumotlari yo'q"
          description="Xizmat yoki portfolio qo'shing va loyihalarga ariza yuboring — statistikalar shu yerda paydo bo'ladi."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/services/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Xizmat yaratish</Link>
              <Link to="/projects" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary/30">Ish topish</Link>
            </div>
          }
        />
      ) : (
      <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SimpleStatCard label="Profil ko'rishlar" value={String(analytics.profileViews)} />
        <SimpleStatCard label={`Daromad (${range} kun)`} value={`$${analytics.earnings30.toLocaleString()}`} />
        <SimpleStatCard label="Ishonch balli" value={String(analytics.trustScore)} />
        <SimpleStatCard label="Javob foizi" value={`${analytics.responseRate}%`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Faollik" subtitle={`So'nggi ${range} kun`}>
          <div className="flex h-36 items-end gap-1">
            {chartData.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-primary/80" style={{ height: `${Math.max(4, (d.value / maxChart) * 120)}px` }} />
                <span className="font-mono text-[8px] text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Daromad" subtitle="Oylik">
          <div className="flex h-36 items-end gap-2">
            {earningsChart.map((d) => (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-[9px]">${d.value}</span>
                <div className="w-full rounded-t bg-primary" style={{ height: `${Math.max(4, (d.value / maxEarnings) * 100)}px` }} />
                <span className="font-mono text-[8px] text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <TopList title="Eng yaxshi portfel" items={topPortfolio.map((p) => ({ name: p.title, stat: `${p.analytics.views} ko'rish` }))} empty="Portfel e'lon qiling" href="/portfolio/create" />
        <TopList title="Eng yaxshi xizmatlar" items={topServices.map((s) => ({ name: s.title, stat: `${s.orders} buyurtma` }))} empty="Xizmat yarating" href="/services/create" />
      </div>

      </>
      )}
    </WorkspaceShell>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-display font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function TopList({ title, items, empty, href }: { title: string; items: { name: string; stat: string }[]; empty: string; href?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-display font-semibold">{title}</h3>
      {items.length === 0 ? (
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">{empty}</p>
          {href && (
            <Link to={href} className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
              Boshlash →
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {items.map((item) => (
            <li key={item.name} className="flex justify-between py-2 text-sm">
              <span className="truncate font-medium">{item.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{item.stat}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
