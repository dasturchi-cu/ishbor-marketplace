import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import {

  TrendingUp,

  Package,

  FileText,

  Star,

  Clock,

  DollarSign,

  Briefcase,

  CircleCheck as CheckCircle2,

} from "lucide-react";

import { useState, useSyncExternalStore, useEffect } from "react";

import { WorkspaceShell } from "@/components/site/workspace-shell";

import { GradientAvatar } from "@/components/site/avatar";

import { ApplicationStatusBadge, OrderStatusBadge, EscrowFundedBadge } from "@/components/site/trust";

import { EmptyState } from "@/components/site/feedback";

import { syncSmartNotifications } from "@/lib/ai-smart-notifications";

import { computeSuccessScore, computeResponseRate, formatResponseTime, getMonthlyEarnings, getEarningsLast30Days } from "@/lib/growth-metrics";
import { getOrdersForFreelancer, subscribeOrders, readStoredOrders } from "@/lib/orders-store";
import { getReviewsForFreelancer, subscribeReviews } from "@/lib/reviews-store";
import { FreelancerRecommendations } from "@/components/site/personalized-recommendations";
import { NextActionCard } from "@/components/ftue/next-action-card";

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
  const [activeTab, setActiveTab] = useState<"applications" | "reviews">("applications");

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
  const rejectedApplications = myApplications.filter((a) => a.status === "rejected").length;
  const winRate = applicationCount > 0 ? Math.round((acceptedApplications / applicationCount) * 100) : 0;

  const reviewCount = userReviews.length;
  const activeOrdersCount = activeOrders.length;

  const earnings30 = user?.username ? getEarningsLast30Days(user.username) : 0;
  const earningsData = user?.username ? getMonthlyEarnings(user.username) : [];
  const maxEarning = Math.max(...earningsData.map((d) => d.value), 1);
  const totalEarnings = earningsData.reduce((sum, d) => sum + d.value, 0);

  const successMetrics = user?.username ? computeSuccessScore(user.username) : null;
  const responseMetrics = user?.username ? computeResponseRate(user.username) : null;

  return (

    <WorkspaceShell

      eyebrow="Frilanser ish maydoni"

      title={`Xush kelibsiz, ${user?.fullName.split(" ")[0] ?? "do'stim"}.`}

      actions={
        <Link
          to="/projects"
          className="touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring sm:w-auto"
        >
          <Briefcase className="size-4" /> Ish topish
        </Link>
      }

    >

      {user && <NextActionCard user={user} />}

      {user && <FreelancerRecommendations />}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Daromad (30 kun)" value={earnings30 > 0 ? `$${earnings30.toLocaleString()}` : "$0"} trend={successMetrics ? `${successMetrics.completedJobs} ta yakunlangan` : "Hali buyurtma yo'q"} icon={DollarSign} />
        <StatCard label="Faol buyurtmalar" value={activeOrdersCount.toString()} trend={`${pendingApplications} ta kutilayotgan ariza`} icon={Package} />
        <StatCard label="Arizalar" value={applicationCount.toString()} trend={`${winRate}% qabul qilinish`} icon={FileText} />
      </div>



      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">

        <div className="flex flex-col gap-8">

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <h2 className="font-display text-base font-semibold">Daromad · so'nggi 6 oy</h2>

              <div className="text-right">

                <div className="eyebrow">Jami topilgan</div>

                <div className="font-display mt-1 text-2xl font-bold">${totalEarnings.toLocaleString()}</div>

              </div>

            </div>

            <div className="flex h-40 items-end gap-3">
              {earningsData.length === 0 ? (
                <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                  Yakunlangan buyurtmalar bo'lganda daromad ko'rsatiladi
                </p>
              ) : earningsData.map((data, idx) => (
                <div key={data.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="font-mono text-[10px] text-muted-foreground">${data.value}</div>
                  <div
                    className={`w-full rounded-t-lg transition-default ${
                      idx === earningsData.length - 1 ? "bg-primary" : "bg-primary/20 hover:bg-primary/40"
                    }`}
                    style={{ height: `${Math.max(8, (data.value / maxEarning) * 100)}px` }}
                  />
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {data.month}
                  </div>
                </div>
              ))}
            </div>

          </section>



          <section className="rounded-2xl border border-border bg-card">

            <div className="border-b border-border px-4 py-4 sm:px-6">

              <h2 className="font-display text-base font-semibold">Taklif natijalari</h2>

            </div>

            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-6">

              <ProposalStat label="Yuborilgan" value={applicationCount} />

              <ProposalStat label="Kutilmoqda" value={pendingApplications} />

              <ProposalStat label="Qabul qilingan" value={acceptedApplications} />

              <ProposalStat label="G'alaba foizi" value={`${winRate}%`} />

            </div>

            {rejectedApplications > 0 && (

              <div className="border-t border-border px-4 py-3 sm:px-6">

                <div className="font-mono text-[10px] text-muted-foreground">

                  {rejectedApplications} ta rad etilgan · g'alaba foizini oshirish uchun takliflarni yaxshilang

                </div>

              </div>

            )}

          </section>

          <div className="grid gap-8 lg:grid-cols-2">

            <section className="rounded-2xl border border-border bg-card">

              <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">

                <h2 className="font-display text-base font-semibold">Faol buyurtmalar</h2>

                <Link to="/orders" className="text-xs font-medium text-primary transition-default hover:text-primary/80">Barchasini ko'rish</Link>

              </div>

              <div className="divide-y divide-border">

                {activeOrders.map((order) => (

                  <Link key={order.id} to="/orders/$id" params={{ id: order.id }} className="block p-5 transition-default hover:bg-secondary/20">

                    <div className="mb-3 flex items-center gap-3">

                      <GradientAvatar name={order.client} hue={order.clientHue} size={36} rounded="rounded-lg" />

                      <div className="min-w-0 flex-1">

                        <div className="truncate text-sm font-semibold">{order.title}</div>

                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{order.client}</div>

                      </div>

                      <div className="flex items-center gap-2">

                        <OrderStatusBadge status={order.status} />

                        {order.escrowFunded && <EscrowFundedBadge />}

                      </div>

                    </div>

                    <div className="mb-3 flex items-center gap-3">

                      <div className="h-1.5 flex-1 rounded-full bg-secondary">

                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${order.progress}%` }} />

                      </div>

                      <div className="font-mono text-xs text-muted-foreground">{order.progress}%</div>

                    </div>

                    <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-muted-foreground">

                      <span className="flex items-center gap-1"><Clock className="size-3" /> Muddat: {order.dueDate}</span>

                      <span className="font-display text-sm font-semibold text-foreground">${order.amount.toLocaleString()}</span>

                    </div>

                  </Link>

                ))}

              </div>

            </section>



            <section className="rounded-2xl border border-border bg-card">

              <div className="border-b border-border px-4 py-4 sm:px-6">

                <div className="flex items-center justify-between gap-2">

                  <div className="mobile-scroll-x flex gap-2">

                  <button

                    onClick={() => setActiveTab("applications")}

                    className={`touch-target shrink-0 rounded-lg px-4 text-sm font-medium transition-default ${

                      activeTab === "applications" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"

                    }`}

                  >

                    Arizalar ({applicationCount})

                  </button>

                  <button

                    onClick={() => setActiveTab("reviews")}

                    className={`touch-target shrink-0 rounded-lg px-4 text-sm font-medium transition-default ${

                      activeTab === "reviews" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"

                    }`}

                  >

                    Sharhlar ({reviewCount})

                  </button>

                  </div>

                  <Link to="/applications" className="shrink-0 text-xs font-medium text-primary hover:underline">Mening arizalarim →</Link>

                </div>

              </div>

              <div className="max-h-96 divide-y divide-border overflow-y-auto">

                {activeTab === "applications" && myApplications.map((app) => (

                  <Link key={app.id} to="/applications/$id" params={{ id: app.id }} className="block p-4 transition-default hover:bg-secondary/20">

                    <div className="mb-2 flex items-start justify-between gap-3">

                      <div className="min-w-0 flex-1">

                        <div className="truncate text-sm font-semibold">{app.projectTitle}</div>

                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{app.client}</div>

                      </div>

                      <ApplicationStatusBadge status={app.status} />

                    </div>

                    <div className="flex justify-between font-mono text-[11px] text-muted-foreground">

                      <span>${app.budget.toLocaleString()}</span>

                      <span>{app.submittedAgo}</span>

                    </div>

                  </Link>

                ))}

                {activeTab === "reviews" && userReviews.length === 0 && (

                  <EmptyState

                    compact

                    icon={Star}

                    title="Hali sharhlar yo'q"

                    description="Mijozlar fikrini olish uchun birinchi loyihangizni yakunlang."

                  />

                )}

                {activeTab === "reviews" && userReviews.map((review) => (

                  <div key={review.id} className="p-4 transition-default hover:bg-secondary/20">

                    <div className="mb-2 flex items-start gap-3">

                      <GradientAvatar name={review.from} hue={review.fromHue} size={32} />

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2 mb-0.5">

                          <div className="truncate text-xs font-semibold">{review.from}</div>

                          <div className="flex">

                            {[...Array(5)].map((_, i) => (

                              <Star key={i} className={`size-3 ${

                                i < review.rating ? "fill-warning text-warning" : "text-muted-foreground"

                              }`} />

                            ))}

                          </div>

                        </div>

                        <div className="font-mono text-[10px] text-muted-foreground mb-1">{review.project}</div>

                        <div className="text-xs text-muted-foreground line-clamp-2">{review.body}</div>

                      </div>

                    </div>

                    <div className="font-mono text-[10px] text-muted-foreground">{review.date}</div>

                  </div>

                ))}

              </div>

            </section>

          </div>



          <div className="grid gap-4 sm:grid-cols-3">

            <MetricCard label="Ishni yakunlash foizi" value={successMetrics ? `${successMetrics.completionRate}%` : "—"} />
            <MetricCard label="Javob vaqti" value={responseMetrics?.medianMinutes != null ? formatResponseTime(responseMetrics.medianMinutes) : "—"} />
            <MetricCard label="Takroriy mijozlar" value={successMetrics ? `${successMetrics.repeatClientRate}%` : "—"} />

          </div>

        </div>



        <aside className="flex flex-col gap-8">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 eyebrow">
              <Star className="size-3" /> Reyting
            </div>
            <div className="font-display mt-2 text-3xl font-bold">
              {successMetrics && successMetrics.reviewCount > 0 ? successMetrics.avgRating : "—"}
            </div>
            <div className="font-mono mt-1 text-[10px] text-muted-foreground">{reviewCount} ta sharh</div>
          </section>

        </aside>

      </div>

    </WorkspaceShell>

  );

}



function StatCard({

  label, value, trend, icon: Icon, accent,

}: {

  label: string; value: string; trend: string; icon: React.ComponentType<{ className?: string }>; accent?: boolean;

}) {

  return (

    <div className={`rounded-2xl border bg-card p-5 transition-default hover:border-primary/20 ${accent ? "border-primary/20 bg-primary/5" : "border-border"}`}>

      <div className="mb-3 flex items-start justify-between gap-4">

        <div className="eyebrow">{label}</div>

        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">

          <Icon className="size-5" />

        </div>

      </div>

      <div className="font-display text-2xl font-bold tracking-tight">{value}</div>

      <div className="font-mono mt-1.5 inline-flex items-center gap-1 text-[11px] text-success">

        <TrendingUp className="size-3" /> {trend}

      </div>

    </div>

  );

}



function ProposalStat({ label, value }: { label: string; value: string | number }) {

  return (

    <div className="rounded-xl border border-border bg-surface p-4 text-center">

      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>

      <div className="font-display mt-1 text-2xl font-bold">{value}</div>

    </div>

  );

}



function MetricCard({ label, value }: { label: string; value: string }) {

  return (

    <div className="rounded-2xl border border-border bg-card p-5">

      <div className="mb-3 flex items-center justify-between">

        <div className="eyebrow">{label}</div>

        <CheckCircle2 className="size-4 shrink-0 text-success" />

      </div>

      <div className="font-display text-3xl font-bold">{value}</div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">

        <div className="h-full w-4/5 rounded-full bg-primary" />

      </div>

    </div>

  );

}

