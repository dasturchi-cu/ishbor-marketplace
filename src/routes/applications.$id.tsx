import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { ApplicationStatusBadge } from "@/components/site/trust";
import { requireAuth } from "@/lib/guards";
import { getApplication } from "@/lib/mock-data";

export const Route = createFileRoute("/applications/$id")({
  beforeLoad: requireAuth,
  loader: ({ params }) => {
    const app = getApplication(params.id);
    if (!app) throw notFound();
    return { app };
  },
  component: ApplicationDetailPage,
});

const timelineSteps = ["Submitted", "Under review", "Shortlisted", "Accepted", "Contract signed"];

function ApplicationDetailPage() {
  const { app } = Route.useLoaderData();
  const stepIndex =
    app.status === "pending" ? 1 :
    app.status === "shortlisted" ? 2 :
    app.status === "accepted" ? 3 :
    app.status === "rejected" ? 1 : 0;

  return (
    <WorkspaceShell eyebrow="Application" title={app.projectTitle}>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <ApplicationStatusBadge status={app.status} />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{app.coverNote}</p>
            {app.projectSlug && (
              <Link to="/projects/$slug" params={{ slug: app.projectSlug }} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                View project posting
              </Link>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display font-semibold">Status timeline</h2>
            <div className="mt-4 space-y-3">
              {timelineSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <span className={`size-2.5 rounded-full ${i <= stepIndex ? "bg-primary" : "bg-muted-foreground/20"}`} />
                  <span className={`text-sm ${i <= stepIndex ? "font-medium" : "text-muted-foreground"}`}>{step}</span>
                  {i === 0 && <span className="ml-auto text-xs text-muted-foreground">{app.submittedAgo}</span>}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Proposal amount</div>
            <div className="font-display mt-1 text-2xl font-bold">${(app.proposalAmount ?? app.budget).toLocaleString()}</div>
            <div className="mt-1 text-xs text-muted-foreground">Budget: ${app.budget.toLocaleString()}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="font-mono mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">Client</div>
            <div className="flex items-center gap-3">
              <GradientAvatar name={app.client} hue={app.clientHue} size={40} />
              {app.clientSlug ? (
                <Link to="/clients/$company" params={{ company: app.clientSlug }} className="text-sm font-medium text-primary hover:underline">
                  {app.client}
                </Link>
              ) : (
                <span className="text-sm font-medium">{app.client}</span>
              )}
            </div>
          </div>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
