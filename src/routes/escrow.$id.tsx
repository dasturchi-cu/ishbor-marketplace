import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Lock, CheckCircle2, CircleAlert, Info } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { ReleaseFundsModal, EscrowActionModal } from "@/components/site/modals";
import { requireAuth } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { getSession } from "@/lib/auth";
import { resolveFreelancerUserId } from "@/lib/auth";
import { getEscrowWorkflow, getOrder } from "@/lib/mock-data";
import { getOrderById } from "@/lib/orders-store";
import { processEscrowMilestoneRelease } from "@/lib/wallet-store";
import { addNotification } from "@/lib/notifications-store";
import {
  getEscrowWorkflowById,
  releaseEscrowMilestone,
  openEscrowDispute,
  subscribeEscrow,
} from "@/lib/escrow-store";
import { EntityNotFound } from "@/components/site/entity-not-found";

function canAccessEscrow(
  escrow: NonNullable<ReturnType<typeof getEscrowWorkflowById>>,
  session: ReturnType<typeof getSession>,
) {
  if (!session) return false;
  const order = getOrderById(escrow.orderId) ?? getOrder(escrow.orderId);
  if (order?.ownerUserId === session.user.id) return true;
  if (order?.freelancerUsername === session.user.username) return true;
  if (order?.clientSlug && order.clientSlug === session.user.companySlug) return true;
  if (order?.client === session.user.fullName || order?.client === session.user.company) return true;
  if (escrow.client === session.user.fullName || escrow.client === session.user.company) return true;
  if (escrow.freelancer === session.user.fullName) return true;
  return false;
}

export const Route = createFileRoute("/escrow/$id")({
  beforeLoad: requireAuth,
  loader: ({ params }) => {
    const escrow = getEscrowWorkflowById(params.id) ?? getEscrowWorkflow(params.id);
    if (!escrow) throw notFound();
    if (typeof window !== "undefined") {
      const session = getSession();
      if (!session || !canAccessEscrow(escrow, session)) throw notFound();
    }
    return { escrow };
  },
  notFoundComponent: () => (
    <EntityNotFound
      title="Eskrou topilmadi"
      description="Bu eskrou jarayoni mavjud emas yoki sizda ko'rish huquqi yo'q."
      backTo="/escrow"
      backLabel="Eskrou ro'yxatiga qaytish"
      compact
    />
  ),
  component: EscrowDetailPage,
});

const escrowStatusLabels: Record<string, string> = {
  active: "Faol",
  funded: "Moliyalashtirilgan",
  disputed: "Nizo ochiq",
  completed: "Yakunlangan",
  released: "Chiqarilgan",
};

const milestoneStatusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  funded: "Moliyalashtirilgan",
  released: "Chiqarilgan",
  disputed: "Nizo ochiq",
};

function EscrowDetailPage() {
  const { id } = Route.useParams();
  const { user, session } = useAuth();
  const { escrow: loaderEscrow } = Route.useLoaderData();
  const escrow = useSyncExternalStore(
    subscribeEscrow,
    () => getEscrowWorkflowById(id) ?? loaderEscrow,
    () => loaderEscrow,
  );
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  if (!session || !escrow || !canAccessEscrow(escrow, session)) {
    return (
      <EntityNotFound
        title="Eskrou topilmadi"
        description="Bu eskrou jarayoni mavjud emas yoki sizda ko'rish huquqi yo'q."
        backTo="/escrow"
        backLabel="Eskrou ro'yxatiga qaytish"
        compact
      />
    );
  }

  const fundedMilestone = escrow.milestones.find((m) => m.status === "funded");

  return (
    <WorkspaceShell
      eyebrow="Eskrou jarayoni"
      title={escrow.project}
      actions={
        <div className="flex gap-2">
          {fundedMilestone && (
            <button
              onClick={() => setReleaseOpen(true)}
              className="touch-target rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Mablag'ni chiqarish
            </button>
          )}
          {escrow.status === "disputed" ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2 text-xs font-medium text-destructive">
              <CircleAlert className="size-3.5" /> Nizo ochiq
            </span>
          ) : (
            <button
              onClick={() => setDisputeOpen(true)}
              className="touch-target rounded-lg border border-border px-4 text-sm font-medium hover:border-destructive/30"
            >
              Nizo ochish
            </button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-3 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">Eskrou qanday ishlaydi</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  To'lovingiz ish yetkazilgunga qadar xavfsiz ushlab turiladi. Har bir yetkazishni tasdiqlaganingizdan keyin mablag'ni bosqichma-bosqich chiqaring. Muammo bo'lsa, nizo oching — Ishbor hal qilgunga qadar mablag' muzlatilgan holda qoladi.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Lock className="size-4 text-primary" />
              <span className="font-semibold">${escrow.amount.toLocaleString()}</span>
              <span className="text-muted-foreground">eskrouda saqlanmoqda · Holat: {escrowStatusLabels[escrow.status] ?? escrow.status}</span>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display font-semibold">Bosqichlar</h2>
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
                    <div className="text-[10px] uppercase text-muted-foreground">{milestoneStatusLabels[m.status] ?? m.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display font-semibold">Faoliyat vaqt chizig'i</h2>
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
            <div className="font-mono mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">Tomonlar</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <GradientAvatar name={escrow.client} hue={escrow.clientHue} size={36} />
                <div><div className="text-xs text-muted-foreground">Mijoz</div><div className="text-sm font-medium">{escrow.client}</div></div>
              </div>
              <div className="flex items-center gap-3">
                <GradientAvatar name={escrow.freelancer} hue={escrow.freelancerHue} size={36} />
                <div><div className="text-xs text-muted-foreground">Frilanser</div><div className="text-sm font-medium">{escrow.freelancer}</div></div>
              </div>
            </div>
          </div>
          <Link to="/orders/$id" params={{ id: escrow.orderId }} className="block text-center text-sm font-medium text-primary hover:underline">
            Buyurtmani ko'rish
          </Link>
        </aside>
      </div>

      {fundedMilestone && (
        <ReleaseFundsModal
          open={releaseOpen}
          onClose={() => setReleaseOpen(false)}
          amount={fundedMilestone.amount}
          milestone={fundedMilestone.label}
          onConfirm={() => {
            releaseEscrowMilestone(escrow.id, fundedMilestone.label);
            const order = getOrderById(escrow.orderId);
            const freelancerUsername = order?.freelancerUsername;
            if (user?.id && freelancerUsername) {
              processEscrowMilestoneRelease(
                user.id,
                resolveFreelancerUserId(freelancerUsername),
                fundedMilestone.amount,
                escrow.project,
              );
              addNotification({
                userId: user.id,
                kind: "escrow",
                title: "To'lov chiqarildi",
                body: `$${fundedMilestone.amount.toLocaleString()} ${fundedMilestone.label} uchun chiqarildi`,
                priority: "normal",
                href: `/escrow/${escrow.id}`,
              });
              addNotification({
                userId: resolveFreelancerUserId(freelancerUsername),
                kind: "payment",
                title: "Bosqich to'lovi qabul qilindi",
                body: `${escrow.project} loyihasidan $${fundedMilestone.amount.toLocaleString()}`,
                priority: "high",
                href: `/wallet`,
              });
            }
            toast.success("Mablag' frilanserga chiqarildi");
          }}
        />
      )}
      <EscrowActionModal
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        mode="dispute"
        amount={escrow.amount}
        project={escrow.project}
        onConfirm={() => {
          openEscrowDispute(escrow.id);
          toast.success("Nizo ochildi — Ishbor vositachiligi siz bilan bog'lanadi");
        }}
      />
    </WorkspaceShell>
  );
}
