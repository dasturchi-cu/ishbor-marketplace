import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Briefcase, DollarSign, Users, MessageSquare, RotateCcw } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { EmptyState } from "@/components/site/feedback";
import { GradientAvatar } from "@/components/site/avatar";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireRole } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { getFreelancerCrmData } from "@/lib/crm-store";
import { subscribeOrders } from "@/lib/orders-store";

export const Route = createFileRoute("/freelancers/manage")({
  beforeLoad: requireRole(["freelancer"]),
  head: () => ({ meta: [{ title: "Frilanser CRM — Ishbor" }] }),
  component: () => (
    <ProtectedGate roles={["freelancer"]}>
      <FreelancerCrmPage />
    </ProtectedGate>
  ),
});

function FreelancerCrmPage() {
  const { user } = useAuth();
  useSyncExternalStore(subscribeOrders, () => true, () => false);

  if (!user || user.userType !== "freelancer" || !user.username) {
    return (
      <WorkspaceShell title="Frilanser CRM">
        <EmptyState icon={Briefcase} title="Faqat frilanserlar uchun" description="Bu bo'lim frilanser hisobida mavjud." />
      </WorkspaceShell>
    );
  }

  const crm = getFreelancerCrmData(user.username);

  return (
    <WorkspaceShell
      eyebrow="Frilanser markazi"
      title="Mijozlar boshqaruvi"
      actions={
        <Link to="/projects" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Ish topish
        </Link>
      }
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={DollarSign} label="Jami daromad" value={`$${crm.totalEarned.toLocaleString()}`} />
        <StatCard icon={Users} label="Takror mijozlar" value={crm.repeatClients.length} />
        <StatCard icon={Briefcase} label="Jami mijozlar" value={crm.previousClients.length} />
      </div>

      <Section title="Eng ko'p to'lovchi mijozlar" empty={crm.topPaying.length === 0} emptyAction={<Link to="/projects" className="text-xs font-semibold text-primary hover:underline">Ish topish →</Link>}>
        {crm.topPaying.map((c) => (
          <ClientRow key={c.slug} c={c} />
        ))}
      </Section>

      <Section title="Takror mijozlar" empty={crm.repeatClients.length === 0} className="mt-8" emptyAction={<Link to="/messages" className="text-xs font-semibold text-primary hover:underline">Xabarlar →</Link>}>
        {crm.repeatClients.map((c) => (
          <ClientRow key={c.slug} c={c} showFollowUp />
        ))}
      </Section>

      {crm.followUps.length > 0 && (
        <Section title="Kuzatuv kerak (30+ kun)" empty={false} className="mt-8">
          {crm.followUps.map((c) => (
            <ClientRow key={c.slug} c={c} showFollowUp highlight />
          ))}
        </Section>
      )}

      <Section title="Avvalgi mijozlar" empty={crm.previousClients.length === 0} className="mt-8" emptyAction={<Link to="/applications" className="text-xs font-semibold text-primary hover:underline">Arizalar →</Link>}>
        {crm.previousClients.map((c) => (
          <ClientRow key={c.slug} c={c} />
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

function ClientRow({
  c,
  showFollowUp,
  highlight,
}: {
  c: ReturnType<typeof getFreelancerCrmData>["previousClients"][0];
  showFollowUp?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 ${highlight ? "border-warning/30 bg-warning/5" : "border-border bg-card"}`}>
      <GradientAvatar name={c.name} hue={c.hue} size={44} rounded="rounded-2xl" />
      <div className="min-w-0 flex-1">
        {c.slug.startsWith("c-") || c.slug.includes("-") ? (
          <Link to="/clients/$company" params={{ company: c.slug }} className="font-semibold hover:text-primary">
            {c.name}
          </Link>
        ) : (
          <span className="font-semibold">{c.name}</span>
        )}
        <p className="font-mono text-[10px] text-muted-foreground">
          {c.orderCount} buyurtma · ${c.totalPaid.toLocaleString()}
          {c.isRepeat && " · Takror mijoz"}
        </p>
      </div>
      <div className="flex gap-2">
        {showFollowUp && (
          <Link
            to="/messages"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium"
          >
            <MessageSquare className="size-3.5" /> Kuzatish
          </Link>
        )}
        <Link
          to="/messages"
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
        >
          <RotateCcw className="size-3.5" /> Bog'lanish
        </Link>
      </div>
    </div>
  );
}
