import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/shell";
import { AdminStatCard } from "@/components/admin/actions";
import { AdminLineChart, AdminBarChart } from "@/components/admin/charts";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsData, chartData } from "@/lib/admin-mock-data";
import { DollarSign, Percent, Users, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics Center — Ishbor Admin" }] }),
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const { onSearchOpen } = useAdminSearchOpen();

  return (
    <AdminShell eyebrow="Analytics Center" title="Analytics" onSearchOpen={onSearchOpen}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard label="GMV (30d)" value={`$${analyticsData.gmv.toLocaleString()}`} trend="+24%" trendUp icon={DollarSign} />
        <AdminStatCard label="Revenue" value={`$${analyticsData.revenue.toLocaleString()}`} trend="+18%" trendUp icon={TrendingUp} />
        <AdminStatCard label="Platform Fees" value={`$${analyticsData.platformFees.toLocaleString()}`} trend="+18%" trendUp icon={DollarSign} />
        <AdminStatCard label="Conversion Rate" value={`${analyticsData.conversionRate}%`} trend="+0.3%" trendUp icon={Percent} />
        <AdminStatCard label="Retention" value={`${analyticsData.retention}%`} trend="+2%" trendUp icon={Users} />
        <AdminStatCard label="Active Users" value={analyticsData.activeUsers.toLocaleString()} trend="+5%" trendUp icon={Users} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminLineChart title="Revenue Growth" data={chartData.revenue} formatValue={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <AdminLineChart title="User Growth" data={chartData.users} formatValue={(v) => `${(v / 1000).toFixed(1)}k`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Top Categories</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {analyticsData.topCategories.map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex justify-between text-xs"><span className="font-medium">{c.name}</span><span className="font-mono text-muted-foreground">${c.gmv.toLocaleString()}</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{ width: `${Math.min(100, c.orders / 10)}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Freelancers</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {analyticsData.topFreelancers.map((f) => (
              <div key={f.name} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <GradientAvatar name={f.name} hue={f.hue} size={32} />
                  <div><div className="text-sm font-medium">{f.name}</div><div className="text-xs text-muted-foreground">★ {f.rating} · {f.orders} orders</div></div>
                </div>
                <span className="font-mono text-sm">${f.earned.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <AdminBarChart
          title="Category GMV"
          data={analyticsData.topCategories.map((c) => ({ name: c.name.split(" ")[0], value: c.gmv }))}
        />
      </div>
    </AdminShell>
  );
}
