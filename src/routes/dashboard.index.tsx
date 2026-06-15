import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { useSyncExternalStore, useMemo, useEffect } from "react";

import { Clock, Plus, Shield, TrendingUp, Lock, FolderOpen, Users, Heart, ClipboardList } from "lucide-react";

import { WorkspaceShell } from "@/components/site/workspace-shell";
import { syncSmartNotifications } from "@/lib/ai-smart-notifications";

import { GradientAvatar } from "@/components/site/avatar";

import { EscrowShield, OrderStatusBadge, EscrowFundedBadge } from "@/components/site/trust";

import { PipelineEmpty, EmptyState } from "@/components/site/feedback";

import { hiringPipeline, messages } from "@/lib/mock-data";
import type { EscrowWorkflow, Order, HiringLead } from "@/lib/mock-data";
import type { AuthUser } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import { getMyProjects, subscribeProjects } from "@/lib/projects-store";
import { getSaved, subscribeSaved, EMPTY_SAVED } from "@/lib/saved-store";
import { getAllEscrowWorkflows, subscribeEscrow } from "@/lib/escrow-store";
import { getWallet, subscribeWallet } from "@/lib/wallet-store";
import { getAllOrders, subscribeOrders } from "@/lib/orders-store";
import { ClientRecommendations } from "@/components/site/personalized-recommendations";
import { WorkspaceGuidance } from "@/components/ux/workspace-guidance";
import {
  buildHiringPipelineForClient,
  getClientLifetimeSpend,
  getPendingProposalsForClient,
} from "@/lib/client-dashboard-utils";
import { subscribeApplications } from "@/lib/applications-store";

export const Route = createFileRoute("/dashboard/")({

  head: () => ({ meta: [{ title: "Mijoz paneli — Ishbor" }] }),

  component: ClientDashboard,

});



const EMPTY_PROJECTS: ReturnType<typeof getMyProjects> = [];
const EMPTY_ORDERS: Order[] = [];



function filterClientEscrow(user: AuthUser | null, workflows: EscrowWorkflow[]) {

  if (!user) return [];

  return workflows.filter(

    (e) => e.client === user.fullName || e.client === user.company || e.client === user.companySlug,

  );

}



function escrowHeldAmount(escrow: EscrowWorkflow) {

  return escrow.milestones

    .filter((m) => m.status === "funded")

    .reduce((sum, m) => sum + m.amount, 0);

}



function ClientDashboard() {

  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeRole === "freelancer") {
      navigate({ to: "/dashboard/freelancer", replace: true });
    } else if (activeRole === "agency") {
      navigate({ to: "/dashboard/agency", replace: true });
    }
  }, [activeRole, navigate]);

  useEffect(() => {
    if (user) syncSmartNotifications(user.id);
  }, [user?.id, activeRole]);

  const userId = user?.id;



  const myProjects = useSyncExternalStore(

    subscribeProjects,

    () => (userId ? getMyProjects(userId) : EMPTY_PROJECTS),

    () => EMPTY_PROJECTS,

  );

  const saved = useSyncExternalStore(

    subscribeSaved,

    () => getSaved(userId),

    () => EMPTY_SAVED,

  );

  const allEscrows = useSyncExternalStore(
    subscribeEscrow,
    getAllEscrowWorkflows,
    () => [] as EscrowWorkflow[],
  );

  const clientEscrows = useMemo(
    () => filterClientEscrow(user, allEscrows),
    [user, allEscrows],
  );

  const wallet = useSyncExternalStore(

    subscribeWallet,

    () => (userId ? getWallet(userId) : null),

    () => null,

  );

  const allOrders = useSyncExternalStore(subscribeOrders, getAllOrders, () => EMPTY_ORDERS);
  useSyncExternalStore(subscribeApplications, () => 0, () => 0);

  const userOrders = useMemo(() => {
    if (!user) return EMPTY_ORDERS;
    const { id, username, companySlug, fullName, company } = user;
    return allOrders.filter(
      (o) =>
        o.ownerUserId === id ||
        (username && o.freelancerUsername === username) ||
        (companySlug && o.clientSlug === companySlug) ||
        o.client === fullName ||
        (company && o.client === company),
    );
  }, [allOrders, user]);

  const activeOrders = userOrders.filter((o) => o.status === "in_progress" || o.status === "review");

  const hiringLeads = useMemo(() => {
    if (!user) return [] as HiringLead[];
    const real = buildHiringPipelineForClient(user);
    return real.length > 0 ? real : hiringPipeline;
  }, [user]);

  const pendingProposals = useMemo(() => (user ? getPendingProposalsForClient(user) : []), [user, allOrders]);

  const reviewingLeads = hiringLeads.filter((h) => h.stage === "reviewing");
  const shortlistedLeads = hiringLeads.filter((h) => h.stage === "shortlisted");
  const interviewLeads = hiringLeads.filter((h) => h.stage === "interview");
  const offerLeads = hiringLeads.filter((h) => h.stage === "offer");

  const activeEscrows = clientEscrows.filter((e) => e.status !== "completed" && e.status !== "released");

  const totalEscrow = activeEscrows.reduce((sum, e) => sum + escrowHeldAmount(e), 0);

  const fundedMilestones = activeEscrows.reduce(

    (sum, e) => sum + e.milestones.filter((m) => m.status === "funded").length,

    0,

  );

  const recentProjects = myProjects.slice(0, 4);

  const savedFreelancers = saved.freelancers.length;

  const lifetimeSpent = user ? getClientLifetimeSpend(user) : 0;

  const availableBalance = wallet?.available ?? 0;



  return (

    <WorkspaceShell

      eyebrow="Mijoz ish maydoni"

      title={`Xayrli kech, ${user?.fullName.split(" ")[0] ?? "do'stim"}.`}

      actions={
        <Link
          to="/projects/create"
          className="touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring sm:w-auto"
        >
          <Plus className="size-4" />
          Loyiha joylash
        </Link>
      }

    >

      {user && <WorkspaceGuidance user={user} />}

      {user && <ClientRecommendations />}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">

        <StatCard label="Jami sarflangan" value={`$${lifetimeSpent.toLocaleString()}`} trend="Platformada umumiy" />

        <StatCard label="Eskrouda" value={`$${totalEscrow.toLocaleString()}`} trend={`${fundedMilestones} faol bosqich`} accent />

        <StatCard label="Mavjud balans" value={`$${availableBalance.toLocaleString()}`} trend="Xarajat qilishga tayyor" />

      </div>



      {totalEscrow > 0 && (

        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-5">

          <EscrowShield size="md" className="shrink-0" />

          <span className="text-sm text-muted-foreground">

            <span className="font-semibold text-foreground">${totalEscrow.toLocaleString()}</span> {fundedMilestones} faol bosqich bo'yicha eskrouda xavfsiz saqlanmoqda. Mablag'lar faqat sizning tasdig'ingizdan keyin chiqariladi.

          </span>

        </div>

      )}



      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">

        <div className="flex flex-col gap-8">

          <section className="rounded-2xl border border-border bg-card">

            <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">

              <h2 className="font-display text-base font-semibold">So'nggi loyihalar</h2>

              <Link to="/my-projects" className="text-xs font-medium text-primary transition-default hover:text-primary/80">

                Barchasini ko'rish

              </Link>

            </div>

            {recentProjects.length > 0 ? (

              <div className="divide-y divide-border">

                {recentProjects.map((project) => (

                  <Link

                    key={project.id}

                    to="/projects/$slug"

                    params={{ slug: project.slug }}

                    className="flex items-center gap-3 p-4 transition-default hover:bg-secondary/20 sm:p-6"

                  >

                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">

                      <FolderOpen className="size-4" />

                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="truncate font-display text-sm font-semibold">{project.title}</div>

                      <div className="font-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">

                        {project.category} · {project.proposals} ta taklif

                      </div>

                    </div>

                    <div className="text-right">

                      <div className="font-display text-sm font-semibold">${project.budget.toLocaleString()}</div>

                      <div className="font-mono text-[10px] text-muted-foreground">{project.status ?? "published"}</div>

                    </div>

                  </Link>

                ))}

              </div>

            ) : (
              <EmptyState
                compact
                icon={FolderOpen}
                title="Hali loyihalar yo'q"
                description="Birinchi loyihangizni joylang — frilanserlar 24 soat ichida taklif yuborishni boshlaydi."
                benefit="O'rtacha 3–5 ta sifatli taklif olasiz."
                action={
                  <Link
                    to="/projects/create"
                    className="touch-target rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Loyiha joylash
                  </Link>
                }
                secondaryAction={
                  <Link to="/freelancers" className="text-sm font-medium text-primary hover:underline">
                    Avval frilanser qidirish
                  </Link>
                }
              />
            )}

          </section>

          {pendingProposals.length > 0 && (
            <section className="rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
                <h2 className="font-display text-base font-semibold">Yangi takliflar</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                  {pendingProposals.length}
                </span>
              </div>
              <div className="divide-y divide-border">
                {pendingProposals.slice(0, 5).map((app) => (
                  <Link
                    key={app.id}
                    to="/projects/$slug"
                    params={{ slug: app.projectSlug ?? "" }}
                    className="flex items-center gap-3 p-4 transition-default hover:bg-secondary/20 sm:p-6"
                  >
                    <GradientAvatar name={app.freelancerName ?? "F"} hue={app.freelancerHue ?? 250} size={40} rounded="rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{app.freelancerName ?? "Frilanser"}</div>
                      <div className="font-mono mt-0.5 truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                        {app.projectTitle} · ${app.proposalAmount ?? app.budget}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg border border-border px-2 py-1 text-[10px] font-medium uppercase">
                      {app.status === "shortlisted" ? "Tanlovda" : "Yangi"}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
              <h2 className="font-display text-base font-semibold">Faol buyurtmalar</h2>

              <Link to="/orders" className="text-xs font-medium text-primary transition-default hover:text-primary/80">

                Barchasini ko'rish

              </Link>

            </div>

            <div className="divide-y divide-border">

              {activeOrders.length > 0 ? activeOrders.map((order) => (

                <Link key={order.id} to="/orders/$id" params={{ id: order.id }} className="block p-4 transition-default hover:bg-secondary/20 sm:p-6">

                  <div className="mb-4 flex items-center gap-3">

                    <GradientAvatar name={order.client} hue={order.clientHue} size={40} rounded="rounded-lg" />

                    <div className="min-w-0 flex-1">

                      <div className="truncate font-display text-sm font-semibold">{order.title}</div>

                      <div className="font-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">

                        {order.client}

                      </div>

                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">

                      <OrderStatusBadge status={order.status} />

                      {order.escrowFunded && <EscrowFundedBadge />}

                    </div>

                  </div>

                  <div className="mb-4 h-1.5 rounded-full bg-secondary">

                    <div

                      className="h-full rounded-full bg-primary transition-all"

                      style={{ width: `${order.progress}%` }}

                    />

                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">

                    <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:gap-3 sm:text-[11px]">

                      <span className="flex items-center gap-1">

                        <Clock className="size-3" /> Muddat: {order.dueDate}

                      </span>

                      <span>·</span>

                      <span>{order.milestones.length} bosqich</span>

                    </div>

                    <div className="font-display text-sm font-semibold">${order.amount.toLocaleString()}</div>

                  </div>

                </Link>

              )) : (
                <EmptyState
                  compact
                  icon={ClipboardList}
                  title="Faol buyurtmalar yo'q"
                  description="Frilanserni yollaganingizdan keyin buyurtmalar shu yerda paydo bo'ladi."
                  action={
                    myProjects.length > 0 ? (
                      <Link to="/my-projects" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                        Loyihalarim
                      </Link>
                    ) : (
                      <Link to="/projects/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                        Loyiha joylash
                      </Link>
                    )
                  }
                />
              )}

            </div>

          </section>



          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
              <h2 className="font-display text-base font-semibold">Yollash voronkasi</h2>

              <Link to="/clients/manage" className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-default hover:text-primary/80">

                <Users className="size-3" /> CRM ga o'tish

              </Link>

            </div>

            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">

              {[

                { label: "Ko'rib chiqilmoqda", pipelineKey: "reviewing", leads: reviewingLeads },

                { label: "Tanlovga qo'yilgan", pipelineKey: "shortlisted", leads: shortlistedLeads },

                { label: "Suhbat", pipelineKey: "interview", leads: interviewLeads },

                { label: "Taklif", pipelineKey: "offer", leads: offerLeads },

              ].map(({ label, pipelineKey, leads }) => (

                <div key={pipelineKey}>

                  <div className="mb-4 flex items-center gap-2">

                    <h3 className="font-display text-xs font-semibold uppercase tracking-widest">{label}</h3>

                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-secondary font-mono text-[10px] font-semibold">

                      {leads.length}

                    </span>

                  </div>

                  <div className="space-y-3">

                    {leads.length > 0 ? leads.map((lead) => (

                      <HiringCard key={lead.id} lead={lead} />

                    )) : (

                      <PipelineEmpty
                        label={pipelineKey}
                        description="Takliflar kelganda shu yerda ko'rinadi."
                        action={
                          myProjects.length === 0 ? (
                            <Link to="/projects/create" className="text-xs font-medium text-primary hover:underline">
                              Loyiha joylash →
                            </Link>
                          ) : undefined
                        }
                      />

                    )}

                  </div>

                </div>

              ))}

            </div>

          </section>

        </div>



        <div className="flex flex-col gap-8">

          <section className="rounded-2xl border border-border bg-card">

            <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">

              <h2 className="font-display text-base font-semibold">Eskrou ko'rinishi</h2>

              <Link to="/escrow" className="text-xs font-medium text-primary transition-default hover:text-primary/80">

                Barchasini ko'rish

              </Link>

            </div>

            <div className="p-4 sm:p-6">

              <div className="mb-6">

                <div className="eyebrow">Eskrouda</div>

                <div className="font-display mt-2 text-3xl font-bold">${totalEscrow.toLocaleString()}</div>

                <div className="font-mono mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">

                  {fundedMilestones} faol bosqich

                </div>

              </div>

              <div className="space-y-3">

                {activeEscrows.length > 0 ? activeEscrows.map((escrow) => {

                  const held = escrowHeldAmount(escrow);

                  if (held === 0) return null;

                  return (

                    <Link

                      key={escrow.id}

                      to="/escrow/$id"

                      params={{ id: escrow.id }}

                      className="flex items-center gap-3 rounded-lg transition-default hover:bg-secondary/20"

                    >

                      <div className="size-2 flex-shrink-0 rounded-full bg-primary" />

                      <div className="min-w-0 flex-1">

                        <div className="truncate text-xs font-medium">{escrow.project}</div>

                        <div className="font-mono text-[10px] text-muted-foreground">{escrow.freelancer}</div>

                      </div>

                      <div className="font-display text-right text-sm font-semibold">${held.toLocaleString()}</div>

                    </Link>

                  );

                }) : (
                  <EmptyState
                    compact
                    icon={Lock}
                    title="Faol eskrou yo'q"
                    description="Frilanserni yollaganingizda mablag'lar xavfsiz eskrouda saqlanadi."
                    action={
                      <Link to="/escrow" className="text-xs font-medium text-primary hover:underline">
                        Eskrou haqida →
                      </Link>
                    }
                  />
                )}

              </div>

              <div className="mt-6 flex items-start gap-2 rounded-lg border border-border bg-surface p-3">

                <Shield className="mt-0.5 size-4 flex-shrink-0 text-primary" />

                <div>

                  <div className="text-xs font-medium">Eskrou himoyalangan</div>

                  <div className="font-mono text-[10px] text-muted-foreground">

                    Barcha mablag'lar bosqich yakunlanguncha xavfsiz saqlanadi.

                  </div>

                </div>

              </div>

            </div>

          </section>



          {savedFreelancers > 0 && (
          <section className="rounded-2xl border border-border bg-card">

            <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">

              <h2 className="font-display text-base font-semibold">Saqlangan frilanserlar</h2>

              <Link to="/saved" className="text-xs font-medium text-primary transition-default hover:text-primary/80">

                Barchasini ko'rish

              </Link>

            </div>

            <div className="p-4 sm:p-6">

              <div className="flex items-center gap-3">

                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">

                  <Heart className="size-4" />

                </div>

                <div>

                  <div className="font-display text-2xl font-bold">{savedFreelancers}</div>

                  <div className="text-xs text-muted-foreground">keyinroq uchun saqlangan frilanserlar</div>

                </div>

              </div>

              <Link

                to="/saved"

                className="mt-4 block text-center text-xs font-medium text-primary transition-default hover:text-primary/80"

              >

                Saqlanganlarni ko'rish →

              </Link>

            </div>

          </section>
          )}



          <section className="rounded-2xl border border-border bg-card">

            <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">

              <h2 className="font-display text-base font-semibold">So'nggi xabarlar</h2>

              <Link to="/messages" className="text-xs font-medium text-primary transition-default hover:text-primary/80">

                Barchasi

              </Link>

            </div>

            <div className="divide-y divide-border">

              {messages.slice(0, 3).map((msg) => (

                <Link

                  key={msg.id}

                  to="/messages"

                  className="flex items-center gap-3 p-4 transition-default hover:bg-secondary/20"

                >

                  <div className="relative">

                    <GradientAvatar name={msg.name} hue={msg.hue} size={36} />

                    {msg.online && (

                      <div className="absolute bottom-0 right-0 size-2 rounded-full bg-success ring-2 ring-card" />

                    )}

                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex items-center gap-2">

                      <div className="truncate text-sm font-medium">{msg.name}</div>

                      {msg.unread > 0 && (

                        <span className="inline-flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-semibold text-primary-foreground">

                          {msg.unread}

                        </span>

                      )}

                    </div>

                    <div className="font-mono truncate text-xs text-muted-foreground">{msg.snippet}</div>

                  </div>

                  <div className="font-mono whitespace-nowrap text-[10px] text-muted-foreground">{msg.time}</div>

                </Link>

              ))}

            </div>

            <Link

              to="/messages"

              className="block border-t border-border px-6 py-3 text-center text-xs font-medium text-primary transition-default hover:text-primary/80"

            >

              Barcha xabarlarni ko'rish

            </Link>

          </section>

        </div>

      </div>

    </WorkspaceShell>

  );

}



function StatCard({ label, value, trend, accent }: { label: string; value: string; trend: string; accent?: boolean }) {

  return (

    <div className={`rounded-xl border bg-card p-4 transition-default hover:border-primary/20 hover:bg-surface ${accent ? "border-primary/20 bg-primary/5" : "border-border"}`}>

      <div className="flex items-center gap-2 eyebrow">

        {accent && <Lock className="size-3 text-primary" />}

        {label}

      </div>

      <div className="font-display mt-2 text-3xl font-bold tracking-tight">{value}</div>

      <div className="font-mono mt-1 inline-flex items-center gap-1 text-[11px] text-success">

        <TrendingUp className="size-3" /> {trend}

      </div>

    </div>

  );

}



function HiringCard({ lead }: { lead: HiringLead }) {

  return (

    <Link to="/freelancers/$username" params={{ username: lead.username }} className="block rounded-lg border border-border bg-surface p-3 transition-default hover:border-primary/20">

      <div className="mb-2 flex items-center gap-2">

        <GradientAvatar name={lead.name} hue={lead.hue} size={28} rounded="rounded-md" />

        <div className="min-w-0 flex-1">

          <div className="truncate text-xs font-semibold leading-snug">{lead.name}</div>

        </div>

      </div>

      <div className="mb-2">

        <div className="font-mono truncate text-[9px] uppercase tracking-widest text-muted-foreground">{lead.title}</div>

      </div>

      <div className="flex items-center justify-between">

        <div className="font-display text-xs font-semibold">${lead.rate}/soat</div>

        <div className="font-mono flex items-center gap-0.5 text-[9px] text-muted-foreground">

          <span>★</span>

          <span>{lead.rating.toFixed(2)}</span>

        </div>

      </div>

    </Link>

  );

}

