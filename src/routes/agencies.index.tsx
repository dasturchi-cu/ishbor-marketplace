import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useSyncExternalStore } from "react";
import { Building2 } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { EmptyState } from "@/components/site/feedback";
import { AgencyCard } from "@/components/agency/agency-card";
import { getPublishedAgencies, subscribeAgencies } from "@/lib/agency-store";
import { getRankedAgencies, agencySortLabels, normalizeAgencySearch, filterAgencies } from "@/lib/agency-marketplace";
import { computeAgencyMetrics } from "@/lib/agency-metrics-store";
import type { AgencySearchParams, AgencySortOption } from "@/lib/agency-types";
import { useNavigate } from "@tanstack/react-router";
import { IncrementalListFooter } from "@/components/site/incremental-list-footer";
import { MARKETPLACE_PAGE_SIZE, useIncrementalList } from "@/hooks/use-incremental-list";

export const Route = createFileRoute("/agencies/")({
  validateSearch: (search: Record<string, unknown>): AgencySearchParams => normalizeAgencySearch(search),
  head: () => ({
    meta: [
      { title: "Agentliklar — Ishbor" },
      { name: "description", content: "Tekshirilgan agentliklar va jamoalar bilan katta loyihalarni bajaring." },
    ],
  }),
  component: AgenciesPage,
});

const filterChips = [
  { key: "verified", label: "Tasdiqlangan" },
  { key: "premium", label: "Premium" },
  { key: "enterprise", label: "Korporativ" },
];

const countryChips = [
  { key: "Uzbekistan", label: "O'zbekiston" },
  { key: "Tashkent", label: "Tashkent" },
];

function AgenciesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const agencies = useSyncExternalStore(subscribeAgencies, getPublishedAgencies, () => []);
  const ranked = useMemo(() => getRankedAgencies(agencies), [agencies]);
  const filtered = useMemo(() => filterAgencies(agencies, search), [agencies, search]);
  const { visible, hasMore, loadMore, showing, total } = useIncrementalList(
    filtered,
    MARKETPLACE_PAGE_SIZE,
    `${search.q ?? ""}-${search.sort ?? ""}-${search.filter ?? ""}-${search.country ?? ""}`,
  );

  const setSearch = (patch: Partial<AgencySearchParams>) => {
    navigate({ to: "/agencies", search: { ...search, ...patch } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="eyebrow mb-3">Bozor · Agentliklar</div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
            <span className="font-serif-italic font-medium text-primary">Agentlik</span> jamoalar bilan katta loyihalar.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Tekshirilgan agentliklar, jamoa reytingi va haqiqiy natijalar asosida tanlang.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={search.q ?? ""}
            onChange={(e) => setSearch({ q: e.target.value })}
            placeholder="Agentlik qidirish..."
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none sm:max-w-md"
          />
          <select
            value={search.sort ?? "ranking"}
            onChange={(e) => setSearch({ sort: e.target.value as AgencySortOption })}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            {Object.entries(agencySortLabels).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>

        <div className="mobile-scroll-x mt-4 flex gap-2">
          {filterChips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setSearch({ filter: search.filter === c.key ? "" : c.key })}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                search.filter === c.key ? "border-primary bg-primary/10 text-primary" : "border-border"
              }`}
            >
              {c.label}
            </button>
          ))}
          {countryChips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setSearch({ country: search.country === c.key ? "" : c.key })}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                search.country === c.key ? "border-primary bg-primary/10 text-primary" : "border-border"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          <span className="font-mono text-foreground">{filtered.length}</span> ta agentlik
        </p>

        {filtered.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={Building2}
              title="Agentliklar topilmadi"
              description="Filtrlarni o'zgartiring yoki birinchi agentlikni yarating."
              action={
                <a href="/agencies/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  Agentlik yaratish
                </a>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((agency) => {
                const rankedEntry = ranked.find((r) => r.slug === agency.slug);
                return (
                  <AgencyCard
                    key={agency.slug}
                    agency={agency}
                    metrics={rankedEntry?.metrics ?? computeAgencyMetrics(agency)}
                    rankingScore={rankedEntry?.rankingScore}
                  />
                );
              })}
            </div>
            <IncrementalListFooter
              hasMore={hasMore}
              showing={showing}
              total={total}
              onLoadMore={loadMore}
            />
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
