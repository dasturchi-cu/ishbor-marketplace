import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Clock, ChevronRight, ClipboardList } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { OrderStatusBadge, EscrowFundedBadge } from "@/components/site/trust";
import { EmptyState } from "@/components/site/feedback";
import type { Order } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import { getAllOrders, subscribeOrders } from "@/lib/orders-store";
import {
  IncrementalListFooter,
} from "@/components/site/incremental-list-footer";
import { useIncrementalList, WORKSPACE_PAGE_SIZE } from "@/hooks/use-incremental-list";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "Buyurtmalar — Ishbor" }] }),
  component: OrdersPage,
});

const tabs: { key: string; label: string; emptyLabel: string; statuses: Order["status"][] }[] = [
  { key: "active", label: "Faol", emptyLabel: "faol", statuses: ["in_progress"] },
  { key: "review", label: "Ko'rib chiqilmoqda", emptyLabel: "ko'rib chiqilayotgan", statuses: ["review", "revision"] },
  { key: "completed", label: "Yakunlangan", emptyLabel: "yakunlangan", statuses: ["completed"] },
  { key: "cancelled", label: "Bekor qilingan", emptyLabel: "bekor qilingan", statuses: ["cancelled", "disputed"] },
];

function OrdersPage() {
  const { session } = useAuth();
  const { activeRole } = useActiveRole();
  const [tab, setTab] = useState("active");
  const allOrders = useSyncExternalStore(subscribeOrders, getAllOrders, getAllOrders);

  const userOrders = useMemo(() => {
    if (!session) return allOrders;
    const { id, username, companySlug, fullName, company } = session.user;
    return allOrders.filter(
      (o) =>
        o.ownerUserId === id ||
        (username && o.freelancerUsername === username) ||
        (companySlug && o.clientSlug === companySlug) ||
        o.client === fullName ||
        (company && o.client === company),
    );
  }, [allOrders, session]);

  const current = tabs.find((t) => t.key === tab)!;
  const filtered = userOrders.filter((o) => current.statuses.includes(o.status));
  const { visible, hasMore, loadMore, showing, total } = useIncrementalList(
    filtered,
    WORKSPACE_PAGE_SIZE,
    tab,
  );

  return (
    <WorkspaceShell eyebrow="Ish maydoni" title="Buyurtmalar">
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
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={`${current.emptyLabel} buyurtmalar yo'q`}
          description="Ish yollagan yoki bajarganingizda buyurtmalar shu yerda paydo bo'ladi."
          action={
            activeRole === "client" ? (
              <Link to="/projects/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Loyiha joylash
              </Link>
            ) : (
              <Link to="/projects" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Ish topish
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
            {visible.map((order) => (
              <Link
                key={order.id}
                to="/orders/$id"
                params={{ id: order.id }}
                className="flex flex-col gap-3 p-4 transition-default hover:bg-secondary/20 sm:flex-row sm:items-center sm:p-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <GradientAvatar name={order.freelancer} hue={order.freelancerHue} size={44} rounded="rounded-lg" />
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-semibold">{order.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {order.client} → {order.freelancer}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <OrderStatusBadge status={order.status} />
                      {order.escrowFunded && <EscrowFundedBadge />}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <div className="text-right">
                    <div className="font-display text-lg font-bold">${order.amount.toLocaleString()}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> Muddat: {order.dueDate}
                    </div>
                  </div>
                  <div className="hidden w-24 sm:block">
                    <div className="h-1.5 rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${order.progress}%` }} />
                    </div>
                    <div className="mt-1 text-center font-mono text-[10px] text-muted-foreground">{order.progress}%</div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
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
