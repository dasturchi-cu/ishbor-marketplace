import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { ServiceCard } from "@/components/site/cards";
import { ServiceCardSkeleton, EmptyState } from "@/components/site/feedback";
import { services, categories } from "@/lib/mock-data";
import { usePageReady } from "@/hooks/use-page-ready";
import { MarketplaceToolbar, useMarketplaceSearch } from "@/components/site/marketplace-toolbar";
import { filterServices, normalizeSearch } from "@/lib/marketplace";
import { Package } from "lucide-react";

export const Route = createFileRoute("/services")({
  validateSearch: (search) => normalizeSearch(search),
  head: () => ({
    meta: [
      { title: "Services — Ishbor Marketplace" },
      { name: "description", content: "Productized services from vetted Central Asian creators." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const ready = usePageReady();
  const search = Route.useSearch();
  const setSearch = useMarketplaceSearch(search, "/services");
  const filtered = filterServices(services, search);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="eyebrow mb-3">Marketplace · Services</div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
            Productized work, ready to ship.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Fixed scope, fixed price, fixed timeline. Hand-picked offerings from the region's best.
          </p>

          <MarketplaceToolbar
            placeholder="Search services…"
            q={search.q ?? ""}
            sort={search.sort ?? "newest"}
            activeCategory={search.category}
            activeFilter={search.filter}
            categories={categories.map((c) => ({ key: c.slug, label: c.name, count: c.count }))}
            chips={[{ key: "top-rated", label: "Top rated" }]}
            resultCount={filtered.length}
            resultLabel="services"
            onSearchChange={setSearch}
          />
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
            title="No services found"
            description="Try adjusting your search or filters."
            action={
              <button onClick={() => setSearch({ q: "", category: "", filter: "", sort: "newest" })} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
            {filtered.map((s) => <ServiceCard key={s.id} s={s} />)}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
