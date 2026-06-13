import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/shell";
import { HealthIndicator } from "@/components/admin/activity-feed";
import { useAdminSearchOpen } from "@/components/admin/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { systemHealth } from "@/lib/admin-mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/system")({
  head: () => ({ meta: [{ title: "System Health — Ishbor Admin" }] }),
  component: AdminSystemPage,
});

const STATUS_LABELS = {
  healthy: { label: "Healthy", color: "text-success" },
  degraded: { label: "Degraded", color: "text-warning" },
  down: { label: "Down", color: "text-destructive" },
};

function AdminSystemPage() {
  const { onSearchOpen } = useAdminSearchOpen();

  return (
    <AdminShell eyebrow="System Health" title="System Status" onSearchOpen={onSearchOpen}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {systemHealth.map((s) => (
          <Card key={s.name}>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{s.name}</CardTitle>
              <HealthIndicator status={s.status} />
            </CardHeader>
            <CardContent>
              <div className={cn("font-display text-lg font-bold", STATUS_LABELS[s.status].color)}>
                {STATUS_LABELS[s.status].label}
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                {s.latency && <span>Latency: {s.latency}</span>}
                {s.uptime && <span>Uptime: {s.uptime}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader><CardTitle className="text-base">Overall Platform Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <HealthIndicator status="healthy" />
            <div>
              <div className="font-display text-xl font-bold text-success">All systems operational</div>
              <p className="text-sm text-muted-foreground">Email delivery is experiencing minor delays. All critical paths are healthy.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
