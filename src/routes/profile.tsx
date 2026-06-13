import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { Settings, ExternalLink, FolderOpen, ClipboardList, Lock, Wallet, BarChart3, Users, Sparkles, ShieldCheck, FileText } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { VerifiedIdentityBadge, LevelBadge, OrderStatusBadge } from "@/components/site/trust";
import { RoleSwitcher } from "@/components/site/role-switcher";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireAuth } from "@/lib/guards";
import type { AuthUser } from "@/lib/auth";
import {
  enrichFreelancer,
  freelancers,
  getClient,
  getClientProjects,
  getFreelancerReviews,
  getFreelancerServices,
  orders,
} from "@/lib/mock-data";
import type { EscrowWorkflow } from "@/lib/mock-data";
import { getMyProjects, subscribeProjects } from "@/lib/projects-store";
import { getAllEscrowWorkflows, subscribeEscrow } from "@/lib/escrow-store";
import { getWallet, subscribeWallet } from "@/lib/wallet-store";
import { getMyPortfolios, subscribePortfolios } from "@/lib/portfolio-store";
import { getAgenciesForUser, subscribeAgencies, hasAgencyPermission } from "@/lib/agency-store";
import { computeFreelancerReputation } from "@/lib/reputation-store";
import { ReputationBadge } from "@/components/reputation/reputation-badge";

export const Route = createFileRoute("/profile")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Mening profilim — Ishbor" }] }),
  component: () => (
    <ProtectedGate>
      <ProfilePage />
    </ProtectedGate>
  ),
});

const EMPTY_PROJECTS: ReturnType<typeof getMyProjects> = [];
const EMPTY_PORTFOLIOS: ReturnType<typeof getMyPortfolios> = [];

function resolveFreelancer(user: AuthUser) {
  if (user.username) {
    const match = freelancers.find((x) => x.username === user.username);
    if (match) return enrichFreelancer(match);
  }
  const fallback = enrichFreelancer(freelancers[0]!);
  return {
    ...fallback,
    name: user.fullName,
    hue: user.avatarHue,
    username: user.username ?? user.fullName.toLowerCase().replace(/\s+/g, "-").slice(0, 20),
    bio: user.bio ?? fallback.bio,
  };
}

function filterClientEscrow(user: AuthUser, workflows: EscrowWorkflow[]) {
  return workflows.filter(
    (e) => e.client === user.fullName || e.client === user.company || e.client === user.companySlug,
  );
}

function escrowHeldAmount(escrow: EscrowWorkflow) {
  return escrow.milestones
    .filter((m) => m.status === "funded")
    .reduce((sum, m) => sum + m.amount, 0);
}

function ProfilePage() {
  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  if (!user) return null;

  const settingsAction = (
    <Link
      to="/settings"
      className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium transition-default hover:border-primary/20"
    >
      <Settings className="size-4" /> Sozlamalar
    </Link>
  );

  if (activeRole === "freelancer") {
    return <FreelancerProfile user={user} actions={settingsAction} />;
  }

  return <ClientProfile user={user} actions={settingsAction} />;
}

function FreelancerProfile({ user, actions }: { user: AuthUser; actions: ReactNode }) {
  const f = resolveFreelancer(user);
  const userReviews = getFreelancerReviews(f.username);
  const userServices = getFreelancerServices(f.username);
  useSyncExternalStore(subscribeAgencies, () => user.id, () => "");
  const agencies = getAgenciesForUser(user.id);
  const agencyDashboard = agencies.find((a) => hasAgencyPermission(a, user.id, "view_dashboard"));
  const myPortfolios = useSyncExternalStore(
    subscribePortfolios,
    () => (user ? getMyPortfolios(user.id) : EMPTY_PORTFOLIOS),
    () => EMPTY_PORTFOLIOS,
  );

  return (
    <WorkspaceShell eyebrow="Frilanser profili" title={f.name} actions={actions}>
      <RoleSwitcher className="mb-6" />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 text-center transition-default hover:border-primary/20">
          <GradientAvatar name={f.name} hue={f.hue} size={80} rounded="rounded-2xl" className="mx-auto" />
          <h2 className="font-display mt-4 text-lg font-semibold">{f.name}</h2>
          <p className="text-sm text-muted-foreground">@{f.username}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            <LevelBadge level={f.level} />
            {f.identityVerified && <VerifiedIdentityBadge />}
          </div>
          <Link
            to="/freelancers/$username"
            params={{ username: f.username }}
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Ommaviy profilni ko'rish <ExternalLink className="size-3" />
          </Link>
        </div>
        <div className="space-y-6">
          <ProfileSection title="Haqida">
            <p className="text-sm leading-relaxed text-muted-foreground">{f.bio}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <StatTile label="Joylashuv" value={f.city} />
              <StatTile label="Stavka" value={`$${f.rate}/soat`} />
              <StatTile label="Topilgan" value={`$${f.earned.toLocaleString()}`} accent />
              <StatTile label="Ishlar" value={String(f.jobs)} />
            </div>
          </ProfileSection>
          <ProfileSection
            title={`Portfel (${myPortfolios.length})`}
            action={
              <Link to="/portfolio" className="text-xs font-medium text-primary transition-default hover:text-primary/80">
                Barchasini ko'rish
              </Link>
            }
          >
            <div className="space-y-2">
              {myPortfolios.length > 0 ? (
                myPortfolios.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    to="/portfolio/$slug"
                    params={{ slug: item.slug }}
                    className="block rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20 hover:bg-secondary/20"
                  >
                    {item.title} · {item.category}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Hali portfolio yo'q.{" "}
                  <Link to="/portfolio/create" className="font-medium text-primary hover:underline">
                    Birinchi ishni qo'shing
                  </Link>
                </p>
              )}
            </div>
          </ProfileSection>
          <ProfileSection title="Ko'nikmalar">
            <div className="flex flex-wrap gap-1.5">
              {f.skills.map((s) => (
                <span key={s} className="rounded-md bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {s}
                </span>
              ))}
            </div>
          </ProfileSection>
          <ProfileSection
            title="Analitika va CRM"
            action={
              <Link to="/analytics/freelancer" className="text-xs font-medium text-primary transition-default hover:text-primary/80">
                To'liq analitika
              </Link>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Link to="/analytics/freelancer" className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20 hover:bg-secondary/20">
                <BarChart3 className="size-4 text-primary" />
                <span>Frilanser analitikasi</span>
              </Link>
              <Link to="/freelancers/manage" className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20 hover:bg-secondary/20">
                <Users className="size-4 text-primary" />
                <span>Mijozlar CRM</span>
              </Link>
              <Link to="/applications" className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20 hover:bg-secondary/20">
                <FileText className="size-4 text-primary" />
                <span>Mening arizalarim</span>
              </Link>
              <Link to="/portfolio" className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20 hover:bg-secondary/20">
                <BarChart3 className="size-4 text-primary" />
                <span>Portfel analitikasi</span>
              </Link>
            </div>
          </ProfileSection>
          <ProfileSection
            title="AI vositalar"
            action={
              <Link to="/ai" className="text-xs font-medium text-primary transition-default hover:text-primary/80">
                AI markaz
              </Link>
            }
          >
            <div className="flex flex-wrap gap-2">
              <Link to="/ai/proposal-assistant" className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/25 hover:text-primary">
                Taklif yordamchisi
              </Link>
              <Link to="/ai/portfolio-optimizer" className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/25 hover:text-primary">
                Portfel optimizatsiyasi
              </Link>
              <Link to="/ai/trust-coach" className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/25 hover:text-primary">
                Ishonch murabbiyi
              </Link>
            </div>
          </ProfileSection>
          <ProfileSection title="Ishonch va reyting">
            <div className="flex flex-wrap items-center gap-3">
              <ReputationBadge tier={computeFreelancerReputation(f.username).tier} size="md" />
              <Link to="/settings" search={{ tab: "verification" }} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <ShieldCheck className="size-3" /> Shaxsni tasdiqlash
              </Link>
              <Link to="/ai/trust-coach" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Sparkles className="size-3" /> Ishonchni oshirish
              </Link>
            </div>
          </ProfileSection>
          {agencyDashboard && (
            <ProfileSection
              title="Agentlik"
              action={
                <Link to="/dashboard/agency" className="text-xs font-medium text-primary transition-default hover:text-primary/80">
                  Agentlik paneli
                </Link>
              }
            >
              <div className="flex flex-wrap gap-2">
                <Link to="/dashboard/agency" className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/25">
                  Boshqaruv paneli
                </Link>
                <Link to="/agency/clients" className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/25">
                  Mijozlar CRM
                </Link>
                <Link to="/agencies/$slug" params={{ slug: agencyDashboard.slug }} className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/25">
                  Ommaviy profil
                </Link>
              </div>
            </ProfileSection>
          )}
          <ProfileSection title={`Xizmatlar (${userServices.length})`}>
            <div className="space-y-2">
              {userServices.map((s) => (
                <Link
                  key={s.id}
                  to="/services/$slug"
                  params={{ slug: s.slug }}
                  className="block rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20 hover:bg-secondary/20"
                >
                  {s.title} · ${s.price}
                </Link>
              ))}
            </div>
          </ProfileSection>
          <ProfileSection
            title="Daromad"
            action={
              <Link to="/wallet" className="text-xs font-medium text-primary transition-default hover:text-primary/80">
                Hamyon
              </Link>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile label="Jami topilgan" value={`$${f.earned.toLocaleString()}`} accent />
              <StatTile label="Stavka" value={`$${f.rate}/soat`} />
            </div>
          </ProfileSection>
          <ProfileSection title={`Sharhlar (${userReviews.length})`}>
            <div className="space-y-3">
              {userReviews.slice(0, 3).map((r) => (
                <div key={r.id} className="rounded-lg border border-border bg-surface px-4 py-3 transition-default hover:border-primary/20">
                  <div className="text-sm font-medium">
                    {r.from} · {r.rating}★
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                </div>
              ))}
            </div>
          </ProfileSection>
        </div>
      </div>
    </WorkspaceShell>
  );
}

function ProfileSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card transition-default hover:border-primary/20">
      <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function StatTile({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-default hover:border-primary/20 ${
        accent ? "border-primary/20 bg-primary/5" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {Icon && <Icon className={`size-3 ${accent ? "text-primary" : ""}`} />}
        {label}
      </div>
      <div className="font-display mt-1.5 text-xl font-bold tracking-tight sm:text-2xl">{value}</div>
    </div>
  );
}

const EMPTY_ESCROWS: EscrowWorkflow[] = [];

function ClientProfile({ user, actions }: { user: AuthUser; actions: ReactNode }) {
  const clientSlug = user.companySlug ?? "asaka-capital";
  const client = getClient(clientSlug);
  const clientProjects = getClientProjects(clientSlug);

  useSyncExternalStore(subscribeAgencies, () => user.id, () => "");
  const agencies = getAgenciesForUser(user.id);
  const agencyDashboard = agencies.find((a) => hasAgencyPermission(a, user.id, "view_dashboard"));

  const myProjects = useSyncExternalStore(
    subscribeProjects,
    () => (user.id ? getMyProjects(user.id) : EMPTY_PROJECTS),
    () => EMPTY_PROJECTS,
  );
  const allEscrows = useSyncExternalStore(subscribeEscrow, getAllEscrowWorkflows, () => EMPTY_ESCROWS);
  const wallet = useSyncExternalStore(
    subscribeWallet,
    () => (user.id ? getWallet(user.id) : null),
    () => null,
  );

  const clientEscrows = useMemo(() => filterClientEscrow(user, allEscrows), [user, allEscrows]);
  const activeOrders = orders.filter((o) => o.status === "in_progress" || o.status === "review");
  const activeEscrows = clientEscrows.filter((e) => e.status !== "completed" && e.status !== "released");
  const totalEscrow = activeEscrows.reduce((sum, e) => sum + escrowHeldAmount(e), 0);
  const lifetimeSpent = wallet?.lifetimeEarned ?? 0;
  const availableBalance = wallet?.available ?? 0;
  const allProjects = myProjects.length > 0 ? myProjects : clientProjects;

  return (
    <WorkspaceShell eyebrow="Mijoz profili" title={user.fullName} actions={actions}>
      <RoleSwitcher className="mb-6" />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 transition-default hover:border-primary/20">
          <div className="text-center">
            <GradientAvatar name={user.fullName} hue={user.avatarHue} size={80} rounded="rounded-2xl" className="mx-auto" />
            <h2 className="font-display mt-4 text-lg font-semibold">{user.fullName}</h2>
            <p className="text-sm text-muted-foreground">{client?.name ?? user.company}</p>
            {user.verified && (
              <div className="mt-3 flex justify-center">
                <VerifiedIdentityBadge />
              </div>
            )}
          </div>
          {client && (
            <Link
              to="/clients/$company"
              params={{ company: client.slug }}
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Kompaniya profilini ko'rish <ExternalLink className="size-3" />
            </Link>
          )}
          <p className="mt-4 text-sm text-muted-foreground">{user.bio}</p>
        </div>
        <div className="space-y-6">
          <ProfileSection title="Kompaniya profili">
            {client ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <StatTile label="Kompaniya" value={client.name} />
                <StatTile label="Soha" value={client.industry} />
                <StatTile label="Joylashuv" value={client.location} />
                <StatTile label="Loyihalar" value={String(allProjects.length)} accent />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Kompaniya ma'lumotlari hali to'ldirilmagan.</p>
            )}
          </ProfileSection>
          <ProfileSection
            title="Analitika va CRM"
            action={
              <Link to="/analytics/client" className="text-xs font-medium text-primary transition-default hover:text-primary/80">
                To'liq analitika
              </Link>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Link to="/analytics/client" className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20 hover:bg-secondary/20">
                <BarChart3 className="size-4 text-primary" />
                <span>Mijoz analitikasi</span>
              </Link>
              <Link to="/clients/manage" className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20 hover:bg-secondary/20">
                <Users className="size-4 text-primary" />
                <span>Frilanserlar CRM</span>
              </Link>
              <Link to="/ai" className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20 hover:bg-secondary/20">
                <Sparkles className="size-4 text-primary" />
                <span>AI yordamchi</span>
              </Link>
              <Link to="/settings" search={{ tab: "verification" }} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20 hover:bg-secondary/20">
                <ShieldCheck className="size-4 text-primary" />
                <span>Shaxsni tasdiqlash</span>
              </Link>
            </div>
          </ProfileSection>
          {agencyDashboard && (
            <ProfileSection
              title="Agentlik"
              action={
                <Link to="/dashboard/agency" className="text-xs font-medium text-primary transition-default hover:text-primary/80">
                  Agentlik paneli
                </Link>
              }
            >
              <div className="flex flex-wrap gap-2">
                <Link to="/dashboard/agency" className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/25">
                  Boshqaruv paneli
                </Link>
                <Link to="/agency/clients" className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/25">
                  Mijozlar CRM
                </Link>
                <Link to="/agencies/$slug" params={{ slug: agencyDashboard.slug }} className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/25">
                  Ommaviy profil
                </Link>
              </div>
            </ProfileSection>
          )}
          <ProfileSection
            title={`Loyihalar (${allProjects.length})`}
            action={
              <Link to="/my-projects" className="text-xs font-medium text-primary transition-default hover:text-primary/80">
                Barchasini ko'rish
              </Link>
            }
          >
            <div className="space-y-2">
              {allProjects.slice(0, 4).map((project) => (
                <Link
                  key={project.id}
                  to="/projects/$slug"
                  params={{ slug: project.slug }}
                  className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20 hover:bg-secondary/20"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FolderOpen className="size-4" />
                  </div>
                  <span className="min-w-0 flex-1 truncate font-medium">{project.title}</span>
                  <span className="font-display shrink-0 font-semibold">${project.budget.toLocaleString()}</span>
                </Link>
              ))}
            </div>
          </ProfileSection>
          <ProfileSection
            title="Buyurtmalar"
            action={
              <Link to="/orders" className="text-xs font-medium text-primary transition-default hover:text-primary/80">
                Barchasini ko'rish
              </Link>
            }
          >
            <div className="space-y-2">
              {activeOrders.slice(0, 3).map((order) => (
                <Link
                  key={order.id}
                  to="/orders/$id"
                  params={{ id: order.id }}
                  className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-default hover:border-primary/20 hover:bg-secondary/20"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardList className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{order.title}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">${order.amount.toLocaleString()}</div>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </Link>
              ))}
            </div>
          </ProfileSection>
          <ProfileSection
            title="Eskrou"
            action={
              <Link to="/escrow" className="text-xs font-medium text-primary transition-default hover:text-primary/80">
                Barchasini ko'rish
              </Link>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile label="Eskrouda" value={`$${totalEscrow.toLocaleString()}`} accent icon={Lock} />
              <StatTile label="Faol eskroular" value={String(activeEscrows.length)} />
            </div>
            <div className="mt-3 space-y-2">
              {activeEscrows.slice(0, 3).map((escrow) => (
                <Link
                  key={escrow.id}
                  to="/escrow/$id"
                  params={{ id: escrow.id }}
                  className="block rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20 hover:bg-secondary/20"
                >
                  {escrow.project} · ${escrowHeldAmount(escrow).toLocaleString()}
                </Link>
              ))}
            </div>
          </ProfileSection>
          <ProfileSection
            title="Xarajatlar"
            action={
              <Link to="/wallet" className="text-xs font-medium text-primary transition-default hover:text-primary/80">
                Hamyon
              </Link>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile label="Mavjud balans" value={`$${availableBalance.toLocaleString()}`} icon={Wallet} />
              <StatTile label="Jami sarflangan" value={`$${lifetimeSpent.toLocaleString()}`} />
            </div>
          </ProfileSection>
        </div>
      </div>
    </WorkspaceShell>
  );
}
