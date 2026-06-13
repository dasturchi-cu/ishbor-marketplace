import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChevronRight, Briefcase } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { ApplicationStatusBadge } from "@/components/site/trust";
import { EmptyState } from "@/components/site/feedback";
import { ConversionFlowBanner, FREELANCER_HIRE_FLOW } from "@/components/site/conversion-flow";
import { requireAuth } from "@/lib/guards";
import { getAllApplications } from "@/lib/applications-store";

export const Route = createFileRoute("/applications")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Applications — Ishbor" }] }),
  component: ApplicationsPage,
});

const tabs = [
  { key: "pending", label: "Pending", status: "pending" },
  { key: "shortlisted", label: "Shortlisted", status: "shortlisted" },
  { key: "accepted", label: "Accepted", status: "accepted" },
  { key: "rejected", label: "Rejected", status: "rejected" },
] as const;

function ApplicationsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("pending");
  const [applications, setApplications] = useState(() => getAllApplications());

  useEffect(() => {
    setApplications(getAllApplications());
  }, [tab]);

  const current = tabs.find((t) => t.key === tab)!;
  const filtered = applications.filter((a) => a.status === current.status);

  return (
    <WorkspaceShell eyebrow="Freelancer workspace" title="Applications">
      <ConversionFlowBanner
        title="Getting hired"
        steps={FREELANCER_HIRE_FLOW}
        currentStep="application"
        nextHint="Track proposal status here. When accepted, the client funds escrow and your order begins."
        className="mb-6"
      />
      <div className="mobile-scroll-x flex gap-2 border-b border-border pb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`touch-target shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-default ${
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={`No ${current.label.toLowerCase()} applications`}
          description="Browse projects and submit proposals to get started."
          action={
            <Link to="/projects" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Browse projects
            </Link>
          }
        />
      ) : (
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
          {filtered.map((app) => (
            <Link
              key={app.id}
              to="/applications/$id"
              params={{ id: app.id }}
              className="flex flex-col gap-3 p-4 transition-default hover:bg-secondary/20 sm:flex-row sm:items-center sm:p-6"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <GradientAvatar name={app.client} hue={app.clientHue} size={40} rounded="rounded-lg" />
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-semibold">{app.projectTitle}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{app.client} · {app.category}</div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{app.coverNote}</p>
                  <div className="mt-2">
                    <ApplicationStatusBadge status={app.status} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <div className="text-right">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Proposal</div>
                  <div className="font-display text-lg font-bold">${(app.proposalAmount ?? app.budget).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Submitted {app.submittedAgo}</div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}
