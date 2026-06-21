import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import {
  Package,
  FileText,
  Briefcase,
} from "lucide-react";

import { useSyncExternalStore, useEffect } from "react";

import { WorkspaceShell } from "@/components/site/workspace-shell";

import { GradientAvatar } from "@/components/site/avatar";

import { ApplicationStatusBadge, OrderStatusBadge, EscrowFundedBadge } from "@/components/site/trust";

import { StandardEmptyState } from "@/components/ux/standard-empty-state";
import { PrimaryLink } from "@/components/ux/action-buttons";
import { EMPTY_STATE_CTA } from "@/lib/ux-constants";

import { syncSmartNotifications } from "@/lib/ai-smart-notifications";

import { computeSuccessScore, getMonthlyEarnings, getEarningsLast30Days } from "@/lib/growth-metrics";
import { getRepeatClientStats } from "@/lib/ecosystem-progress";
import { subscribeOrders, readStoredOrders } from "@/lib/orders-store";
import { getReviewsForFreelancer, subscribeReviews } from "@/lib/reviews-store";
import { FreelancerRecommendations } from "@/components/site/personalized-recommendations";
import { WorkspaceGuidance } from "@/components/ux/workspace-guidance";
import { GettingStartedCard } from "@/components/ftue/getting-started-card";
import { WelcomeBanner } from "@/components/ftue/welcome-banner";
import { resolvePrimaryNextAction } from "@/lib/journey-guidance";
import { DashboardActivityFeed } from "@/components/site/dashboard-activity-feed";
import { MarketplaceActivityStrip } from "@/components/ecosystem/marketplace-activity-strip";
import { SimpleStatCard } from "@/components/site/simple-stat-card";

import { getAllApplications, subscribeApplications } from "@/lib/applications-store";
import type { StoredReview } from "@/lib/reviews-store";
import type { Order } from "@/lib/mock-data";
import type { Application } from "@/lib/mock-data";

import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";



export const Route = createFileRoute("/dashboard/freelancer")({

  head: () => ({ meta: [{ title: "Frilanser paneli — Ishbor" }] }),

  component: FreelancerDashboard,

});



const EMPTY_APPLICATIONS_SNAPSHOT: Application[] = [];
const EMPTY_ORDERS_SNAPSHOT: Order[] = [];
const EMPTY_REVIEWS_SNAPSHOT: StoredReview[] = [];



function FreelancerDashboard() {

  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeRole === "client") {
      navigate({ to: "/dashboard", replace: true });
    } else if (activeRole === "agency") {
      navigate({ to: "/dashboard/agency", replace: true });
    }
  }, [activeRole, navigate]);

  useEffect(() => {
    if (user?.id) syncSmartNotifications(user.id);
  }, [user?.id, activeRole]);

  const applications = useSyncExternalStore(
    subscribeApplications,
    getAllApplications,
    () => EMPTY_APPLICATIONS_SNAPSHOT,
  );

  const myApplications = applications.filter(
    (a) => !a.archived && (!user?.username || a.freelancerUsername === user.username),
  );

  const storedOrders = useSyncExternalStore(subscribeOrders, readStoredOrders, () => EMPTY_ORDERS_SNAPSHOT);
  const userOrders = user?.username
    ? storedOrders.filter((o) => o.freelancerUsername === user.username)
    : EMPTY_ORDERS_SNAPSHOT;
  const activeOrders = userOrders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  const userReviews = useSyncExternalStore(
    subscribeReviews,
    () => (user?.username ? getReviewsForFreelancer(user.username) : EMPTY_REVIEWS_SNAPSHOT),
    () => EMPTY_REVIEWS_SNAPSHOT,
  );

  const applicationCount = myApplications.length;
  const pendingApplications = myApplications.filter((a) => a.status === "pending" || a.status === "shortlisted").length;
  const acceptedApplications = myApplications.filter((a) => a.status === "accepted").length;
  const winRate = applicationCount > 0 ? Math.round((acceptedApplications / applicationCount) * 100) : 0;

  const reviewCount = userReviews.length;
  const activeOrdersCount = activeOrders.length;

  const earnings30 = user?.username ? getEarningsLast30Days(user.username) : 0;
  const earningsData = user?.username ? getMonthlyEarnings(user.username) : [];
  const maxEarning = Math.max(...earningsData.map((d) => d.value), 1);
  const totalEarnings = earningsData.reduce((sum, d) => sum + d.value, 0);

  const successMetrics = user?.username ? computeSuccessScore(user.username) : null;
  const repeatStats = user?.username ? getRepeatClientStats(user.username) : null;
  const ratingDisplay =
    successMetrics && successMetrics.reviewCount > 0
      ? successMetrics.avgRating.toFixed(1)
      : "—";

  const recentApplications = myApplications.slice(0, 5);

  const primaryAction = user ? resolvePrimaryNextAction(user, "freelancer") : null;
  const primaryHref = primaryAction?.href ?? "/projects";
  const primaryLabel = primaryAction?.cta ?? "Ish topish";
  const secondaryHref = primaryHref === "/services/create" ? "/projects" : "/services/create";
  const secondaryLabel = primaryHref === "/services/create" ? "Ish topish" : "Xizmat yaratish";

  return (

    <WorkspaceShell

      eyebrow="Frilanser ish maydoni"

      title={`Xush kelibsiz, ${user?.fullName?.split(" ")[0] ?? "do'stim"}.`}

      actions={
        primaryAction ? (
          <Link
            to={primaryAction.href}
            className="touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring sm:w-auto"
          >
            <Briefcase className="size-4" /> {primaryAction.cta}
          </Link>
        ) : (
          <Link
            to="/projects"
            className="touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring sm:w-auto"
          >
            <Briefcase className="size-4" /> Ish topish
          </Link>
        )
      }

    >

      {user && (
        <div className="mb-6 space-y-4">
          <WelcomeBanner
            user={user}
            roleLabel="Frilanser"
            primaryHref={primaryHref}
            primaryLabel={primaryLabel}
            secondaryHref={secondaryHref}
            secondaryLabel={secondaryLabel}
          />
          <GettingStartedCard user={user} />
          <WorkspaceGuidance user={user} hideNextAction />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SimpleStatCard label="Daromad (30 kun)" value={earnings30 > 0 ? `$${earnings30.toLocaleString()}` : "$0"} />
        <SimpleStatCard label="Faol buyurtmalar" value={String(activeOrdersCount)} />
        <SimpleStatCard label="Arizalar" value={String(applicationCount)} sub={applicationCount > 0 ? `${winRate}% qabul` : undefined} />
        <SimpleStatCard label="Reyting" value={ratingDisplay} sub={reviewCount > 0 ? `${reviewCount} sharh` : undefined} />
        {repeatStats && repeatStats.repeatClientCount > 0 && (
          <SimpleStatCard
            label="Takror mijozlar"
            value={String(repeatStats.repeatClientCount)}
            sub={`${repeatStats.repeatClientRate}%`}
          />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DashboardActivityFeed />
        <MarketplaceActivityStrip />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">

        <section className="rounded-xl border border-border bg-card">

          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <h2 className="font-display text-sm font-semibold">Faol buyurtmalar</h2>
            <Link to="/orders" className="text-xs font-medium text-primary hover:underline">Barchasi</Link>
          </div>

          <div className="divide-y divide-border">
            {activeOrders.length > 0 ? activeOrders.slice(0, 4).map((order) => (
              <Link key={order.id} to="/orders/$id" params={{ id: order.id }} className="block px-4 py-3 premium-list-row hover:bg-secondary/20 sm:px-5">
                <div className="flex items-center gap-3">
                  <GradientAvatar name={order.client} hue={order.clientHue} size={32} rounded="rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{order.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>${order.amount.toLocaleString()}</span>
                      <span>·</span>
                      <span>{order.progress}%</span>
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
                icon={Package}
                title={EMPTY_STATE_CTA.freelancerOrders.title}
                description={EMPTY_STATE_CTA.freelancerOrders.description}
                action={<PrimaryLink to="/projects">{EMPTY_STATE_CTA.freelancerOrders.label}</PrimaryLink>}
              />
            )}
          </div>

        </section>



        <section className="rounded-xl border border-border bg-card">

          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <h2 className="font-display text-sm font-semibold">
              Arizalar
              {pendingApplications > 0 && (
                <span className="ml-2 font-normal text-muted-foreground">· {pendingApplications} kutilmoqda</span>
              )}
            </h2>
            <Link to="/applications" className="text-xs font-medium text-primary hover:underline">Barchasi</Link>
          </div>

          <div className="divide-y divide-border">
            {recentApplications.length > 0 ? recentApplications.map((app) => (
              <Link key={app.id} to="/applications/$id" params={{ id: app.id }} className="block px-4 py-3 premium-list-row hover:bg-secondary/20 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{app.projectTitle}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      ${app.budget.toLocaleString()} · {app.submittedAgo}
                    </div>
                  </div>
                  <ApplicationStatusBadge status={app.status} />
                </div>
              </Link>
            )) : (
              <StandardEmptyState
                compact
                icon={FileText}
                title={EMPTY_STATE_CTA.freelancerWork.title}
                description={EMPTY_STATE_CTA.freelancerWork.description}
                action={<PrimaryLink to="/projects">{EMPTY_STATE_CTA.freelancerWork.label}</PrimaryLink>}
              />
            )}
          </div>

        </section>

      </div>

      {totalEarnings > 0 && (
        <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="font-display text-sm font-semibold">Daromad · 6 oy</h2>
            <div className="text-right">
              <div className="font-display text-lg font-bold">${totalEarnings.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Jami</div>
            </div>
          </div>
          <div className="flex h-32 items-end gap-2">
            {earningsData.map((data, idx) => (
              <div key={data.month} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="font-mono text-[10px] text-muted-foreground">${data.value}</div>
                <div
                  className={`w-full rounded-t-md transition-default ${
                    idx === earningsData.length - 1 ? "bg-primary" : "bg-primary/25"
                  }`}
                  style={{ height: `${Math.max(6, (data.value / maxEarning) * 96)}px` }}
                />
                <div className="font-mono text-[10px] uppercase text-muted-foreground">{data.month}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {user && <div className="mt-6"><FreelancerRecommendations compact /></div>}

    </WorkspaceShell>

  );

}

