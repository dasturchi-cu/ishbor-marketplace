/** Client analytics route — moved from analytics.client.tsx (TanStack `.client.*` conflict). */
import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useSyncExternalStore } from "react";
import type { LucideIcon } from "lucide-react";
import { Briefcase, DollarSign, Users, FolderOpen, Shield } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { EmptyState } from "@/components/site/feedback";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireRole } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { getClientAnalytics, getClientChartData, getClientSpendChart } from "@/lib/analytics-utils";
import { subscribeAnalyticsEvents, getAllAnalyticsEvents } from "@/lib/analytics-events-store";

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
  const activityChart = getClientChartData(user.id, range);
  const spendChart = getClientSpendChart(user);
  const maxActivity = Math.max(...activityChart.map((d) => d.value), 1);
  const maxSpend = Math.max(...spendChart.map((d) => d.value), 1);

  return (
    <WorkspaceShell
      eyebrow="Analitika markazi"
      title="Mijoz analitikasi"
      actions={
        <div className="flex flex-wrap gap-2">
          {([7, 30, 90] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRange(r)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${range === r ? "bg-primary text-primary-foreground" : "border border-border"}`}>
              {r} kun
            </button>
          ))}
          <Link to="/projects/create" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Loyiha joylash</Link>
        </div>
      }
    >
      {analytics.projectsCreated === 0 && analytics.totalSpend === 0 ? (
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
      <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={FolderOpen} label="Yaratilgan loyihalar" value={analytics.projectsCreated} />
        <MetricCard icon={Briefcase} label="Olingan takliflar" value={analytics.proposalsReceived} />
        <MetricCard icon={Users} label="Yollangan frilanserlar" value={analytics.freelancersHired} />
        <MetricCard icon={DollarSign} label="Jami xarajat" value={`$${analytics.totalSpend.toLocaleString()}`} />
        <MetricCard icon={Shield} label="Eskrou moliyalashtirilgan" value={`$${analytics.escrowFunded.toLocaleString()}`} />
        <MetricCard icon={Briefcase} label="Buyurtmalar" value={analytics.ordersCreated} />
        <MetricCard icon={Users} label="Takroriy frilanser" value={`${analytics.repeatFreelancerRate}%`} />
        <MetricCard icon={Shield} label="Ishonch darajasi" value={`${analytics.trustScore}%`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold">Yollash faolligi</h3>
          <div className="mt-4 overflow-x-auto">
          <div className="flex h-36 min-w-[480px] items-end gap-1">
            {activityChart.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-primary/80" style={{ height: `${Math.max(4, (d.value / maxActivity) * 120)}px` }} />
                <span className="font-mono text-[8px] text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold">Xarajat dinamikasi</h3>
          <div className="mt-4 overflow-x-auto">
          <div className="flex h-36 min-w-[320px] items-end gap-2">
            {spendChart.map((d) => (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-[9px]">${d.value}</span>
                <div className="w-full rounded-t bg-primary" style={{ height: `${Math.max(4, (d.value / maxSpend) * 100)}px` }} />
                <span className="font-mono text-[8px] text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>
      </>
      )}
    </WorkspaceShell>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="size-4 text-primary" />
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
