import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore, useState, useEffect } from "react";
import { actionFeedback } from "@/lib/action-feedback";
import {
  Plus,
  FolderOpen,
  Pause,
  Play,
  Trash2,
  Pencil,
  XCircle,
  Users,
  Eye,
  Send,
} from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { EmptyState, confirmDestructive } from "@/components/site/feedback";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireRole } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import {
  getMyProjects,
  subscribeProjects,
  updateProjectStatus,
  deleteProject,
} from "@/lib/projects-store";
import { getApplicationsByProjectSlug } from "@/lib/applications-store";
import type { Project, ProjectStatus } from "@/lib/mock-data";
import { WorkspaceGuidance } from "@/components/ux/workspace-guidance";

export const Route = createFileRoute("/my-projects")({
  beforeLoad: requireRole(["client"]),
  head: () => ({ meta: [{ title: "Mening loyihalarim — Ishbor" }] }),
  component: () => (
    <ProtectedGate roles={["client"]}>
      <MyProjectsPage />
    </ProtectedGate>
  ),
});

const statusLabels: Record<ProjectStatus, string> = {
  draft: "Qoralama",
  published: "Ochiq",
  paused: "To'xtatilgan",
  closed: "Yopilgan",
};

const filterTabs = [
  { key: "all", label: "Barchasi" },
  { key: "draft", label: "Qoralamalar" },
  { key: "published", label: "Joylangan" },
  { key: "paused", label: "To'xtatilgan" },
  { key: "closed", label: "Yopilgan" },
] as const;

const EMPTY_PROJECTS: Project[] = [];

function parseTab(value: string): (typeof filterTabs)[number]["key"] {
  if (value === "draft" || value === "published" || value === "paused" || value === "closed") {
    return value;
  }
  return "all";
}

function MyProjectsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof filterTabs)[number]["key"]>("all");
  const ownerId = user?.id;
  const projects = useSyncExternalStore(
    subscribeProjects,
    () => (ownerId ? getMyProjects(ownerId) : EMPTY_PROJECTS),
    () => EMPTY_PROJECTS,
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab");
    if (urlTab) setTab(parseTab(urlTab));
  }, []);

  const filtered =
    tab === "all"
      ? projects
      : projects.filter((p) => (p.status ?? "published") === tab);

  const draftCount = projects.filter((p) => p.status === "draft").length;

  return (
    <WorkspaceShell
      eyebrow="Mijoz ish maydoni"
      title="Mening loyihalarim"
      actions={
        <Link
          to="/projects/create"
          className="touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground sm:w-auto"
        >
          <Plus className="size-4" /> Loyiha joylash
        </Link>
      }
    >
      {user && <WorkspaceGuidance user={user} hideNextAction />}

      {draftCount > 0 && tab !== "draft" && (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{draftCount} ta qoralama</span> saqlangan — davom etib joylashingiz mumkin.
          </p>
          <button
            type="button"
            onClick={() => setTab("draft")}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Qoralamalarni ko&apos;rish
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {filterTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`premium-tab rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            {t.label}
            <span className="ml-1.5 font-mono text-[10px] opacity-70">
              {t.key === "all"
                ? projects.length
                : projects.filter((p) => (p.status ?? "published") === t.key).length}
            </span>
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Birinchi loyihangizni joylang"
          description="Tekshirilgan frilanserlardan taklif olish uchun loyiha yarating."
          benefit="O'rtacha 24 soat ichida birinchi takliflar keladi."
          action={
            <Link
              to="/projects/create"
              className="touch-target rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={`${filterTabs.find((t) => t.key === tab)?.label} loyihalar yo'q`}
          description="Boshqa filtrni sinab ko'ring yoki yangi loyiha joylang."
          action={
            <Link to="/projects/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Loyiha joylash
            </Link>
          }
        />
      ) : (
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {filtered.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}

function ProjectRow({ project: p }: { project: Project }) {
  const status = p.status ?? "published";
  const apps = getApplicationsByProjectSlug(p.slug);
  const pendingApps = apps.filter((a) => a.status === "pending" || a.status === "shortlisted").length;

  const handlePause = () => {
    const next = status === "paused" ? "published" : "paused";
    updateProjectStatus(p.slug, next);
    actionFeedback.saved("Loyiha", next === "paused" ? "To'xtatildi" : "Davom ettirildi");
  };

  const handleYopish = () => {
    if (!confirmDestructive(`"${p.title}" loyihasini yopishni tasdiqlaysizmi?`)) return;
    updateProjectStatus(p.slug, "closed");
    actionFeedback.updated("Loyiha", "Yopildi");
  };

  const handleDelete = () => {
    if (!confirmDestructive(`"${p.title}" butunlay o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.`)) return;
    if (deleteProject(p.slug)) {
      actionFeedback.deleted("Loyiha");
    } else {
      actionFeedback.error("O'chirishda xato yuz berdi");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{p.category}</span>
            <StatusBadge status={status} />
            {pendingApps > 0 && status === "published" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Users className="size-3" /> {pendingApps} ta taklif
              </span>
            )}
          </div>
          <Link
            to="/projects/$slug"
            params={{ slug: p.slug }}
            className="font-display mt-2 block text-lg font-semibold hover:text-primary"
          >
            {p.title}
          </Link>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
          <div className="mt-3 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Byudjet: ${p.budget.toLocaleString()}{p.budgetType === "hourly" ? "/hr" : ""}</span>
            <span>Muddat: {p.duration}</span>
            <span>Joylangan: {p.postedAgo}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/projects/$slug"
            params={{ slug: p.slug }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/20"
          >
            <Eye className="size-3.5" /> Ko'rish
          </Link>
          {status === "draft" ? (
            <Link
              to="/projects/create"
              search={{ edit: p.slug }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:border-primary/40"
            >
              <Send className="size-3.5" /> Davom etish / Joylash
            </Link>
          ) : status !== "closed" ? (
            <Link
              to="/projects/create"
              search={{ edit: p.slug }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/20"
            >
              <Pencil className="size-3.5" /> Tahrirlash
            </Link>
          ) : null}
          {status === "published" || status === "paused" ? (
            <button
              type="button"
              onClick={handlePause}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/20"
            >
              {status === "paused" ? (
                <><Play className="size-3.5" /> Davom ettirish</>
              ) : (
                <><Pause className="size-3.5" /> To'xtatish</>
              )}
            </button>
          ) : null}
          {status !== "closed" && status !== "draft" && (
            <button
              type="button"
              onClick={handleYopish}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/20"
            >
              <XCircle className="size-3.5" /> Yopish
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="size-3.5" /> O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const tones: Record<ProjectStatus, string> = {
    draft: "bg-secondary text-muted-foreground",
    published: "bg-success/10 text-success",
    paused: "bg-gold/10 text-gold",
    closed: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${tones[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
