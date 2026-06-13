import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { MessageCircle } from "lucide-react";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import { LoadingSpinner } from "@/components/site/feedback";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { OrderStatusBadge, EscrowFundedBadge } from "@/components/site/trust";
import { ReviewForm } from "@/components/reviews/review-form";
import { requireAuth } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { getSession } from "@/lib/auth";
import { getOrder, getEscrowByOrderId } from "@/lib/mock-data";
import { getOrderById, subscribeOrders } from "@/lib/orders-store";
import { getEscrowByOrderId as getStoredEscrowByOrderId } from "@/lib/escrow-store";
import { hasUserReviewedOrder, getReviewsForOrder, getOrderReviewDirection } from "@/lib/reviews-store";
import { EntityNotFound } from "@/components/site/entity-not-found";

function canAccessOrder(order: ReturnType<typeof getOrderById>, session: ReturnType<typeof getSession>) {
  if (!order || !session) return false;
  if (order.ownerUserId && order.ownerUserId === session.user.id) return true;
  if (order.freelancerUsername && order.freelancerUsername === session.user.username) return true;
  if (order.clientSlug && order.clientSlug === session.user.companySlug) return true;
  if (order.client === session.user.fullName || order.client === session.user.company) return true;
  return false;
}

export const Route = createFileRoute("/orders/$id")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Buyurtma — Ishbor" }] }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const hydrated = useClientHydrated();
  const order = useSyncExternalStore(
    subscribeOrders,
    () => {
      if (!hydrated) return undefined;
      return getOrderById(id) ?? getOrder(id);
    },
    () => undefined,
  );
  const { user, session } = useAuth();
  const [reviewed, setReviewed] = useState(false);

  if (!hydrated || order === undefined) {
    return (
      <WorkspaceShell eyebrow="Buyurtma" title="Yuklanmoqda…">
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </WorkspaceShell>
    );
  }

  if (!order || !session || !canAccessOrder(order, session)) {
    return (
      <EntityNotFound
        title="Buyurtma topilmadi"
        description="Bu buyurtma mavjud emas yoki sizda ko'rish huquqi yo'q."
        backTo="/orders"
        backLabel="Buyurtmalarga qaytish"
        compact
      />
    );
  }

  const escrow = getStoredEscrowByOrderId(order.id) ?? getEscrowByOrderId(order.id);
  const direction = user ? getOrderReviewDirection(user, order) : null;
  const showReview =
    user &&
    direction &&
    order.status === "completed" &&
    !hasUserReviewedOrder(order.id, direction) &&
    !reviewed;

  const orderReviews = getReviewsForOrder(order.id);

  return (
    <WorkspaceShell
      eyebrow="Buyurtma tafsilotlari"
      title={order.title}
      actions={
        <Link to="/messages" className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium hover:border-primary/20">
          <MessageCircle className="size-4" /> Xabar yozish
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
            <p className="mt-2 font-mono text-xs text-muted-foreground">{order.progress}% bajarildi · Muddat: {order.dueDate}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display font-semibold">Bosqichlar</h2>
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

          {showReview && user && (
            <ReviewForm
              orderId={order.id}
              project={order.title}
              direction={direction}
              from={user.fullName}
              fromHue={user.avatarHue}
              fromUsername={user.username}
              freelancerUsername={order.freelancerUsername}
              toCompany={order.clientSlug ?? user.companySlug}
              onSubmitted={() => setReviewed(true)}
            />
          )}

          {orderReviews.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display font-semibold">Sharhlar</h2>
              <div className="mt-4 space-y-3">
                {orderReviews.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.from}</span>
                      <span className="font-mono text-xs text-muted-foreground">{r.date}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                    <div className="mt-1 font-mono text-xs text-gold">{"★".repeat(r.rating)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Summa</div>
            <div className="font-display mt-1 text-2xl font-bold">${order.amount.toLocaleString()}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="font-mono mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">Tomonlar</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <GradientAvatar name={order.client} hue={order.clientHue} size={36} />
                <div>
                  <div className="text-xs text-muted-foreground">Mijoz</div>
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
                  <div className="text-xs text-muted-foreground">Frilanser</div>
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
              Eskrou jarayonini ko'rish
            </Link>
          )}
        </aside>
      </div>
    </WorkspaceShell>
  );
}
