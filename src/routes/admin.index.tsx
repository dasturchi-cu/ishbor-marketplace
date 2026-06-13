import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users, ShieldCheck, ClipboardList,
  Lock, DollarSign, AlertTriangle, Activity,
} from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { AdminStatCard } from "@/components/admin/actions";
import { AdminLineChart } from "@/components/admin/charts";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminStats, activityFeed, chartData } from "@/lib/admin-mock-data";
import { useAdminSearchOpen } from "@/components/admin/search";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Boshqaruv paneli — Ishbor" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { onSearchOpen } = useAdminSearchOpen();

  return (
    <AdminShell eyebrow="Korporativ Admin OS" title="Boshqaruv paneli" onSearchOpen={onSearchOpen}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard label="Jami foydalanuvchilar" value={adminStats.totalUsers.toLocaleString()} trend="+8%" trendUp icon={Users} />
        <AdminStatCard label="Faol buyurtmalar" value={adminStats.activeOrders.toLocaleString()} trend="+9%" trendUp icon={ClipboardList} />
        <AdminStatCard label="Eskrou hajmi" value={`$${(adminStats.escrowVolume / 1e6).toFixed(2)}M`} trend="+18%" trendUp icon={Lock} />
        <AdminStatCard label="Daromad (30 kun)" value={`$${adminStats.revenue.toLocaleString()}`} trend="+24%" trendUp icon={DollarSign} />
        <AdminStatCard label="Nizolar" value={String(adminStats.disputes)} trend="-2" trendUp={false} icon={AlertTriangle} />
        <AdminStatCard label="Tasdiqlash so'rovlari" value={String(adminStats.verificationRequests)} trend="+4" trendUp icon={ShieldCheck} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminLineChart title="Daromad o'sishi" data={chartData.revenue} formatValue={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <AdminLineChart title="Buyurtma o'sishi" data={chartData.orders} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-primary" /> Jonli faollik
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/audit">Hammasini ko'rish</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ActivityFeed events={activityFeed} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tezkor harakatlar</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              { to: "/admin/verifications", label: "Tasdiqlashlarni ko'rib chiqish", count: adminStats.verificationRequests },
              { to: "/admin/disputes", label: "Ochiq nizolar", count: adminStats.disputes },
              { to: "/admin/payments", label: "Kutilayotgan yechib olishlar", count: 3 },
              { to: "/admin/support", label: "Ochiq chiptalar", count: 3 },
              { to: "/admin/ai", label: "AI Markaz", count: 0 },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20 hover:bg-secondary/30"
              >
                <span className="font-medium">{a.label}</span>
                {a.count > 0 && (
                  <span className="font-mono rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">{a.count}</span>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
