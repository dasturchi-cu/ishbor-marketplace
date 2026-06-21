import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/shell";
import { AdminStatCard } from "@/components/admin/actions";
import { AdminLineChart, AdminBarChart } from "@/components/admin/charts";
import { useAdminSearchOpen } from "@/components/admin/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getMarketplaceOverview,
  getTopFreelancersByRevenue,
  getTopClientsBySpend,
  getTopServicesByOrders,
  subscribeRevenue,
  getOrdersGrowthBuckets,
} from "@/lib/revenue-store";
import { getMonetizationOverview, getTopEarningCategories } from "@/lib/monetization-store";
import { getMonthlyBuckets, subscribeAnalyticsEvents } from "@/lib/analytics-events-store";
import { subscribeSubscriptions } from "@/lib/subscription-store";
import { subscribeCredits } from "@/lib/credits-store";
import { DollarSign, Percent, Users, TrendingUp, Package, Briefcase } from "lucide-react";
import { getAllServices } from "@/lib/services-store";
import { getStoredProjects } from "@/lib/projects-store";
import { useStoreVersion } from "@/hooks/use-store-version";
import { STORE_KEYS } from "@/lib/store-version";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analitika markazi — Ishbor Admin" }] }),
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  useStoreVersion(STORE_KEYS.revenue, subscribeRevenue);
  useStoreVersion(STORE_KEYS.analyticsEvents, subscribeAnalyticsEvents);
  useStoreVersion(STORE_KEYS.subscriptions, subscribeSubscriptions);
  useStoreVersion(STORE_KEYS.credits, subscribeCredits);
  const overview = getMarketplaceOverview(30);
  const monetization = getMonetizationOverview(30);
  const topCategories = getTopEarningCategories(5);
  const topFreelancers = getTopFreelancersByRevenue(5);
  const topClients = getTopClientsBySpend(5);
  const topServices = getTopServicesByOrders(5);
  const revenueChart = getMonthlyBuckets(["order_completed", "featured_purchase"], 6, true);
  const ordersChart = getOrdersGrowthBuckets(30);
  const gmvTrend = overview.gmv > 0 ? "+stored" : "0";

  return (
    <AdminShell eyebrow="Analitika markazi" title="Marketplace analitikasi" onSearchOpen={onSearchOpen}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard label="GMV (30 kun)" value={`$${overview.gmv.toLocaleString()}`} trend={gmvTrend} trendUp={overview.gmv > 0} icon={DollarSign} />
        <AdminStatCard label="Platforma daromadi" value={`$${overview.revenue.toLocaleString()}`} trend="5% komissiya" trendUp={overview.revenue > 0} icon={TrendingUp} />
        <AdminStatCard label="Eskrou hajmi" value={`$${overview.escrowVolume.toLocaleString()}`} trend={`${overview.completedOrders} yakunlangan`} trendUp icon={DollarSign} />
        <AdminStatCard label="Buyurtmalar" value={overview.totalOrders.toString()} trend={`${overview.completedOrders} yakunlangan`} trendUp icon={Package} />
        <AdminStatCard label="Faol frilanserlar" value={overview.activeFreelancers.toString()} trend={`${overview.totalServices} xizmat`} trendUp icon={Users} />
        <AdminStatCard label="Faol mijozlar" value={overview.activeClients.toString()} trend={`${overview.totalProjects} loyiha`} trendUp icon={Briefcase} />
        <AdminStatCard label="Ajratilgan xaridlar" value={overview.featuredPurchases.toString()} trend="Referral kredit" trendUp icon={Percent} />
        <AdminStatCard label="Takliflar" value={overview.totalProposals.toString()} trend="Stored" trendUp icon={Briefcase} />
        <AdminStatCard label="Obuna daromadi" value={`${monetization.subscriptionRevenue.toLocaleString()} UZS`} trend={`MRR ${monetization.mrr.toLocaleString()}`} trendUp={monetization.mrr > 0} icon={DollarSign} />
        <AdminStatCard label="Kredit sotuvlari" value={`${monetization.creditRevenue.toLocaleString()} UZS`} trend={`Burn ${monetization.creditBurnRate.toLocaleString()}`} trendUp={monetization.creditRevenue > 0} icon={TrendingUp} />
        <AdminStatCard label="Ajratilgan daromadi" value={`${monetization.featuredRevenue.toLocaleString()} UZS`} trend={`${monetization.featuredActive} faol`} trendUp={monetization.featuredRevenue > 0} icon={Percent} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminLineChart title="Daromad o'sishi (stored events)" data={revenueChart} formatValue={(v) => `$${v.toLocaleString()}`} />
        <AdminLineChart title="Buyurtmalar o'sishi" data={ordersChart} formatValue={(v) => `${v}`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Top frilanserlar</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {topFreelancers.length === 0 ? <p className="text-sm text-muted-foreground">Hali ma'lumot yo'q</p> : topFreelancers.map((f) => (
              <div key={f.username} className="flex justify-between py-2 text-sm">
                <span>@{f.username}</span>
                <span className="font-mono">${f.earned.toLocaleString()} · {f.orders} buyurtma</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top mijozlar</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {topClients.length === 0 ? <p className="text-sm text-muted-foreground">Hali ma'lumot yo'q</p> : topClients.map((c) => (
              <div key={c.client} className="flex justify-between py-2 text-sm">
                <span>{c.client}</span>
                <span className="font-mono">${c.spent.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top xizmatlar</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {topServices.length === 0 ? <p className="text-sm text-muted-foreground">Hali buyurtma yo'q</p> : topServices.map((s) => {
              const svc = getAllServices().find((x) => x.slug === s.slug);
              return (
                <div key={s.slug} className="flex justify-between py-2 text-sm">
                  <span className="truncate">{svc?.title ?? s.slug}</span>
                  <span className="font-mono">{s.orders} buyurtma</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <AdminBarChart title="Loyiha va xizmatlar" data={[
          { name: "Loyihalar", value: getStoredProjects().filter((p) => p.status === "published").length },
          { name: "Xizmatlar", value: getAllServices().filter((s) => s.status === "published").length },
          { name: "Buyurtmalar", value: overview.totalOrders },
        ]} />
      </div>
    </AdminShell>
  );
}
