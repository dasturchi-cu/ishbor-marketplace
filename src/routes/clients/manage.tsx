import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Users, Star, DollarSign, UserPlus, RotateCcw } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { EmptyState } from "@/components/site/feedback";
import { GradientAvatar } from "@/components/site/avatar";
import { ReputationBadge } from "@/components/reputation/reputation-badge";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireRole } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { getClientCrmData } from "@/lib/crm-store";
import { computeFreelancerReputation } from "@/lib/reputation-store";
import { subscribeOrders } from "@/lib/orders-store";
import { subscribeSaved } from "@/lib/saved-store";
import { ClientCheckoutLink } from "@/components/checkout/client-checkout-link";
import { messagesPath } from "@/lib/messages-routing";

export const Route = createFileRoute("/clients/manage")({
  beforeLoad: requireRole(["client"]),
  head: () => ({ meta: [{ title: "Mijozlar CRM — Ishbor" }] }),
  component: () => (
    <ProtectedGate roles={["client"]}>
      <ClientCrmPage />
    </ProtectedGate>
  ),
});

function ClientCrmPage() {
  const { user } = useAuth();
  useSyncExternalStore(subscribeOrders, () => true, () => false);
  useSyncExternalStore(subscribeSaved, () => true, () => false);

  if (!user) return null;

  const crm = getClientCrmData(user.id, user.companySlug, user.company ?? user.fullName);

  return (
    <WorkspaceShell
      eyebrow="Mijozlar markazi"
      title="Frilanserlar boshqaruvi"
      actions={
        <Link to="/freelancers" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Frilanser topish
        </Link>
      }
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Jami yollashlar" value={crm.totalHires} />
        <StatCard icon={DollarSign} label="Jami sarflangan" value={`$${crm.totalSpend.toLocaleString()}`} />
        <StatCard icon={Star} label="Saqlanganlar" value={crm.savedFreelancers.length} />
      </div>

      <Section title="Eng yaxshi frilanserlar" empty={crm.topFreelancers.length === 0} emptyAction={<Link to="/freelancers" className="text-xs font-semibold text-primary hover:underline">Frilanser topish →</Link>}>
        {crm.topFreelancers.map((f) => (
          <FreelancerRow key={f.username} f={f} />
        ))}
      </Section>

      <Section title="Avval yollanganlar" empty={crm.previouslyHired.length === 0} className="mt-8" emptyAction={<Link to="/projects/create" className="text-xs font-semibold text-primary hover:underline">Yangi loyiha joylash →</Link>}>
        {crm.previouslyHired.map((f) => (
          <FreelancerRow key={f.username} f={f} showHireAgain />
        ))}
      </Section>

      <Section title="Saqlangan frilanserlar" empty={crm.savedFreelancers.length === 0} className="mt-8" emptyAction={<Link to="/freelancers" className="text-xs font-semibold text-primary hover:underline">Frilanserlar katalogi →</Link>}>
        {crm.savedFreelancers.map((f) => (
          <FreelancerRow key={f.username} f={f} showInvite />
        ))}
      </Section>
    </WorkspaceShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <Icon className="size-4 text-primary" />
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
  empty,
  className = "",
  emptyAction,
}: {
  title: string;
  children: ReactNode;
  empty: boolean;
  className?: string;
  emptyAction?: ReactNode;
}) {
  return (
    <section className={className}>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {empty ? (
        <div className="mt-3 rounded-xl border border-dashed border-border bg-surface/40 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">Hali ma'lumot yo'q.</p>
          {emptyAction && <div className="mt-3">{emptyAction}</div>}
        </div>
      ) : (
        <div className="mt-4 space-y-3">{children}</div>
      )}
    </section>
  );
}

function FreelancerRow({
  f,
  showHireAgain,
  showInvite,
}: {
  f: ReturnType<typeof getClientCrmData>["topFreelancers"][0];
  showHireAgain?: boolean;
  showInvite?: boolean;
}) {
  const rep = computeFreelancerReputation(f.username);
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
      <GradientAvatar name={f.name} hue={f.hue} size={44} />
      <div className="min-w-0 flex-1">
        <Link to="/freelancers/$username" params={{ username: f.username }} className="font-semibold hover:text-primary">
          {f.name}
        </Link>
        <p className="text-xs text-muted-foreground">{f.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <ReputationBadge tier={rep.tier} />
          {f.hireCount > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {f.hireCount} yollash · ${f.totalSpent.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {showHireAgain && (
          <ClientCheckoutLink
            search={{ type: "hire", freelancer: f.username }}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
          >
            <RotateCcw className="size-3.5" /> Qayta yollash
          </ClientCheckoutLink>
        )}
        {showInvite && (
          <Link
            {...messagesPath()}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium"
          >
            <UserPlus className="size-3.5" /> Taklif
          </Link>
        )}
        <ClientCheckoutLink
          search={{ type: "hire", freelancer: f.username }}
          className="inline-flex items-center gap-1 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary"
        >
          Yollash
        </ClientCheckoutLink>
      </div>
    </div>
  );
}
