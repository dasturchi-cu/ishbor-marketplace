import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, CheckCircle2, CircleAlert } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { ReleaseFundsModal, EscrowActionModal } from "@/components/site/modals";
import { requireAuth } from "@/lib/guards";
import { getEscrowWorkflow } from "@/lib/mock-data";

export const Route = createFileRoute("/escrow/$id")({
  beforeLoad: requireAuth,
  loader: ({ params }) => {
    const escrow = getEscrowWorkflow(params.id);
    if (!escrow) throw notFound();
    return { escrow };
  },
  component: EscrowDetailPage,
});

function EscrowDetailPage() {
  const { escrow } = Route.useLoaderData();
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const fundedMilestone = escrow.milestones.find((m) => m.status === "funded");

  return (
    <WorkspaceShell
      eyebrow="Escrow workflow"
      title={escrow.project}
      actions={
        <div className="flex gap-2">
          {fundedMilestone && (
            <button
              onClick={() => setReleaseOpen(true)}
              className="touch-target rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Release funds
            </button>
          )}
          {escrow.status === "disputed" ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2 text-xs font-medium text-destructive">
              <CircleAlert className="size-3.5" /> Dispute open
            </span>
          ) : (
            <button
              onClick={() => setDisputeOpen(true)}
              className="touch-target rounded-lg border border-border px-4 text-sm font-medium hover:border-destructive/30"
            >
              Open dispute
            </button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="size-4 text-primary" />
              <span className="font-semibold">${escrow.amount.toLocaleString()}</span>
              <span className="text-muted-foreground">held in escrow · Status: {escrow.status}</span>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display font-semibold">Milestones</h2>
            <div className="mt-4 space-y-3">
              {escrow.milestones.map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    {m.status === "released" ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : m.status === "disputed" ? (
                      <CircleAlert className="size-4 text-destructive" />
                    ) : (
                      <Lock className="size-4 text-primary" />
                    )}
                    <span className="text-sm">{m.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">${m.amount.toLocaleString()}</div>
                    <div className="text-[10px] uppercase text-muted-foreground">{m.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display font-semibold">Activity timeline</h2>
            <div className="mt-4 space-y-3">
              {escrow.timeline.map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`size-2.5 rounded-full ${t.done ? "bg-primary" : "bg-muted-foreground/20"}`} />
                  <span className={`flex-1 text-sm ${t.done ? "font-medium" : "text-muted-foreground"}`}>{t.step}</span>
                  <span className="font-mono text-xs text-muted-foreground">{t.date}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="font-mono mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">Parties</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <GradientAvatar name={escrow.client} hue={escrow.clientHue} size={36} />
                <div><div className="text-xs text-muted-foreground">Client</div><div className="text-sm font-medium">{escrow.client}</div></div>
              </div>
              <div className="flex items-center gap-3">
                <GradientAvatar name={escrow.freelancer} hue={escrow.freelancerHue} size={36} />
                <div><div className="text-xs text-muted-foreground">Freelancer</div><div className="text-sm font-medium">{escrow.freelancer}</div></div>
              </div>
            </div>
          </div>
          <Link to="/orders/$id" params={{ id: escrow.orderId }} className="block text-center text-sm font-medium text-primary hover:underline">
            View order
          </Link>
        </aside>
      </div>

      {fundedMilestone && (
        <ReleaseFundsModal
          open={releaseOpen}
          onClose={() => setReleaseOpen(false)}
          amount={fundedMilestone.amount}
          milestone={fundedMilestone.label}
          onConfirm={() => toast.success("Funds released to freelancer")}
        />
      )}
      <EscrowActionModal
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        mode="dispute"
        amount={escrow.amount}
        project={escrow.project}
        onConfirm={() => toast.success("Dispute opened — Ishbor mediation will contact you")}
      />
    </WorkspaceShell>
  );
}
