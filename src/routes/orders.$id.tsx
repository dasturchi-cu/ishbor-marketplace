import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Clock, MessageCircle } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { OrderStatusBadge, EscrowFundedBadge } from "@/components/site/trust";
import { requireAuth } from "@/lib/guards";
import { getOrder, getEscrowByOrderId } from "@/lib/mock-data";

export const Route = createFileRoute("/orders/$id")({
  beforeLoad: requireAuth,
  loader: ({ params }) => {
    const order = getOrder(params.id);
    if (!order) throw notFound();
    return { order };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.order.title ?? "Order"} — Ishbor` }],
  }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { order } = Route.useLoaderData();
  const escrow = getEscrowByOrderId(order.id);

  return (
    <WorkspaceShell
      eyebrow="Order detail"
      title={order.title}
      actions={
        <Link to="/messages" className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium hover:border-primary/20">
          <MessageCircle className="size-4" /> Message
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={order.status} />
              {order.escrowFunded && <EscrowFundedBadge />}
            </div>
            <div className="mt-4 h-2 rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${order.progress}%` }} />
            </div>
            <p className="mt-2 font-mono text-xs text-muted-foreground">{order.progress}% complete · Due {order.dueDate}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display font-semibold">Milestones</h2>
            <div className="mt-4 space-y-3">
              {order.milestones.map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`size-2 rounded-full ${m.done ? "bg-success" : "bg-muted-foreground/30"}`} />
                    <span className="text-sm">{m.label}</span>
                  </div>
                  <span className="font-mono text-sm">${m.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Amount</div>
            <div className="font-display mt-1 text-2xl font-bold">${order.amount.toLocaleString()}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="font-mono mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">Parties</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <GradientAvatar name={order.client} hue={order.clientHue} size={36} />
                <div>
                  <div className="text-xs text-muted-foreground">Client</div>
                  {order.clientSlug ? (
                    <Link to="/clients/$company" params={{ company: order.clientSlug }} className="text-sm font-medium text-primary hover:underline">
                      {order.client}
                    </Link>
                  ) : (
                    <div className="text-sm font-medium">{order.client}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GradientAvatar name={order.freelancer} hue={order.freelancerHue} size={36} />
                <div>
                  <div className="text-xs text-muted-foreground">Freelancer</div>
                  {order.freelancerUsername ? (
                    <Link to="/freelancers/$username" params={{ username: order.freelancerUsername }} className="text-sm font-medium text-primary hover:underline">
                      {order.freelancer}
                    </Link>
                  ) : (
                    <div className="text-sm font-medium">{order.freelancer}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {escrow && (
            <Link
              to="/escrow/$id"
              params={{ id: escrow.id }}
              className="block rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center text-sm font-medium text-primary hover:bg-primary/8"
            >
              View escrow workflow
            </Link>
          )}
        </aside>
      </div>
    </WorkspaceShell>
  );
}
