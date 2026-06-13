import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { FreelancerCard } from "@/components/site/cards";
import { CardSkeleton, EmptyState } from "@/components/site/feedback";
import { freelancers } from "@/lib/mock-data";
import { usePageReady } from "@/hooks/use-page-ready";
import { MarketplaceToolbar, useMarketplaceSearch } from "@/components/site/marketplace-toolbar";
import { filterFreelancers, normalizeSearch, type MarketplaceSearch } from "@/lib/marketplace";
import { Users } from "lucide-react";

export const Route = createFileRoute("/freelancers")({
  validateSearch: (search: Record<string, unknown>): MarketplaceSearch => normalizeSearch(search),
  head: () => ({
    meta: [
      { title: "Find talent — Ishbor Marketplace" },
      { name: "description", content: "Hire vetted freelancers across Central Asia." },
    ],
  }),
  component: FreelancersPage,
});

const filterChips = [
  { key: "top-rated", label: "Top Rated" },
  { key: "available", label: "Available Now" },
  { key: "under-50", label: "Under $50/h" },
  { key: "tashkent", label: "Tashkent" },
  { key: "verified", label: "Verified Identity" },
];

function FreelancersPage() {
  const ready = usePageReady();
  const search = Route.useSearch();
  const setSearch = useMarketplaceSearch(search, "/freelancers");
  const filtered = filterFreelancers(freelancers, search);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="eyebrow mb-3">Marketplace · Talent</div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
            Hire <span className="font-serif-italic font-medium text-primary">elite</span> Central Asian talent.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Every freelancer is identity-verified and vetted for craft. Hourly or fixed.
          </p>

          <MarketplaceToolbar
            placeholder="Search talent…"
            q={search.q ?? ""}
            sort={search.sort ?? "newest"}
            activeFilter={search.filter}
            chips={filterChips}
            resultCount={filtered.length}
            resultLabel="freelancers"
            onSearchChange={setSearch}
          />
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {!ready ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No freelancers found"
            description="Try adjusting your search or filters."
            action={
              <button onClick={() => setSearch({ q: "", filter: "", sort: "newest" })} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
            {filtered.map((f) => <FreelancerCard key={f.id} f={f} />)}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
