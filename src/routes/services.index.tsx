import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { ServiceCard } from "@/components/site/cards";
import { ServiceCardSkeleton, EmptyState } from "@/components/site/feedback";
import { getPublishedServices, subscribeServices } from "@/lib/services-store";
import { useSyncExternalStore, useMemo } from "react";
import { usePageReady } from "@/hooks/use-page-ready";
import { IncrementalListFooter } from "@/components/site/incremental-list-footer";
import { MARKETPLACE_PAGE_SIZE, useIncrementalList } from "@/hooks/use-incremental-list";
import { MarketplaceToolbar, useMarketplaceSearch } from "@/components/site/marketplace-toolbar";
import { MarketplacePulseMini } from "@/components/site/marketplace-pulse-mini";
import { filterServices, normalizeSearch, type MarketplaceSearch } from "@/lib/marketplace";
import { categories } from "@/lib/mock-data";
import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { CategoryBrowseRow } from "@/components/site/category-browse-row";
import { useAuth } from "@/hooks/use-auth";
import {
  applyPersonalizedServiceOrder,
  getRecommendationsVersion,
  shouldPersonalizeList,
  subscribeRecommendations,
} from "@/lib/recommendations";
export const Route = createFileRoute("/services/")({
  validateSearch: (search: Record<string, unknown>): MarketplaceSearch => normalizeSearch(search),
  head: () => ({
    meta: [
      { title: "Xizmatlar — Ishbor" },
      { name: "description", content: "Markaziy Osiyoning tekshirilgan ijodkorlaridan tayyor xizmatlar." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const ready = usePageReady();
  const { user } = useAuth();
  const search = Route.useSearch();
  const setSearch = useMarketplaceSearch(search, "/services");
  const allServices = useSyncExternalStore(subscribeServices, getPublishedServices, getPublishedServices);
  const recVersion = useSyncExternalStore(subscribeRecommendations, getRecommendationsVersion, () => 0);
  const filtered = useMemo(() => {
    const base = filterServices(allServices, search);
    if (user && shouldPersonalizeList(search)) {
      return applyPersonalizedServiceOrder(base, user.id);
    }
    return base;
  }, [allServices, search, user?.id, recVersion]);  const { visible, hasMore, loadMore, showing, total } = useIncrementalList(
    filtered,
    MARKETPLACE_PAGE_SIZE,
    `${search.q ?? ""}-${search.category ?? ""}-${search.sort ?? ""}-${search.filter ?? ""}`,
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="eyebrow mb-3">Bozor · Xizmatlar</div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
            Tayyor ish, yetkazishga tayyor.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Aniq doira, aniq narx, aniq muddat. Mintaqaning eng yaxshilaridan tanlangan takliflar.
          </p>
          <Link
            to="/services/create"
            className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Xizmat yaratish
          </Link>

          <CategoryBrowseRow activeSlug={search.category} className="mt-6" />

          <MarketplaceToolbar
            placeholder="Xizmatlarni qidirish…"
            q={search.q ?? ""}
            sort={search.sort ?? "ranking_score"}
            activeCategory={search.category}
            activeFilter={search.filter}
            categories={categories.map((c) => ({ key: c.slug, label: c.name, count: c.count }))}
            chips={[{ key: "top-rated", label: "Eng yuqori reyting" }]}
            resultCount={filtered.length}
            resultLabel="xizmat"
            onSearchChange={setSearch}
          />
          <MarketplacePulseMini />
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {!ready ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ServiceCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Xizmatlar topilmadi"
            description="Qidiruv yoki filtrlarni o'zgartirib ko'ring."
            action={
              <button onClick={() => setSearch({ q: "", category: "", filter: "", sort: "newest" })} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Filtrlarni tozalash
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
              {visible.map((s) => <ServiceCard key={s.id} s={s} />)}
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
