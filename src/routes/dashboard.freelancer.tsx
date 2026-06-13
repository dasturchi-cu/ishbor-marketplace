import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  TrendingUp,
  Package,
  FileText,
  Star,
  Clock,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { ApplicationStatusBadge, OrderStatusBadge, EscrowFundedBadge } from "@/components/site/trust";
import { EmptyState } from "@/components/site/feedback";
import { orders, applications, reviews } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/freelancer")({
  head: () => ({ meta: [{ title: "Freelancer Dashboard — Ishbor" }] }),
  component: FreelancerDashboard,
});

function FreelancerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availability, setAvailability] = useState<"available" | "busy" | "away">("available");
  const [activeTab, setActiveTab] = useState<"applications" | "reviews">("applications");

  const activeOrders = orders.filter((o) => o.status !== "completed");
  const applicationCount = applications.length;
  const pendingApplications = applications.filter((a) => a.status === "pending").length;
  const reviewCount = reviews.length;
  const activeOrdersCount = orders.filter((o) => o.status === "in_progress" || o.status === "review").length;
  const endingSoonCount = orders.filter((o) => o.dueDate === "Jun 15" || o.dueDate === "Jun 24").length;

  const earningsData = [
    { month: "Jan", value: 3.2, percent: 42 },
    { month: "Feb", value: 4.4, percent: 58 },
    { month: "Mar", value: 3.7, percent: 49 },
    { month: "Apr", value: 5.4, percent: 71 },
    { month: "May", value: 4.9, percent: 64 },
    { month: "Jun", value: 8.4, percent: 84 },
  ];
  const totalEarnings = earningsData.reduce((sum, d) => sum + d.value, 0);

  const availabilityOptions = [
    { key: "available" as const, label: "Available", dot: "bg-success" },
    { key: "busy" as const, label: "Busy", dot: "bg-warning" },
    { key: "away" as const, label: "Away", dot: "bg-destructive" },
  ];

  return (
    <WorkspaceShell
      eyebrow="Freelancer workspace"
      title={`Welcome back, ${user?.fullName.split(" ")[0] ?? "there"}.`}
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <button
            onClick={() => {
              toast.success("Opening service listing");
              navigate({ to: "/profile" });
            }}
            className="touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring sm:w-auto"
          >
            <Plus className="size-4" /> New service listing
          </button>
          <div className="mobile-scroll-x flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
            {availabilityOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setAvailability(opt.key);
                  toast.success(`Availability set to ${opt.label}`);
                }}
                className={`touch-target inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-default focus-ring ${
                  availability === opt.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <div className={`size-2 rounded-full ${availability === opt.key ? opt.dot : "bg-muted-foreground/40"}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Earnings (30d)" value="$8,420" trend="+18% vs last month" icon={DollarSign} />
        <StatCard label="Active orders" value={activeOrdersCount.toString()} trend={`${endingSoonCount} ending soon`} icon={Package} />
        <StatCard label="Applications" value={applicationCount.toString()} trend={`${pendingApplications} pending`} icon={FileText} />
        <StatCard label="Avg. rating" value="4.98" trend="184 reviews" icon={Star} />
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-base font-semibold">Earnings · last 6 months</h2>
          <div className="text-right">
            <div className="eyebrow">Total earned</div>
            <div className="font-display mt-1 text-2xl font-bold">${totalEarnings.toFixed(1)}K</div>
          </div>
        </div>
        <div className="flex h-40 items-end gap-3">
          {earningsData.map((data, idx) => (
            <div key={data.month} className="flex flex-1 flex-col items-center gap-2">
              <div className="font-mono text-[10px] text-muted-foreground">${data.value}K</div>
              <div
                className={`w-full rounded-t-lg transition-default ${
                  idx === earningsData.length - 1
                    ? "bg-primary"
                    : "bg-primary/20 hover:bg-primary/40"
                }`}
                style={{ height: `${data.percent * 1.1}px` }}
              />
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {data.month}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
            <h2 className="font-display text-base font-semibold">Active orders</h2>
            <Link to="/orders" className="text-xs font-medium text-primary transition-default hover:text-primary/80">View all</Link>
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
                  <span className="flex items-center gap-1"><Clock className="size-3" /> Due {order.dueDate}</span>
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
                Applications ({applicationCount})
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`touch-target shrink-0 rounded-lg px-4 text-sm font-medium transition-default ${
                  activeTab === "reviews" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Reviews ({reviewCount})
              </button>
              </div>
              <Link to="/applications" className="shrink-0 text-xs font-medium text-primary hover:underline">View all</Link>
            </div>
          </div>
          <div className="max-h-96 divide-y divide-border overflow-y-auto">
            {activeTab === "applications" && applications.map((app) => (
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
            {activeTab === "reviews" && reviews.length === 0 && (
              <EmptyState
                compact
                icon={Star}
                title="No reviews yet"
                description="Complete your first project to start collecting client feedback."
              />
            )}
            {activeTab === "reviews" && reviews.map((review) => (
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

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Job Completion Rate" value="98%" />
        <MetricCard label="Response Time" value="< 1h" />
        <MetricCard label="Repeat Clients" value="64%" />
      </div>
    </WorkspaceShell>
  );
}

function StatCard({
  label, value, trend, icon: Icon,
}: {
  label: string; value: string; trend: string; icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-default hover:border-primary/20">
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
