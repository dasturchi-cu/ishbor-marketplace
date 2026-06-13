import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users, UserCheck, Briefcase, Building2, FolderOpen, ClipboardList,
  Lock, DollarSign, ArrowDownToLine, AlertTriangle, ShieldCheck, Activity,
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
  head: () => ({ meta: [{ title: "Admin Dashboard — Ishbor" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { onSearchOpen } = useAdminSearchOpen();

  return (
    <AdminShell eyebrow="Enterprise Admin OS" title="Dashboard" onSearchOpen={onSearchOpen}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AdminStatCard label="Total Users" value={adminStats.totalUsers.toLocaleString()} trend="+8%" trendUp icon={Users} />
        <AdminStatCard label="Active Users" value={adminStats.activeUsers.toLocaleString()} trend="+5%" trendUp icon={UserCheck} />
        <AdminStatCard label="Freelancers" value={adminStats.freelancers.toLocaleString()} trend="+6%" trendUp icon={Briefcase} />
        <AdminStatCard label="Clients" value={adminStats.clients.toLocaleString()} trend="+4%" trendUp icon={Building2} />
        <AdminStatCard label="Open Projects" value={adminStats.openProjects.toLocaleString()} trend="+12%" trendUp icon={FolderOpen} />
        <AdminStatCard label="Active Orders" value={adminStats.activeOrders.toLocaleString()} trend="+9%" trendUp icon={ClipboardList} />
        <AdminStatCard label="Escrow Volume" value={`$${(adminStats.escrowVolume / 1e6).toFixed(2)}M`} trend="+18%" trendUp icon={Lock} />
        <AdminStatCard label="Revenue (30d)" value={`$${adminStats.revenue.toLocaleString()}`} trend="+24%" trendUp icon={DollarSign} />
        <AdminStatCard label="Withdrawals" value={`$${adminStats.withdrawals.toLocaleString()}`} trend="-3%" trendUp={false} icon={ArrowDownToLine} />
        <AdminStatCard label="Disputes" value={String(adminStats.disputes)} trend="-2" trendUp={false} icon={AlertTriangle} />
        <AdminStatCard label="Verification Requests" value={String(adminStats.verificationRequests)} trend="+4" trendUp icon={ShieldCheck} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminLineChart title="Revenue Growth" data={chartData.revenue} formatValue={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <AdminLineChart title="User Growth" data={chartData.users} formatValue={(v) => `${(v / 1000).toFixed(1)}k`} />
        <AdminLineChart title="Order Growth" data={chartData.orders} />
        <AdminLineChart title="Escrow Growth ($M)" data={chartData.escrow} formatValue={(v) => `$${v}M`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-primary" /> Real-time Activity
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/audit">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ActivityFeed events={activityFeed} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              { to: "/admin/verifications", label: "Review verifications", count: adminStats.verificationRequests },
              { to: "/admin/disputes", label: "Open disputes", count: adminStats.disputes },
              { to: "/admin/payments", label: "Pending withdrawals", count: 3 },
              { to: "/admin/support", label: "Open tickets", count: 3 },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20 hover:bg-secondary/30"
              >
                <span className="font-medium">{a.label}</span>
                <span className="font-mono rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">{a.count}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
