import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { ChevronRight, Briefcase, Archive } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { ApplicationStatusBadge } from "@/components/site/trust";
import { EmptyState } from "@/components/site/feedback";
import { ConversionFlowBanner, FREELANCER_HIRE_FLOW } from "@/components/site/conversion-flow";
import { requireRole } from "@/lib/guards";
import {
  getAllApplications,
  subscribeApplications,
  archiveApplication,
} from "@/lib/applications-store";
import type { Application } from "@/lib/mock-data";

export const Route = createFileRoute("/applications/")({
  beforeLoad: requireRole(["freelancer"]),
  head: () => ({ meta: [{ title: "My Applications — Ishbor" }] }),
  component: ApplicationsPage,
});

const tabs = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "archived", label: "Archived" },
] as const;

function filterByTab(apps: Application[], tab: (typeof tabs)[number]["key"]) {
  const active = apps.filter((a) => !a.archived);
  switch (tab) {
    case "pending":
      return active.filter((a) => a.status === "pending" || a.status === "shortlisted");
    case "accepted":
      return active.filter((a) => a.status === "accepted");
    case "rejected":
      return active.filter((a) => a.status === "rejected");
    case "archived":
      return apps.filter((a) => a.archived);
  }
}

function ApplicationsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("pending");
  const applications = useSyncExternalStore(subscribeApplications, getAllApplications, getAllApplications);
  const filtered = filterByTab(applications, tab);

  return (
    <WorkspaceShell eyebrow="Freelancer workspace" title="My applications">
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
            <span className="ml-1.5 font-mono text-[10px] opacity-70">
              {filterByTab(applications, t.key).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={`No ${tab} applications`}
          description={
            tab === "archived"
              ? "Rejected applications you archive will appear here."
              : "Browse projects and submit proposals to get started."
          }
          action={
            tab === "archived" ? undefined : (
              <Link to="/projects" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Browse projects
              </Link>
            )
          }
        />
      ) : (
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
          {filtered.map((app) => (
            <ApplicationRow key={app.id} app={app} showArchive={tab === "rejected"} />
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}

function ApplicationRow({ app, showArchive }: { app: Application; showArchive?: boolean }) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-6">
      <Link
        to="/applications/$id"
        params={{ id: app.id }}
        className="flex min-w-0 flex-1 items-start gap-3 transition-default hover:opacity-90"
      >
        <GradientAvatar name={app.client} hue={app.clientHue} size={40} rounded="rounded-lg" />
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-semibold">{app.projectTitle}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {app.clientSlug ? (
              <span className="font-medium text-primary">{app.client}</span>
            ) : (
              <span>{app.client}</span>
            )}
            <span>·</span>
            <span>{app.category}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{app.coverNote}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ApplicationStatusBadge status={app.status} />
            <span className="font-mono text-[10px] text-muted-foreground">Submitted {app.submittedAgo}</span>
          </div>
          {app.projectSlug && (
            <span className="mt-2 inline-block text-xs font-medium text-primary">
              View project →
            </span>
          )}
        </div>
      </Link>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Proposal</div>
          <div className="font-display text-lg font-bold">${(app.proposalAmount ?? app.budget).toLocaleString()}</div>
          {app.deliveryTime && (
            <div className="text-xs text-muted-foreground">Delivery: {app.deliveryTime}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showArchive && (
            <button
              type="button"
              onClick={() => archiveApplication(app.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-medium hover:border-primary/20"
            >
              <Archive className="size-3" /> Archive
            </button>
          )}
          <Link to="/applications/$id" params={{ id: app.id }}>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </div>
  );
}
