import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { ChevronRight, Briefcase, Archive } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { ApplicationStatusBadge } from "@/components/site/trust";
import { EmptyState, confirmDestructive } from "@/components/site/feedback";
import { ConversionFlowBanner, FREELANCER_HIRE_FLOW } from "@/components/site/conversion-flow";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireRole } from "@/lib/guards";
import {
  getAllApplications,
  subscribeApplications,
  archiveApplication,
} from "@/lib/applications-store";
import type { Application } from "@/lib/mock-data";
import { IncrementalListFooter } from "@/components/site/incremental-list-footer";
import { useIncrementalList, WORKSPACE_PAGE_SIZE } from "@/hooks/use-incremental-list";
import { useAuth } from "@/hooks/use-auth";
import { WorkspaceGuidance } from "@/components/ux/workspace-guidance";

export const Route = createFileRoute("/applications/")({
  beforeLoad: requireRole(["freelancer"]),
  head: () => ({ meta: [{ title: "Mening arizalarim — Ishbor" }] }),
  component: () => (
    <ProtectedGate roles={["freelancer"]}>
      <ApplicationsPage />
    </ProtectedGate>
  ),
});

const tabs = [
  { key: "pending", label: "Kutilmoqda" },
  { key: "accepted", label: "Qabul qilingan" },
  { key: "rejected", label: "Rad etilgan" },
  { key: "archived", label: "Arxivlangan" },
] as const;

const tabEmptyLabels: Record<(typeof tabs)[number]["key"], string> = {
  pending: "kutilayotgan",
  accepted: "qabul qilingan",
  rejected: "rad etilgan",
  archived: "arxivlangan",
};

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
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("pending");
  const applications = useSyncExternalStore(subscribeApplications, getAllApplications, getAllApplications);
  const filtered = filterByTab(applications, tab);
  const { visible, hasMore, loadMore, showing, total } = useIncrementalList(
    filtered,
    WORKSPACE_PAGE_SIZE,
    tab,
  );

  return (
    <WorkspaceShell eyebrow="Frilanser ish maydoni" title="Mening arizalarim">
      <ConversionFlowBanner
        title="Ishga olinish"
        steps={FREELANCER_HIRE_FLOW}
        currentStep="application"
        nextHint="Taklif holatini shu yerda kuzating. Qabul qilinganda mijoz eskrouni moliyalashtiradi va buyurtma boshlanadi."
        className="mb-6"
      />
      {user && <WorkspaceGuidance user={user} hideNextAction />}
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
          title={`${tabEmptyLabels[tab]} arizalar yo'q`}
          description={
            tab === "archived"
              ? "Rad etilgan arizalarni arxivlaganingizda ular shu yerda ko'rinadi."
              : "Boshlash uchun loyihalarni ko'rib chiqing va taklif yuboring."
          }
          benefit={tab !== "archived" ? "AI taklif yordamchisi professional matn va narx tavsiya qiladi." : undefined}
          action={
            tab === "archived" ? undefined : (
              <Link to="/projects" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Loyihalarni ko'rish
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
            {visible.map((app) => (
              <ApplicationRow key={app.id} app={app} showArchive={tab === "rejected"} />
            ))}
          </div>
          <IncrementalListFooter
            hasMore={hasMore}
            showing={showing}
            total={total}
            onLoadMore={loadMore}
          />
        </>
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
            <span className="font-mono text-[10px] text-muted-foreground">Yuborilgan: {app.submittedAgo}</span>
          </div>
          {app.projectSlug && (
            <span className="mt-2 inline-block text-xs font-medium text-primary">
              Loyihani ko'rish →
            </span>
          )}
        </div>
      </Link>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Taklif</div>
          <div className="font-display text-lg font-bold">${(app.proposalAmount ?? app.budget).toLocaleString()}</div>
          {app.deliveryTime && (
            <div className="text-xs text-muted-foreground">Yetkazish: {app.deliveryTime}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showArchive && (
            <button
              type="button"
              onClick={() => {
                if (!confirmDestructive("Arizani arxivlashni tasdiqlaysizmi?")) return;
                archiveApplication(app.id);
                toast.success("Ariza arxivlandi");
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-medium hover:border-primary/20"
            >
              <Archive className="size-3" /> Arxivlash
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
