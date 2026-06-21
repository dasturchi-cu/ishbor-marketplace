import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/shell";
import { useAdminSearchOpen } from "@/components/admin/search";
import { getMarketplaceOverview, subscribeRevenue } from "@/lib/revenue-store";
import { getConversionRates, getConversionHealth, funnelStepLabels } from "@/lib/conversion-store";
import { agencyVerificationLabels } from "@/lib/agency-types";
import { computeMarketplaceHealth } from "@/lib/marketplace-health";
import { getMonetizationOverview } from "@/lib/monetization-store";
import { subscribeSubscriptions } from "@/lib/subscription-store";
import { getAllAgencies, subscribeAgencies } from "@/lib/agency-store";
import { computeFounderAgencyMetrics } from "@/lib/agency-metrics-store";
import { computeFounderAiInsights } from "@/lib/ai-insights-store";
import { getAllAnalyticsEvents, subscribeAnalyticsEvents } from "@/lib/analytics-events-store";
import { subscribeCredits } from "@/lib/credits-store";
import { TrendingUp, DollarSign, Users, Shield, Gift, RefreshCw, Star, Layers, CreditCard, Flame, Building2 } from "lucide-react";
import { useStoreVersion } from "@/hooks/use-store-version";
import { STORE_KEYS } from "@/lib/store-version";

export const Route = createFileRoute("/admin/founder")({
  head: () => ({ meta: [{ title: "Asoschilar paneli — Ishbor" }] }),
  component: FounderDashboardPage,
});

function statusColor(status: "healthy" | "watch" | "critical") {
  if (status === "healthy") return "text-success border-success/30 bg-success/10";
  if (status === "watch") return "text-warning border-warning/30 bg-warning/10";
  return "text-destructive border-destructive/30 bg-destructive/10";
}

function statusEmoji(status: "healthy" | "watch" | "critical") {
  return status === "healthy" ? "🟢" : status === "watch" ? "🟡" : "🔴";
}

function statusLabel(status: "healthy" | "watch" | "critical") {
  return status === "healthy" ? "Sog'lom" : status === "watch" ? "Kuzatish" : "Kritik";
}

function FounderDashboardPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  useStoreVersion(STORE_KEYS.revenue, subscribeRevenue);
  useStoreVersion(STORE_KEYS.subscriptions, subscribeSubscriptions);
  useStoreVersion(STORE_KEYS.agencies, subscribeAgencies);
  useStoreVersion(STORE_KEYS.analyticsEvents, subscribeAnalyticsEvents);
  useStoreVersion(STORE_KEYS.credits, subscribeCredits);

  const overview = getMarketplaceOverview(30);
  const monetization = getMonetizationOverview(30);
  const agencyMetrics = computeFounderAgencyMetrics(getAllAgencies(), 30);
  const aiInsights = computeFounderAiInsights(30);
  const conversion = getConversionRates(30);
  const convHealth = getConversionHealth(30);
  const health = computeMarketplaceHealth(30);
  const events = getAllAnalyticsEvents();
  const featuredCount = events.filter((e) => e.type === "featured_purchase").length;

  const trustHealth: "healthy" | "watch" | "critical" =
    overview.completedOrders >= 3 ? "healthy" : overview.totalOrders >= 1 ? "watch" : "critical";
  const revenueHealth: "healthy" | "watch" | "critical" =
    overview.revenue > 0 ? "healthy" : overview.gmv > 0 ? "watch" : "critical";

  return (
    <AdminShell eyebrow="Asoschilar markazi" title="Platforma ko'rinishi" onSearchOpen={onSearchOpen}>
      <div className="mb-6 flex flex-wrap gap-3">
        <HealthBadge label="Daromad" status={revenueHealth} />
        <HealthBadge label="Likvidlik" status={health.liquidityStatus} />
        <HealthBadge label="Qaytish darajasi" status={health.retentionStatus} />
        <HealthBadge label="Sharhlar" status={health.reviewStatus} />
        <HealthBadge label="Konversiya" status={convHealth} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FounderCard icon={DollarSign} label="GMV" value={`$${overview.gmv.toLocaleString()}`} sub="30 kun" />
        <FounderCard icon={TrendingUp} label="Platforma daromadi" value={`$${overview.revenue.toLocaleString()}`} sub="5% + ajratilgan ro'yxatlar" />
        <FounderCard icon={Layers} label="Bozor likvidligi" value={`${health.liquidity}%`} sub="Taklif/buyurtma nisbati" />
        <FounderCard icon={RefreshCw} label="Mijoz qaytishi" value={`${health.clientRetention}%`} sub={`Frilanser ${health.freelancerRetention}%`} />
        <FounderCard icon={Star} label="Sharh darajasi" value={`${health.reviewRate}%`} sub="Yakunlangan buyurtmalar" />
        <FounderCard icon={Users} label="Takror yollash" value={`${health.repeatHireRate}%`} sub="Takror mijozlar" />
        <FounderCard icon={Shield} label="Faol e'lonlar" value={health.activeListings} sub={`${overview.totalProjects} loyiha · ${overview.totalServices} xizmat`} />
        <FounderCard icon={Gift} label="Ajratilgan ro'yxat xaridlari" value={featuredCount} sub="Kredit monetizatsiyasi" />
        <FounderCard icon={CreditCard} label="Oylik takrorlanuvchi daromad" value={`${monetization.mrr.toLocaleString()} UZS`} sub={`Foydalanuvchi daromadi ${monetization.arpu.toLocaleString()} UZS`} />
        <FounderCard icon={TrendingUp} label="Obuna daromadi" value={`${monetization.subscriptionRevenue.toLocaleString()} UZS`} sub={`Pro ${monetization.subscriptionMix.pro} · Elite ${monetization.subscriptionMix.elite}`} />
        <FounderCard icon={Flame} label="Kredit sarfi" value={`${monetization.creditBurnRate.toLocaleString()} UZS`} sub={`O'sish ${monetization.revenueGrowth}%`} />
        <FounderCard icon={Building2} label="Agentliklar" value={agencyMetrics.publishedAgencies} sub={`${agencyMetrics.totalAgencies} jami · ${agencyMetrics.teamGrowth} yangi a'zo`} />
        <FounderCard icon={DollarSign} label="Agentlik GMV" value={`$${agencyMetrics.agencyGmv.toLocaleString()}`} sub={`Daromad $${agencyMetrics.agencyRevenue.toLocaleString()}`} />
        <FounderCard icon={Users} label="Agentlik qaytishi" value={`${agencyMetrics.agencyRetention}%`} sub={`${agencyVerificationLabels.verified} ${agencyMetrics.verifiedCount} · ${agencyVerificationLabels.premium} ${agencyMetrics.premiumCount}`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/revenue" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/20">Daromad paneli →</Link>
        <Link to="/agencies" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/20">Agentliklar →</Link>
        <Link to="/admin/ai" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/20">AI Markaz →</Link>
      </div>

      {aiInsights.insights.length > 0 && (
          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h3 className="text-sm font-semibold">AI bozor tahlillari</h3>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {aiInsights.insights.slice(0, 3).map((ins) => (
                <li key={ins.id}>• {ins.title}: {ins.description.slice(0, 80)}…</li>
              ))}
            </ul>
            <Link to="/admin/ai" className="mt-2 inline-block text-xs text-primary hover:underline">To'liq AI markaz →</Link>
          </div>
        )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold">Konversiya voronkasi</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {Object.entries(conversion.counts).map(([step, count]) => (
              <li key={step} className="flex justify-between">
                <span className="text-muted-foreground">{funnelStepLabels[step as keyof typeof funnelStepLabels] ?? step}</span>
                <span className="font-mono font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold">Bozor salomatligi</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <HealthRow label="Likvidlik" status={health.liquidityStatus} value={`${health.liquidity}%`} />
            <HealthRow label="Qaytish darajasi" status={health.retentionStatus} value={`${Math.max(health.clientRetention, health.freelancerRetention)}%`} />
            <HealthRow label="Sharhlar" status={health.reviewStatus} value={`${health.reviewRate}%`} />
            <HealthRow label="Faol e'lonlar" status={health.listingsStatus} value={String(health.activeListings)} />
            <HealthRow label="GMV" status={overview.gmv > 0 ? "healthy" : "critical"} value={overview.gmv > 0 ? "Faol" : "Kutilmoqda"} />
          </ul>
          <Link to="/admin/analytics" className="mt-4 inline-block text-sm text-primary hover:underline">To'liq analitika →</Link>
        </div>
      </div>
    </AdminShell>
  );
}

function HealthBadge({ label, status }: { label: string; status: "healthy" | "watch" | "critical" }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusColor(status)}`}>
      {statusEmoji(status)} {label}: {statusLabel(status)}
    </span>
  );
}

function HealthRow({ label, status, value }: { label: string; status: "healthy" | "watch" | "critical"; value: string }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-xs">{value}</span>
        {statusEmoji(status)}
      </span>
    </li>
  );
}

function FounderCard({ icon: Icon, label, value, sub }: { icon: typeof DollarSign; label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="size-4 text-primary" />
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display mt-1 text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
