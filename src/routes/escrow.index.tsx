import { createFileRoute, Link } from "@tanstack/react-router";

import { Lock, ChevronRight, ClipboardList, ShieldCheck } from "lucide-react";

import { WorkspaceShell } from "@/components/site/workspace-shell";

import { EmptyState, InlineBanner } from "@/components/site/feedback";

import { escrowWorkflows } from "@/lib/mock-data";

const escrowStatusLabels: Record<string, string> = {
  funded: "Moliyalashtirilgan",
  pending_release: "Chiqarish kutilmoqda",
  disputed: "Nizo ochilgan",
  released: "Chiqarilgan",
  draft: "Qoralama",
};



export const Route = createFileRoute("/escrow/")({

  head: () => ({ meta: [{ title: "Eskrou — Ishbor" }] }),

  component: EscrowListPage,

});



function EscrowListPage() {

  return (

    <WorkspaceShell

      eyebrow="Xazina"

      title="Eskrou"

      actions={

        <Link to="/orders" className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium hover:border-primary/20">

          <ClipboardList className="size-4" /> Buyurtmalarni ko'rish

        </Link>

      }

    >

      {escrowWorkflows.length === 0 ? (

        <EmptyState

          icon={Lock}

          title="Eskrou shartnomalar yo'q"

          description="Frilanserni yollaganingizda mablag'lar eskrou orqali himoyalanadi. Buyurtma yaratilgandan keyin shartnomalar shu yerda ko'rinadi."

          action={

            <div className="flex flex-wrap justify-center gap-2">

              <Link to="/projects/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">

                Loyiha joylash

              </Link>

              <Link to="/orders" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary/30">

                Buyurtmalarni ko'rish

              </Link>

            </div>

          }

        />

      ) : (
        <>
        <InlineBanner variant="info" icon={ShieldCheck} className="mb-4">
          <span className="font-semibold">Eskrou himoyasi.</span>{" "}
          <span className="text-muted-foreground">
            Mablag'lar ish bajarilgunga qadar himoyalangan hisobda saqlanadi. Frilanser faqat mijoz tasdig'idan keyin to'lov oladi.
          </span>
        </InlineBanner>
        <div className="space-y-4">

          {escrowWorkflows.map((ew) => (

            <Link

              key={ew.id}

              to="/escrow/$id"

              params={{ id: ew.id }}

              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-default hover:border-primary/20 hover:shadow-md sm:flex-row sm:items-center"

            >

              <div className="min-w-0 flex-1">

                <div className="font-display text-sm font-semibold">{ew.project}</div>

                <div className="mt-1 text-xs text-muted-foreground">{ew.client} · {ew.freelancer}</div>

                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">

                  <Lock className="size-3" /> {escrowStatusLabels[ew.status] ?? ew.status}

                </div>

              </div>

              <div className="flex items-center gap-3">

                <div className="text-right">

                  <div className="font-display text-lg font-bold">${ew.amount.toLocaleString()}</div>

                  <div className="text-xs text-muted-foreground">{ew.milestones.filter((m) => m.status === "funded").length} bosqich moliyalashtirilgan</div>

                </div>

                <ChevronRight className="size-4 text-muted-foreground" />

              </div>

            </Link>

          ))}

        </div>
        </>
      )}

    </WorkspaceShell>

  );

}

