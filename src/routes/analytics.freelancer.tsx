import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { hasAdvancedAnalytics } from "@/lib/subscription-store";
import { UpsellBanner } from "@/components/monetization/upsell-banner";
import { Sparkles, BarChart3, TrendingUp, Eye, DollarSign, Star, MessageSquare } from "lucide-react";
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
import { subscribeAnalyticsEvents, getAllAnalyticsEvents } from "@/lib/analytics-events-store";
import { subscribeRevenue } from "@/lib/revenue-store";

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

  useSyncExternalStore(subscribeAnalyticsEvents, () => getAllAnalyticsEvents().length, () => 0);
  useSyncExternalStore(subscribeRevenue, () => null, () => null);

  if (!user) return null;
  const analytics = getFreelancerAnalytics(user, range);
  const chartData = user.username ? getFreelancerChartData(user.username, range) : [];
  const earningsChart = user.username ? getFreelancerEarningsChart(user.username) : [];
  const topPortfolio = user.username ? getTopPortfolioItems(user.username) : [];
  const topServices = user.username ? getTopServicesForFreelancer(user.username) : [];
  const maxChart = Math.max(...chartData.map((d) => d.value), 1);
  const maxEarnings = Math.max(...earningsChart.map((d) => d.value), 1);
  const showAdvanced = hasAdvancedAnalytics(user.id);

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
          <Link to="/my-services" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/20">
            Mening xizmatlarim
          </Link>
        </div>
      }
    >
      {!showAdvanced && <UpsellBanner context="analytics" />}

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Eye} label="Profil ko'rishlar" value={analytics.profileViews} />
        <MetricCard icon={BarChart3} label="Portfel ko'rishlar" value={analytics.portfolioViews} />
        <MetricCard icon={DollarSign} label={`Daromad (${range} kun)`} value={`$${analytics.earnings30.toLocaleString()}`} />
        <MetricCard icon={Star} label="Ishonch balli" value={analytics.trustScore} />
        <MetricCard icon={TrendingUp} label="Muvaffaqiyat balli" value={analytics.successScore} />
        <MetricCard icon={MessageSquare} label="Javob foizi" value={`${analytics.responseRate}%`} />
        <MetricCard icon={BarChart3} label="Taklif qabul foizi" value={`${analytics.proposalAcceptanceRate}%`} />
        <MetricCard icon={Eye} label="Xizmat buyurtmalari" value={analytics.serviceOrders} />
        {showAdvanced && (
          <>
            <MetricCard icon={Sparkles} label="Kredit sarfi" value={`${analytics.creditSpend.toLocaleString()} UZS`} />
            <MetricCard icon={TrendingUp} label="Rivojlantirish daromadligi" value={`${analytics.promotionRoi}x`} />
            <MetricCard icon={Eye} label="Ajratilgan faol" value={analytics.featuredPerformance.activeListings} />
          </>
        )}
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

      <div className="mt-8 grid gap-3 sm:grid-cols-3 rounded-xl border border-border bg-card p-4 text-sm">
        <div><span className="text-muted-foreground">Saqlashlar:</span> {analytics.portfolioSaves + analytics.serviceSaves}</div>
        <div><span className="text-muted-foreground">Ulushlar:</span> {analytics.portfolioShares}</div>
        <div><span className="text-muted-foreground">Kontakt bosishlar:</span> {analytics.contactClicks}</div>
        <div><span className="text-muted-foreground">Yollash konversiyasi:</span> {analytics.hireConversions}</div>
        <div><span className="text-muted-foreground">Profil to'ldirilishi:</span> {analytics.profileCompletion}%</div>
        <div><span className="text-muted-foreground">Yakunlangan buyurtmalar:</span> {analytics.ordersCompleted}</div>
        {showAdvanced && (
          <>
            <div><span className="text-muted-foreground">Ko'rishlar (voronka):</span> {analytics.visibilityFunnel.views}</div>
            <div><span className="text-muted-foreground">Kontakt → buyurtma:</span> {analytics.visibilityFunnel.contactToOrder}%</div>
            <div><span className="text-muted-foreground">Ajratilgan sarflangan:</span> {analytics.featuredPerformance.creditsSpent.toLocaleString()} UZS</div>
          </>
        )}
      </div>
      </>
      )}
    </WorkspaceShell>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="size-4 text-primary" />
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display mt-1 text-2xl font-bold">{value}</div>
    </div>
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
