import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useSyncExternalStore, useEffect } from "react";
import { toast } from "sonner";
import {
  Bell,
  Banknote,
  FileCheck,
  Star,
  ShieldCheck,
  MessageSquare,
  CheckCheck,
  ChevronRight,
  Lock,
  ExternalLink,
  X,
  ClipboardList,
} from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { EmptyState, CardSkeleton } from "@/components/site/feedback";
import { requireAuth } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { AuthGate } from "@/components/auth/auth-gate";
import {
  subscribeNotifications,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  type AppNotification,
} from "@/lib/notifications-store";

export const Route = createFileRoute("/notifications")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Bildirishnomalar — Ishbor" }] }),
  component: NotificationsPage,
});

const iconConfig: Record<string, { icon: typeof Bell; bg: string; text: string }> = {
  payment: { icon: Banknote, bg: "bg-success/10", text: "text-success" },
  proposal: { icon: FileCheck, bg: "bg-primary/10", text: "text-primary" },
  review: { icon: Star, bg: "bg-[oklch(0.78_0.15_75)]/10", text: "text-[oklch(0.65_0.15_75)]" },
  system: { icon: ShieldCheck, bg: "bg-secondary", text: "text-muted-foreground" },
  message: { icon: MessageSquare, bg: "bg-primary/10", text: "text-primary" },
  escrow: { icon: Lock, bg: "bg-primary/10", text: "text-primary" },
  order: { icon: ClipboardList, bg: "bg-primary/10", text: "text-primary" },
  portfolio: { icon: Star, bg: "bg-primary/10", text: "text-primary" },
  admin: { icon: ShieldCheck, bg: "bg-secondary", text: "text-muted-foreground" },
};

const actionMap: Record<string, { primary?: string; secondary?: string }> = {
  payment: { primary: "Eskrouni ko'rish", secondary: "Yopish" },
  proposal: { primary: "Taklifni ko'rib chiqish", secondary: "Keyinroq" },
  review: { primary: "Sharhni ko'rish" },
  system: { primary: "Batafsil" },
  message: { primary: "Javob berish", secondary: "Yopish" },
  escrow: { primary: "Eskrouni ko'rish", secondary: "Yopish" },
  order: { primary: "Buyurtmani ko'rish", secondary: "Yopish" },
  portfolio: { primary: "Portfolioni ko'rish", secondary: "Yopish" },
};

const filters = ["Barchasi", "To'lovlar", "Takliflar", "Sharhlar", "Xabarlar", "Eskrou", "Buyurtmalar", "Portfolio", "Tizim"] as const;
type Filter = typeof filters[number];

const filterMap: Record<Filter, string | null> = {
  Barchasi: null,
  "To'lovlar": "payment",
  Takliflar: "proposal",
  Sharhlar: "review",
  Xabarlar: "message",
  Eskrou: "escrow",
  Buyurtmalar: "order",
  Portfolio: "portfolio",
  Tizim: "system",
};

const actionRoutes: Record<string, string> = {
  payment: "/wallet",
  proposal: "/applications",
  review: "/profile",
  system: "/settings",
  message: "/messages",
  escrow: "/escrow",
  order: "/orders",
  portfolio: "/portfolio",
};

function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const notifications = useSyncExternalStore(
    subscribeNotifications,
    () => getNotifications(user?.id),
    () => getNotifications(),
  );
  const unreadCount = useSyncExternalStore(
    subscribeNotifications,
    () => getUnreadCount(user?.id),
    () => 0,
  );
  const [activeFilter, setActiveFilter] = useState<Filter>("Barchasi");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [visibleLimit, setVisibleLimit] = useState(50);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 280);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setVisibleLimit(50);
  }, [activeFilter]);

  const visible = notifications.filter((n) => {
    if (dismissed.has(n.id)) return false;
    const kind = filterMap[activeFilter];
    if (kind && n.kind !== kind) return false;
    return true;
  });

  const pagedVisible = visible.slice(0, visibleLimit);
  const hasMore = visible.length > visibleLimit;

  const todayItems = pagedVisible.slice(0, 3);
  const earlierItems = pagedVisible.slice(3);

  function NotifItem({ n }: { n: AppNotification }) {
    const cfg = iconConfig[n.kind] ?? iconConfig.system!;
    const Icon = cfg.icon;
    const actions = actionMap[n.kind] ?? {};
    const isUnread = !n.read;
    const primaryRoute = n.href ?? actionRoutes[n.kind];

    return (
      <div
        className={`group relative flex items-start gap-4 px-5 py-4 transition-default ${
          isUnread ? "bg-primary/[0.03]" : "hover:bg-secondary/20"
        }`}
      >
        {/* Unread dot */}
        {isUnread && (
          <span className="absolute left-2 top-5 size-1.5 rounded-full bg-primary" />
        )}

        {/* Icon */}
        <div className={`mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg} ${cfg.text}`}>
          <Icon className="size-4.5" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className={`text-sm ${isUnread ? "font-semibold" : "font-medium"}`}>
                {n.title}
              </h3>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-mono whitespace-nowrap text-[10px] text-muted-foreground">{n.time}</span>
              <button
                onClick={() => {
                  dismissNotification(n.id, user?.id);
                  setDismissed((s) => new Set([...s, n.id]));
                  toast.success("Bildirishnoma yopildi");
                }}
                className={`touch-target inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-default hover:bg-secondary hover:text-foreground focus-ring ${isUnread ? "opacity-100" : "opacity-60 sm:opacity-0 sm:group-hover:opacity-100"}`}
                aria-label="Yopish"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          {(actions.primary || actions.secondary) && (
            <div className="mt-3 flex items-center gap-2">
              {actions.primary && (
                <button
                  onClick={() => {
                    markNotificationRead(n.id, user?.id);
                    if (primaryRoute) navigate({ to: primaryRoute });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition-default hover:border-primary/20 hover:text-primary focus-ring"
                >
                  {actions.primary}
                  <ChevronRight className="size-3" />
                </button>
              )}
              {actions.secondary && (
                <button
                  onClick={() => {
                    dismissNotification(n.id, user?.id);
                    setDismissed((s) => new Set([...s, n.id]));
                  }}
                  className="text-xs font-medium text-muted-foreground transition-default hover:text-foreground"
                >
                  {actions.secondary}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <AuthGate>
    <WorkspaceShell
      eyebrow="Faoliyat"
      title="Bildirishnomalar"
      actions={
        <button
          onClick={() => {
            markAllNotificationsRead(user?.id);
            toast.success("Barcha bildirishnomalar o'qilgan deb belgilandi");
          }}
          className="touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-default hover:border-primary/20 focus-ring sm:w-auto"
        >
          <CheckCheck className="size-4" /> Barchasini o'qilgan deb belgilash
        </button>
      }
    >
      {/* Summary bar */}
      {unreadCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Bell className="size-4 text-primary" />
          <span className="text-sm">
            Sizda{" "}
            <span className="font-semibold text-primary">{unreadCount} o'qilmagan</span>{" "}
            bildirishnoma
          </span>
          <button
            onClick={() => {
              markAllNotificationsRead(user?.id);
              toast.success("Barcha bildirishnomalar o'qilgan deb belgilandi");
            }}
            className="ml-auto text-xs font-medium text-primary transition-default hover:opacity-80"
          >
            Barchasini o'qilgan deb belgilash
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* Tabs */}
        <div className="mobile-scroll-x flex items-center gap-1 border-b border-border px-3 py-2.5 sm:px-4">
          {filters.map((f) => {
            const isActive = activeFilter === f;
            const kindKey = filterMap[f];
            const count = kindKey
              ? notifications.filter((n) => n.kind === kindKey && !n.read).length
              : notifications.filter((n) => !n.read).length;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`touch-target inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-default ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                {f}
                {count > 0 && (
                  <span className={`inline-flex size-4 items-center justify-center rounded-full text-[9px] font-bold ${
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-3 p-4" aria-busy="true" aria-label="Bildirishnomalar yuklanmoqda">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
        <>
        {/* Bugun */}
        {todayItems.length > 0 && (
          <>
            <div className="flex items-center gap-3 border-b border-border px-5 py-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Bugun</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="divide-y divide-border">
              {todayItems.map((n) => (
                <NotifItem key={n.id} n={n} />
              ))}
            </div>
          </>
        )}

        {/* Oldinroq */}
        {earlierItems.length > 0 && (
          <>
            <div className="flex items-center gap-3 border-t border-b border-border px-5 py-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Oldinroq</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="divide-y divide-border">
              {earlierItems.map((n) => (
                <NotifItem key={n.id} n={n} />
              ))}
            </div>
          </>
        )}

        {hasMore && (
          <div className="border-t border-border px-5 py-4 text-center">
            <button
              type="button"
              onClick={() => setVisibleLimit((l) => l + 50)}
              className="text-sm font-medium text-primary transition-default hover:opacity-80"
            >
              Yana {Math.min(50, visible.length - visibleLimit)} ta ko'rsatish ({visible.length - visibleLimit} qoldi)
            </button>
          </div>
        )}

        {visible.length === 0 && (
          <EmptyState
            icon={Bell}
            title="Hammasi ko'rib chiqilgan"
            description="Bu toifada bildirishnomalar yo'q. Diqqatingiz kerak bo'lganda xabar beramiz."
          />
        )}
        </>
        )}
      </div>

      {/* Notification settings link */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Bell className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Bildirishnoma sozlamalari</span>
        </div>
        <Link to="/settings" className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-default hover:opacity-80">
          Boshqarish <ExternalLink className="size-3" />
        </Link>
      </div>
    </WorkspaceShell>
    </AuthGate>
  );
}
