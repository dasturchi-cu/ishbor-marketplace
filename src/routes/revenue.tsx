import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { DollarSign, TrendingUp, CreditCard, Sparkles, Users, Flame } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { AdminLineChart } from "@/components/admin/charts";
import { useAdminSearchOpen } from "@/components/admin/search";
import { AdminProvider } from "@/components/admin/admin-context";
import { AdminSearchProvider } from "@/components/admin/search-context";
import { AdminOnlyGate } from "@/components/admin/admin-only-gate";
import { requireAdmin } from "@/lib/guards";
import { getMonetizationOverview, getMonetizationHealth, getTopEarningCategories } from "@/lib/monetization-store";
import { subscribeRevenue } from "@/lib/revenue-store";
import { subscribeSubscriptions, PLANS } from "@/lib/subscription-store";
import { subscribeCredits } from "@/lib/credits-store";
import { getMonthlyBuckets } from "@/lib/analytics-events-store";
import { useStoreVersion } from "@/hooks/use-store-version";
import { STORE_KEYS } from "@/lib/store-version";

export const Route = createFileRoute("/revenue")({
  beforeLoad: requireAdmin,
  head: () => ({ meta: [{ title: "Daromad paneli — Ishbor Admin" }] }),
  component: RevenueDashboardPage,
});

function healthColor(h: "healthy" | "watch" | "critical") {
  if (h === "healthy") return "text-success border-success/30 bg-success/10";
  if (h === "watch") return "text-warning border-warning/30 bg-warning/10";
  return "text-destructive border-destructive/30 bg-destructive/10";
}

function healthEmoji(h: "healthy" | "watch" | "critical") {
  return h === "healthy" ? "🟢" : h === "watch" ? "🟡" : "🔴";
}

function RevenueDashboardPage() {
  return (
    <AdminOnlyGate>
      <AdminProvider>
        <AdminSearchProvider>
          <RevenueDashboardContent />
        </AdminSearchProvider>
      </AdminProvider>
    </AdminOnlyGate>
  );
}

function RevenueDashboardContent() {
  const { onSearchOpen } = useAdminSearchOpen();
  const [days, setDays] = useState<30 | 90>(30);

  useStoreVersion(STORE_KEYS.revenue, subscribeRevenue);
  useStoreVersion(STORE_KEYS.subscriptions, subscribeSubscriptions);
  useStoreVersion(STORE_KEYS.credits, subscribeCredits);

  const m = getMonetizationOverview(days);
  const health = getMonetizationHealth();
  const topCategories = getTopEarningCategories(5);
  const revenueChart = getMonthlyBuckets(["subscription_purchase", "credit_purchase", "featured_purchase"], 6, true);

  return (
    <AdminShell
      eyebrow="Monetizatsiya"
      title="Daromad paneli"
      onSearchOpen={onSearchOpen}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${healthColor(health)}`}>
          {healthEmoji(health)} Monetizatsiya: {health === "healthy" ? "Sog'lom" : health === "watch" ? "Kuzatish" : "Kritik"}
        </span>
        <div className="flex gap-2">
          {([30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${days === d ? "bg-primary text-primary-foreground" : "border border-border"}`}
            >
              {d} kun
            </button>
          ))}
        </div>
        <Link to="/admin/founder" className="text-xs text-primary hover:underline">Asoschilar paneli →</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={DollarSign} label="Jami daromad" value={`${m.totalRevenue.toLocaleString()} UZS`} health={m.totalRevenue > 0 ? "healthy" : "critical"} />
        <MetricCard icon={TrendingUp} label="Oylik takrorlanuvchi daromad" value={`${m.mrr.toLocaleString()} UZS`} health={m.mrr > 0 ? "healthy" : "watch"} />
        <MetricCard icon={Users} label="Foydalanuvchi daromadi" value={`${m.arpu.toLocaleString()} UZS`} health={m.arpu > 0 ? "healthy" : "watch"} />
        <MetricCard icon={Flame} label="Daromad o'sishi" value={`${m.revenueGrowth}%`} health={m.revenueGrowth > 0 ? "healthy" : "watch"} />
        <MetricCard icon={CreditCard} label="Obuna daromadi" value={`${m.subscriptionRevenue.toLocaleString()} UZS`} health={m.subscriptionRevenue > 0 ? "healthy" : "watch"} />
        <MetricCard icon={CreditCard} label="Kredit sotuvlari" value={`${m.creditRevenue.toLocaleString()} UZS`} health={m.creditRevenue > 0 ? "healthy" : "watch"} />
        <MetricCard icon={Sparkles} label="Ajratilgan ro'yxat daromadi" value={`${m.featuredRevenue.toLocaleString()} UZS`} health={m.featuredRevenue > 0 ? "healthy" : "watch"} />
        <MetricCard icon={Flame} label="Kredit sarfi" value={`${m.creditBurnRate.toLocaleString()} UZS`} health="watch" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminLineChart title="Daromad o'sishi" data={revenueChart} formatValue={(v) => `${v.toLocaleString()} UZS`} />

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold">Obuna aralashmasi</h3>
          <ul className="mt-4 space-y-3">
            {(["free", "pro", "elite"] as const).map((id) => (
              <li key={id} className="flex items-center justify-between text-sm">
                <span>{PLANS[id].name}</span>
                <span className="font-mono font-medium">{m.subscriptionMix[id]} foydalanuvchi</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-xs text-muted-foreground">
            Faol ajratilgan: {m.featuredActive} · Jami kredit balansi: {m.totalCreditBalance.toLocaleString()} UZS
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h3 className="font-display font-semibold">Top daromad kategoriyalari</h3>
        {topCategories.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Hali ma'lumot yo'q — birinchi obuna yoki ajratilgan ro'yxat xaridini kuting.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {topCategories.map((c) => (
              <li key={c.category} className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">{c.category}</span>
                <span className="font-mono font-medium">{c.revenue.toLocaleString()} UZS</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  health,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  health: "healthy" | "watch" | "critical";
}) {
  return (
    <div className={`rounded-xl border p-4 ${healthColor(health)}`}>
      <div className="flex items-center justify-between">
        <Icon className="size-4 opacity-70" />
        <span className="text-sm">{healthEmoji(health)}</span>
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest opacity-70">{label}</div>
      <div className="font-display mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
