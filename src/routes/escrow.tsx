import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { ReleaseFundsModal } from "@/components/site/modals";
import { requireAuth } from "@/lib/guards";
import { escrowWorkflows } from "@/lib/mock-data";

export const Route = createFileRoute("/escrow")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Escrow — Ishbor" }] }),
  component: EscrowListPage,
});

function EscrowListPage() {
  return (
    <WorkspaceShell eyebrow="Treasury" title="Escrow">
      <div className="space-y-4">
        {escrowWorkflows.map((ew) => (
          <Link
            key={ew.id}
            to="/escrow/$id"
            params={{ id: ew.id }}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-default hover:border-primary/20 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-semibold">{ew.project}</div>
              <div className="mt-1 text-xs text-muted-foreground">{ew.client} · {ew.freelancer}</div>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
                <Lock className="size-3" /> {ew.status.replace("_", " ")}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-display text-lg font-bold">${ew.amount.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{ew.milestones.filter((m) => m.status === "funded").length} milestones funded</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </WorkspaceShell>
  );
}
