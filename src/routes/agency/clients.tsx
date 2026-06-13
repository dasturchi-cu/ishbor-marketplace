import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { Users, DollarSign, RotateCcw, Building2 } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { EmptyState } from "@/components/site/feedback";
import { GradientAvatar } from "@/components/site/avatar";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireAuth } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { getAgenciesForUser, subscribeAgencies, hasAgencyPermission } from "@/lib/agency-store";
import { getAgencyCrmClients, computeAgencyMetrics } from "@/lib/agency-metrics-store";
import { subscribeOrders } from "@/lib/orders-store";

export const Route = createFileRoute("/agency/clients")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Agentlik CRM — Ishbor" }] }),
  component: () => (
    <ProtectedGate agency>
      <AgencyClientsPage />
    </ProtectedGate>
  ),
});

function AgencyClientsPage() {
  const { user } = useAuth();
  useSyncExternalStore(subscribeAgencies, () => true, () => false);
  useSyncExternalStore(subscribeOrders, () => true, () => false);

  if (!user) return null;

  const agencies = getAgenciesForUser(user.id);
  const agency = agencies.find((a) => hasAgencyPermission(a, user.id, "view_crm"));

  if (!agency) {
    return (
      <WorkspaceShell title="Agentlik CRM">
        <EmptyState
          icon={Building2}
          title="CRM ruxsati yo'q"
          description="Agentlik egasi yoki menejer bo'ling, yoki agentlik yarating."
          action={
            <Link to="/agencies/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Agentlik yaratish
            </Link>
          }
        />
      </WorkspaceShell>
    );
  }

  const clients = getAgencyCrmClients(agency);
  const metrics = computeAgencyMetrics(agency);
  const totalRevenue = clients.reduce((s, c) => s + c.totalPaid, 0);
  const repeatRate = clients.length > 0
    ? Math.round((clients.filter((c) => c.isRepeat).length / clients.length) * 100)
    : 0;

  return (
    <WorkspaceShell
      eyebrow={agency.name}
      title="Mijozlar CRM"
      actions={
        <Link to="/dashboard/agency" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium">
          Agentlik paneli
        </Link>
      }
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Jami mijozlar" value={clients.length} />
        <StatCard icon={DollarSign} label="Jami daromad" value={`$${totalRevenue.toLocaleString()}`} />
        <StatCard icon={RotateCcw} label="Takror buyurtma" value={`${repeatRate}%`} />
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Mijozlar hali yo'q"
          description="Jamoa a'zolari buyurtma olganda mijozlar shu yerda ko'rinadi."
          compact
        />
      ) : (
        <>
          <section className="mb-8">
            <h2 className="font-display text-lg font-semibold">Top mijozlar</h2>
            <div className="mt-4 space-y-2">
              {clients.slice(0, 5).map((c) => (
                <ClientRow key={c.name} client={c} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">Barcha mijozlar</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-left">
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Mijoz</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Buyurtmalar</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">To'langan</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Takror</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.map((c) => (
                    <tr key={c.name}>
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 font-mono">{c.orderCount}</td>
                      <td className="px-4 py-3 font-mono">${c.totalPaid.toLocaleString()}</td>
                      <td className="px-4 py-3">{c.isRepeat ? "Ha" : "Yo'q"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="mt-4 text-xs text-muted-foreground">
            Agentlik konversiyasi: {metrics.conversionRate}% · Takror mijoz: {metrics.repeatClientRate}%
          </p>
        </>
      )}
    </WorkspaceShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="size-4 text-primary" />
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function ClientRow({ client }: { client: { name: string; hue: number; totalPaid: number; orderCount: number; isRepeat: boolean } }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <GradientAvatar name={client.name} hue={client.hue} size={40} />
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{client.name}</div>
        <div className="text-xs text-muted-foreground">{client.orderCount} buyurtma · ${client.totalPaid.toLocaleString()}</div>
      </div>
      {client.isRepeat && (
        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">Takror</span>
      )}
    </div>
  );
}
