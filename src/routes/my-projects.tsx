import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  Plus,
  FolderOpen,
  Pause,
  Play,
  Trash2,
  Pencil,
  XCircle,
  Users,
  ChevronRight,
} from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { EmptyState } from "@/components/site/feedback";
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

export const Route = createFileRoute("/my-projects")({
  beforeLoad: requireRole(["client"]),
  head: () => ({ meta: [{ title: "My Projects — Ishbor" }] }),
  component: MyProjectsPage,
});

const statusLabels: Record<ProjectStatus, string> = {
  draft: "Draft",
  published: "Open",
  paused: "Paused",
  closed: "Closed",
};

function MyProjectsPage() {
  const { user } = useAuth();
  const projects = useSyncExternalStore(
    subscribeProjects,
    () => getMyProjects(user!.id),
    () => getMyProjects(user!.id),
  );

  return (
    <WorkspaceShell
      eyebrow="Client workspace"
      title="My projects"
      actions={
        <Link
          to="/projects/create"
          className="touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground sm:w-auto"
        >
          <Plus className="size-4" /> Post a project
        </Link>
      }
    >
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Post your first project"
          description="Create a project to start receiving proposals from verified freelancers."
          action={
            <Link
              to="/projects/create"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Post your first project
            </Link>
          }
        />
      ) : (
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {projects.map((p) => (
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
    toast.success(next === "paused" ? "Project paused" : "Project resumed");
  };

  const handleClose = () => {
    updateProjectStatus(p.slug, "closed");
    toast.success("Project closed");
  };

  const handleDelete = () => {
    if (deleteProject(p.slug)) {
      toast.success("Project deleted");
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
                <Users className="size-3" /> {pendingApps} proposals
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
            <span>Budget: ${p.budget.toLocaleString()}{p.budgetType === "hourly" ? "/hr" : ""}</span>
            <span>Duration: {p.duration}</span>
            <span>Posted: {p.postedAgo}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
          {status !== "closed" && (
            <Link
              to="/projects/create"
              search={{ edit: p.slug }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/20"
            >
              <Pencil className="size-3.5" /> Edit
            </Link>
          )}
          {status === "published" || status === "paused" ? (
            <button
              type="button"
              onClick={handlePause}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/20"
            >
              {status === "paused" ? (
                <><Play className="size-3.5" /> Resume</>
              ) : (
                <><Pause className="size-3.5" /> Pause</>
              )}
            </button>
          ) : null}
          {status !== "closed" && status !== "draft" && (
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/20"
            >
              <XCircle className="size-3.5" /> Close
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="size-3.5" /> Delete
          </button>
          <Link
            to="/projects/$slug"
            params={{ slug: p.slug }}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View detail <ChevronRight className="size-3.5" />
          </Link>
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
