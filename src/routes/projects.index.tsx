import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { Plus, FolderOpen, FileText, Briefcase } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { ProjectCard } from "@/components/site/cards";
import { CardSkeleton, EmptyState } from "@/components/site/feedback";
import { usePageReady } from "@/hooks/use-page-ready";
import { IncrementalListFooter } from "@/components/site/incremental-list-footer";
import { MARKETPLACE_PAGE_SIZE, useIncrementalList } from "@/hooks/use-incremental-list";
import { MarketplaceToolbar, useMarketplaceSearch } from "@/components/site/marketplace-toolbar";
import { filterProjects, normalizeSearch, type MarketplaceSearch } from "@/lib/marketplace";
import { getPublishedProjects, subscribeProjects } from "@/lib/projects-store";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";

export const Route = createFileRoute("/projects/")({
  validateSearch: (search: Record<string, unknown>): MarketplaceSearch => normalizeSearch(search),
  head: () => ({
    meta: [
      { title: "Loyihalar — Ishbor" },
      { name: "description", content: "Markaziy Osiyoda ochiq shartnomalar toping." },
    ],
  }),
  component: ProjectsPage,
});

const projectCategories = [
  { key: "design", label: "Dizayn" },
  { key: "development", label: "Dasturlash" },
  { key: "consulting", label: "Strategiya" },
  { key: "architecture", label: "Arxitektura" },
  { key: "marketing", label: "Marketing" },
];

function ProjectsPage() {
  const ready = usePageReady();
  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  const search = Route.useSearch();
  const setSearch = useMarketplaceSearch(search, "/projects");
  const allProjects = useSyncExternalStore(subscribeProjects, getPublishedProjects, getPublishedProjects);
  const filtered = filterProjects(allProjects, search);
  const { visible, hasMore, loadMore, showing, total } = useIncrementalList(
    filtered,
    MARKETPLACE_PAGE_SIZE,
    `${search.q ?? ""}-${search.category ?? ""}-${search.sort ?? ""}`,
  );
  const createTo = !user ? "/login" : activeRole === "client" ? "/projects/create" : "/applications";
  const createSearch = !user ? { redirect: "/projects/create" } : {};

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="eyebrow mb-3">Bozor · Ochiq maydon</div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
                Taklif uchun tayyor ochiq loyihalar.
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
                Tekshirilgan mijozlar. Moliyalashtirilgan eskrou. Ishonch bilan taklif bering.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {activeRole === "freelancer" ? (
                <Link
                  to="/applications"
                  className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 sm:w-auto"
                >
                  <FileText className="size-4" /> Mening arizalarim
                </Link>
              ) : (
                <Link
                  to={createTo}
                  search={createSearch}
                  className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 sm:w-auto"
                >
                  <Plus className="size-4" /> Loyiha joylash
                </Link>
              )}
              {!user && (
                <Link
                  to="/login"
                  search={{ redirect: "/projects" }}
                  className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold hover:border-primary/20 sm:w-auto"
                >
                  <Briefcase className="size-4" /> Ariza berish uchun kiring
                </Link>
              )}
            </div>
          </div>

          <MarketplaceToolbar
            placeholder="Loyihalarni qidirish…"
            q={search.q ?? ""}
            sort={search.sort ?? "newest"}
            activeCategory={search.category}
            categories={projectCategories}
            resultCount={filtered.length}
            resultLabel="loyiha"
            onSearchChange={setSearch}
          />
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {!ready ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Loyihalar topilmadi"
            description="Qidiruv yoki filtrlarni o'zgartirib ko'ring."
            action={
              <button onClick={() => setSearch({ q: "", category: "", sort: "newest" })} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Filtrlarni tozalash
              </button>
            }
          />
        ) : (
          <>
            <div className="grid gap-5 lg:grid-cols-2 stagger-children">
              {visible.map((p) => <ProjectCard key={p.id} p={p} />)}
            </div>
            <IncrementalListFooter
              hasMore={hasMore}
              showing={showing}
              total={total}
              onLoadMore={loadMore}
            />
          </>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
