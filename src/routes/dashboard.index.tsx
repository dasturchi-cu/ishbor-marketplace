import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { useSyncExternalStore, useMemo, useEffect } from "react";

import { Plus, FolderOpen, ClipboardList } from "lucide-react";

import { WorkspaceShell } from "@/components/site/workspace-shell";
import { syncSmartNotifications } from "@/lib/ai-smart-notifications";

import { GradientAvatar } from "@/components/site/avatar";

import { OrderStatusBadge, EscrowFundedBadge } from "@/components/site/trust";

import { StandardEmptyState } from "@/components/ux/standard-empty-state";
import { PrimaryLink } from "@/components/ux/action-buttons";
import { EMPTY_STATE_CTA } from "@/lib/ux-constants";

import { SimpleStatCard } from "@/components/site/simple-stat-card";
import type { EscrowWorkflow, Order, HiringLead } from "@/lib/mock-data";
import type { AuthUser } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import { getMyProjects, subscribeProjects } from "@/lib/projects-store";
import { getAllEscrowWorkflows, subscribeEscrow } from "@/lib/escrow-store";
import { getWallet, subscribeWallet } from "@/lib/wallet-store";
import { getAllOrders, subscribeOrders } from "@/lib/orders-store";
import { ClientRecommendations } from "@/components/site/personalized-recommendations";
import { WorkspaceGuidance } from "@/components/ux/workspace-guidance";
import { DashboardActivityFeed } from "@/components/site/dashboard-activity-feed";
import {
  buildHiringPipelineForClient,
  getClientLifetimeSpend,
  getPendingProposalsForClient,
} from "@/lib/client-dashboard-utils";
import { subscribeApplications } from "@/lib/applications-store";
import { hiringPipeline } from "@/lib/mock-data";

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
  const pipelineTotal = hiringLeads.length;

  const totalEscrow = clientEscrows
    .filter((e) => e.status !== "completed" && e.status !== "released")
    .reduce((sum, e) => sum + escrowHeldAmount(e), 0);

  const recentProjects = myProjects.slice(0, 4);
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

      {user && <WorkspaceGuidance user={user} hideNextAction />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SimpleStatCard label="Jami sarflangan" value={`$${lifetimeSpent.toLocaleString()}`} />
        <SimpleStatCard label="Eskrouda" value={`$${totalEscrow.toLocaleString()}`} sub={totalEscrow > 0 ? "Faol mablag'" : undefined} />
        <SimpleStatCard label="Mavjud balans" value={`$${availableBalance.toLocaleString()}`} />
        <SimpleStatCard label="Loyihalar" value={String(myProjects.length)} sub={pendingProposals.length > 0 ? `${pendingProposals.length} yangi taklif` : undefined} />
      </div>

      <div className="mt-6">
        <DashboardActivityFeed />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">

        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <h2 className="font-display text-sm font-semibold">So'nggi loyihalar</h2>
            <Link to="/my-projects" className="text-xs font-medium text-primary hover:underline">Barchasi</Link>
          </div>
          {recentProjects.length > 0 ? (
            <div className="divide-y divide-border">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to="/projects/$slug"
                  params={{ slug: project.slug }}
                  className="block px-4 py-3 transition-default hover:bg-secondary/20 sm:px-5"
                >
                  <div className="truncate text-sm font-medium">{project.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    ${project.budget.toLocaleString()} · {project.proposals} ta taklif
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <StandardEmptyState
              compact
              icon={FolderOpen}
              title={EMPTY_STATE_CTA.clientProject.title}
              description={EMPTY_STATE_CTA.clientProject.description}
              action={<PrimaryLink to="/projects/create">{EMPTY_STATE_CTA.clientProject.label}</PrimaryLink>}
            />
          )}
        </section>

        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <h2 className="font-display text-sm font-semibold">Faol buyurtmalar</h2>
            <Link to="/orders" className="text-xs font-medium text-primary hover:underline">Barchasi</Link>
          </div>
          <div className="divide-y divide-border">
            {activeOrders.length > 0 ? activeOrders.slice(0, 4).map((order) => (
              <Link key={order.id} to="/orders/$id" params={{ id: order.id }} className="block px-4 py-3 transition-default hover:bg-secondary/20 sm:px-5">
                <div className="flex items-center gap-3">
                  <GradientAvatar name={order.freelancer} hue={order.freelancerHue} size={32} rounded="rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{order.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      ${order.amount.toLocaleString()} · {order.progress}%
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <OrderStatusBadge status={order.status} />
                    {order.escrowFunded && <EscrowFundedBadge />}
                  </div>
                </div>
              </Link>
            )) : (
              <StandardEmptyState
                compact
                icon={ClipboardList}
                title="Faol buyurtmalar yo'q"
                description="Frilanserni yollaganingizdan keyin buyurtmalar shu yerda paydo bo'ladi."
                action={
                  myProjects.length > 0 ? (
                    <PrimaryLink to="/my-projects">Loyihalarim</PrimaryLink>
                  ) : (
                    <PrimaryLink to="/projects/create">{EMPTY_STATE_CTA.clientProject.label}</PrimaryLink>
                  )
                }
              />
            )}
          </div>
        </section>

      </div>

      {pendingProposals.length > 0 && (
        <section className="mt-6 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <h2 className="font-display text-sm font-semibold">Yangi takliflar</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {pendingProposals.length}
            </span>
          </div>
          <div className="divide-y divide-border">
            {pendingProposals.slice(0, 4).map((app) => (
              <Link
                key={app.id}
                to="/projects/$slug"
                params={{ slug: app.projectSlug ?? "" }}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-default hover:bg-secondary/20 sm:px-5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{app.freelancerName ?? "Frilanser"}</div>
                  <div className="truncate text-xs text-muted-foreground">{app.projectTitle}</div>
                </div>
                <div className="shrink-0 text-sm font-semibold">${(app.proposalAmount ?? app.budget).toLocaleString()}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {pipelineTotal > 0 && (
        <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-sm font-semibold">Yollash voronkasi</h2>
            <Link to="/clients/manage" className="text-xs font-medium text-primary hover:underline">CRM →</Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>Ko'rib chiqilmoqda: <strong className="text-foreground">{reviewingLeads.length}</strong></span>
            <span>Tanlov: <strong className="text-foreground">{shortlistedLeads.length}</strong></span>
            <span>Suhbat: <strong className="text-foreground">{interviewLeads.length}</strong></span>
            <span>Taklif: <strong className="text-foreground">{offerLeads.length}</strong></span>
          </div>
        </section>
      )}

      {user && (
        <div className="mt-6">
          <ClientRecommendations compact />
        </div>
      )}

    </WorkspaceShell>

  );

}

