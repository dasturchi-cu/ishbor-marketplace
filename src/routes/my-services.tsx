import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { Plus, Pencil, Copy, Pause, Play, Trash2, Sparkles, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { EmptyState, confirmDestructive } from "@/components/site/feedback";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireRole } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import {
  getMyServices,
  subscribeServices,
  updateServiceStatus,
  duplicateService,
  deleteService,
  type StoredService,
} from "@/lib/services-store";
import { getAllAnalyticsEvents } from "@/lib/analytics-events-store";
import { FeaturedPurchaseCard } from "@/components/analytics/featured-purchase-card";

type Tab = "published" | "draft" | "paused" | "archived";

export const Route = createFileRoute("/my-services")({
  beforeLoad: requireRole(["freelancer"]),
  head: () => ({ meta: [{ title: "Mening xizmatlarim — Ishbor" }] }),
  component: () => (
    <ProtectedGate roles={["freelancer"]}>
      <MyServicesPage />
    </ProtectedGate>
  ),
});

const EMPTY_SERVICES: StoredService[] = [];

function MyServicesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("published");

  const services = useSyncExternalStore(
    subscribeServices,
    () => (user ? getMyServices(user.id) : EMPTY_SERVICES),
    () => EMPTY_SERVICES,
  );

  const filtered = services.filter((s) => {
    const status = s.status ?? "published";
    if (tab === "archived") return status === "archived";
    if (tab === "paused") return status === "paused";
    if (tab === "draft") return status === "draft";
    return status === "published";
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "published", label: "E'lon qilingan" },
    { key: "draft", label: "Qoralama" },
    { key: "paused", label: "To'xtatilgan" },
    { key: "archived", label: "Arxiv" },
  ];

  return (
    <WorkspaceShell
      eyebrow="Xizmatlar markazi"
      title="Mening xizmatlarim"
      actions={
        <div className="flex gap-2">
          <Link to="/analytics/freelancer" className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium">
            <BarChart3 className="size-4" /> Analitika
          </Link>
          <Link to="/services/create" className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Plus className="size-4" /> Yangi xizmat
          </Link>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}>
            {t.label} ({services.filter((s) => (s.status ?? "published") === t.key || (t.key === "published" && !s.status)).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Xizmatlar yo'q"
          description="Birinchi xizmatingizni yarating va sotishni boshlang."
          action={<Link to="/services/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Xizmat yaratish</Link>}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => (
            <ServiceRow key={s.slug} service={s} navigate={navigate} onRefresh={() => navigate({ to: "/my-services" })} />
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}

function ServiceRow({
  service: s,
  navigate,
  onRefresh,
}: {
  service: StoredService;
  navigate: ReturnType<typeof useNavigate>;
  onRefresh: () => void;
}) {
  const events = getAllAnalyticsEvents();
  const views = events.filter((e) => e.type === "service_view" && e.entityId === s.slug).length;
  const saves = events.filter((e) => e.type === "service_save" && e.entityId === s.slug).length;
  const orders = events.filter((e) => e.type === "service_order" && e.entityId === s.slug).length;
  const revenue = events.filter((e) => e.type === "service_order" && e.entityId === s.slug).reduce((sum, e) => sum + (e.value ?? 0), 0);

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/services/$slug" params={{ slug: s.slug }} className="font-display text-lg font-semibold hover:text-primary">{s.title}</Link>
          <div className="mt-1 text-sm text-muted-foreground">{s.category} · ${s.price} · {s.delivery}</div>
          <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] text-muted-foreground">
            <span>{views} ko'rish</span>
            <span>{saves} saqlash</span>
            <span>{orders} buyurtma</span>
            <span>${revenue} daromad</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionBtn icon={Pencil} label="Tahrirlash" onClick={() => navigate({ to: "/services/create", search: { edit: s.slug } })} />
          <ActionBtn icon={Copy} label="Nusxa" onClick={() => { duplicateService(s.slug); toast.success("Nusxa yaratildi"); onRefresh(); }} />
          {s.status === "paused" ? (
            <ActionBtn icon={Play} label="Faollashtirish" onClick={() => { updateServiceStatus(s.slug, "published"); toast.success("E'lon qilindi"); onRefresh(); }} />
          ) : (
            <ActionBtn icon={Pause} label="To'xtatish" onClick={() => { updateServiceStatus(s.slug, "paused"); toast.success("To'xtatildi"); onRefresh(); }} />
          )}
          <ActionBtn icon={Trash2} label="O'chirish" onClick={() => {
            if (!confirmDestructive(`"${s.title}" xizmatini o'chirishni tasdiqlaysizmi?`)) return;
            if (deleteService(s.slug)) { toast.success("O'chirildi"); onRefresh(); }
            else toast.error("O'chirishda xato yuz berdi");
          }} />
        </div>
      </div>
      {s.ownerUserId && (
        <div className="mt-4">
          <FeaturedPurchaseCard target={{ type: "service", slug: s.slug, title: s.title }} featured={s.featured} featuredUntil={s.featuredUntil} onSuccess={onRefresh} />
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick }: { icon: typeof Pencil; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:border-primary/20">
      <Icon className="size-3.5" /> {label}
    </button>
  );
}
