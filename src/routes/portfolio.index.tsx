import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  FolderOpen,
  Pencil,
  Trash2,
  Archive,
  Eye,
  Send,
  RotateCcw,
} from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { EmptyState, confirmDestructive } from "@/components/site/feedback";
import { PortfolioAnalyticsWidget } from "@/components/portfolio/portfolio-analytics-widget";
import { PortfolioCover } from "@/components/portfolio/portfolio-preview-card";
import { FreelancerOnlyGate } from "@/components/portfolio/freelancer-only-gate";
import { useAuth } from "@/hooks/use-auth";
import {
  getMyPortfolios,
  subscribePortfolios,
  deletePortfolio,
  archivePortfolio,
  updatePortfolioStatus,
  publishPortfolio,
  portfolioToFormInput,
} from "@/lib/portfolio-store";
import type { PortfolioItem, PortfolioStatus } from "@/lib/portfolio-types";
import { IncrementalListFooter } from "@/components/site/incremental-list-footer";
import { useIncrementalList, WORKSPACE_PAGE_SIZE } from "@/hooks/use-incremental-list";
export const Route = createFileRoute("/portfolio/")({
  head: () => ({ meta: [{ title: "Portfel — Ishbor" }] }),
  component: PortfolioDashboardPage,
});

const filterTabs = [
  { key: "all", label: "Barchasi" },
  { key: "published", label: "Joylangan" },
  { key: "draft", label: "Qoralama" },
  { key: "archived", label: "Arxivlangan" },
] as const;

const statusLabels: Record<PortfolioStatus, string> = {
  draft: "Qoralama",
  published: "Joylangan",
  archived: "Arxivlangan",
};

const adminLabels: Record<string, string> = {
  pending: "Ko'rib chiqilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
  hidden: "Yashirilgan",
  featured: "Tavsiya etilgan",
};

const EMPTY: PortfolioItem[] = [];

function PortfolioDashboardPage() {
  const { user } = useAuth();

  return (
    <FreelancerOnlyGate
      title="Frilanser hisobi talab qilinadi"
      description="Portfel loyihalari, keys stadiyalar va tahlillarni frilanser ish maydonidan boshqaring."
      redirectPath="/portfolio"
    >
      <PortfolioDashboardContent user={user!} />
    </FreelancerOnlyGate>
  );
}

function PortfolioDashboardContent({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const [tab, setTab] = useState<(typeof filterTabs)[number]["key"]>("all");
  const ownerId = user.id;
  const items = useSyncExternalStore(
    subscribePortfolios,
    () => getMyPortfolios(ownerId),
    () => EMPTY,
  );

  const filtered =
    tab === "all" ? items : items.filter((p) => p.status === tab);
  const { visible, hasMore, loadMore, showing, total } = useIncrementalList(
    filtered,
    WORKSPACE_PAGE_SIZE,
    tab,
  );

  return (
    <WorkspaceShell
      eyebrow="Frilanser ish maydoni"
      title="Portfel"
      actions={
        <Link
          to="/portfolio/create"
          className="touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground sm:w-auto"
        >
          <Plus className="size-4" /> Portfel yaratish
        </Link>
      }
    >
      <PortfolioAnalyticsWidget items={items.filter((p) => p.status === "published")} />

      <div className="mb-6 mt-8 flex flex-wrap gap-2">
        {filterTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-default ${
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            {t.label}
            <span className="ml-1.5 font-mono text-[10px] opacity-70">
              {t.key === "all" ? items.length : items.filter((p) => p.status === t.key).length}
            </span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Eng yaxshi ishingizni mijozlarga ko'rsating"
          description="Yollanish konversiyasini oshirish uchun keys stadiyalar, metrikalar va loyiha havolalari bilan professional portfolio yarating."
          action={
            <Link
              to="/portfolio/create"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Portfel yaratish
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={`${filterTabs.find((t) => t.key === tab)?.label} elementlar yo'q`}
          description="Boshqa filtrni sinab ko'ring yoki yangi portfolio elementi yarating."
          action={
            <Link to="/portfolio/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Portfel yaratish
            </Link>
          }
        />
      ) : (
        <>
          <div className="divide-y divide-border rounded-2xl border border-border bg-card">
            {visible.map((p) => (
              <PortfolioRow key={p.id} item={p} ctx={user} />
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

function PortfolioRow({ item: p, ctx }: { item: PortfolioItem; ctx: { id: string; fullName: string; username?: string; avatarHue: number } }) {
  const handleDelete = () => {
    if (!confirmDestructive(`"${p.title}" portfolioni o'chirishni tasdiqlaysizmi?`)) return;
    if (deletePortfolio(p.slug)) toast.success("Portfel o'chirildi");
    else toast.error("O'chirishda xato yuz berdi");
  };

  const handleArchive = () => {
    if (!confirmDestructive(`"${p.title}" arxivlansinmi?`)) return;
    archivePortfolio(p.slug);
    toast.success("Portfel arxivlandi");
  };

  const handleRestoreDraft = () => {
    updatePortfolioStatus(p.slug, "draft");
    toast.success("Qoralamalarga ko'chirildi");
  };

  const handlePublish = () => {
    const input = portfolioToFormInput(p);
    publishPortfolio(input, {
      ownerUserId: ctx.id,
      freelancerUsername: ctx.username ?? ctx.fullName.toLowerCase().replace(/\s+/g, "-"),
      freelancerName: ctx.fullName,
      freelancerHue: ctx.avatarHue,
    }, p.slug);
    toast.success("Portfel joylandi", { description: "Ommaviy ko'rinish uchun admin tasdig'i kutilmoqda." });
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="w-full max-w-[120px] shrink-0 overflow-hidden rounded-xl border border-border sm:w-28">
          <PortfolioCover hue={p.hue} aspect="aspect-[4/3]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{p.category}</span>
            <StatusBadge status={p.status} />
            {p.status === "published" && (
              <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                {adminLabels[p.adminStatus] ?? p.adminStatus}
              </span>
            )}
          </div>
          <Link
            to="/portfolio/$slug"
            params={{ slug: p.slug }}
            className="font-display mt-2 block text-lg font-semibold hover:text-primary"
          >
            {p.title}
          </Link>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
          <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Muddat: {p.duration}</span>
            <span>Jamoa: {p.teamSize}</span>
            <span>Yakunlangan: {p.completionDate}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {p.status === "published" && (
            <Link
              to="/portfolio/$slug"
              params={{ slug: p.slug }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/20"
            >
              <Eye className="size-3.5" /> Ko'rish
            </Link>
          )}
          <Link
            to="/portfolio/edit/$slug"
            params={{ slug: p.slug }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/20"
          >
            <Pencil className="size-3.5" /> Tahrirlash
          </Link>
          {p.status === "draft" && (
            <button
              type="button"
              onClick={handlePublish}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:border-primary/40"
            >
              <Send className="size-3.5" /> Joylash
            </button>
          )}
          {p.status !== "archived" ? (
            <button
              type="button"
              onClick={handleArchive}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/20"
            >
              <Archive className="size-3.5" /> Arxivlash
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/20"
            >
              <RotateCcw className="size-3.5" /> Qayta tiklash
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="size-3.5" /> O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: PortfolioStatus }) {
  const tones: Record<PortfolioStatus, string> = {
    draft: "bg-secondary text-muted-foreground",
    published: "bg-success/10 text-success",
    archived: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${tones[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
