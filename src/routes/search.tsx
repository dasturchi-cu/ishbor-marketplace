import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Search as SearchIcon, Bell } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { FreelancerCard, ServiceCard, ProjectCard } from "@/components/site/cards";
import { EmptyState, LoadingSpinner } from "@/components/site/feedback";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import { freelancers, services, projects } from "@/lib/mock-data";
import {
  getAllDiscoverableFreelancers,
  subscribeDiscoverableFreelancers,
} from "@/lib/freelancer-profile-resolver";
import { getAllServices } from "@/lib/services-store";
import { getPublishedProjects } from "@/lib/projects-store";
import {
  filterFreelancers,
  filterProjects,
  filterServices,
  normalizeSearch,
  pickSearchRoute,
  recordSearchQuery,
  sortLabels,
  type SortOption,
} from "@/lib/marketplace";
import { getDynamicSearchSuggestions, SEARCH_TIPS } from "@/lib/search-suggestions";
import { MarketplaceStatsBar } from "@/components/marketplace/social-proof";
import { getMarketplaceStatistics } from "@/lib/marketplace-signals";
import { buildPageMeta } from "@/lib/seo";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { saveMarketplaceSearch } from "@/lib/alerts-store";

type SearchType = "all" | "services" | "freelancers" | "projects";

type SearchParams = {
  q?: string;
  type?: SearchType;
  sort?: SortOption;
};

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const base = normalizeSearch(search);
    const type = search.type;
    return {
      q: base.q,
      sort: base.sort,
      type: type === "services" || type === "freelancers" || type === "projects" || type === "all" ? type : "all",
    };
  },
  head: (match) => {
    const search = (match as { search?: SearchParams }).search;
    const q = search?.q ?? "";
    const hasQuery = q.trim().length > 0;
    return buildPageMeta({
      title: hasQuery ? `"${q}" — Qidiruv — Ishbor` : "Qidiruv — Ishbor",
      description: "Xizmatlar, mutaxassislar va loyihalar bo'yicha qidiruv",
      path: hasQuery ? undefined : "/search",
      noindex: hasQuery,
    });
  },
  component: SearchPage,
});

const tabs: { key: SearchType; label: string }[] = [
  { key: "all", label: "Hammasi" },
  { key: "services", label: "Xizmatlar" },
  { key: "freelancers", label: "Mutaxassislar" },
  { key: "projects", label: "Loyihalar" },
];

function SearchPage() {
  const { q = "", type = "all", sort = "ranking_score" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { user } = useAuth();
  const [input, setInput] = useState(q);
  const hydrated = useClientHydrated();

  const discoverVersion = useSyncExternalStore(
    subscribeDiscoverableFreelancers,
    () => getAllDiscoverableFreelancers().length,
    () => freelancers.length,
  );
  const discoverable = useMemo(
    () => (hydrated ? getAllDiscoverableFreelancers() : freelancers),
    [hydrated, discoverVersion],
  );

  const allServices = useMemo(() => (hydrated ? getAllServices() : services), [hydrated]);
  const allProjects = useMemo(
    () => (hydrated ? getPublishedProjects() : projects.filter((p) => !p.status || p.status === "published")),
    [hydrated],
  );

  const params = { q, category: "", sort, filter: "" };
  const serviceResults = useMemo(() => filterServices(allServices, params), [allServices, q, sort]);
  const freelancerResults = useMemo(
    () => filterFreelancers(discoverable, params),
    [discoverable, q, sort, discoverVersion],
  );
  const projectResults = useMemo(() => filterProjects(allProjects.length ? allProjects : projects, params), [allProjects, q, sort]);

  const total = serviceResults.length + freelancerResults.length + projectResults.length;
  const suggestions = useMemo(() => getDynamicSearchSuggestions(6), [discoverVersion, hydrated, q]);
  const marketplaceStats = useMemo(
    () => (hydrated ? getMarketplaceStatistics() : null),
    [hydrated, discoverVersion, allServices.length, allProjects.length],
  );

  const submit = (query: string) => {
    const trimmed = query.trim();
    if (/^admin$/i.test(trimmed)) {
      navigate({ to: "/admin" });
      return;
    }
    const nextType =
      type === "all"
        ? trimmed
          ? pickSearchRoute(trimmed).to === "/freelancers"
            ? "freelancers"
            : pickSearchRoute(trimmed).to === "/projects"
              ? "projects"
              : "services"
          : "all"
        : type;
    navigate({
      to: "/search",
      search: { q: trimmed, type: nextType, sort },
    });
    if (trimmed) {
      const params = { q: trimmed, category: "", sort: "ranking_score" as SortOption, filter: "" };
      const count =
        filterServices(allServices, params).length +
        filterFreelancers(discoverable, params).length +
        filterProjects(allProjects.length ? allProjects : projects, params).length;
      recordSearchQuery(trimmed, count, nextType);
    }
  };

  const showServices = type === "all" || type === "services";
  const showFreelancers = type === "all" || type === "freelancers";
  const showProjects = type === "all" || type === "projects";

  const saveSearchType = (): "projects" | "services" | "freelancers" => {
    if (type === "projects") return "projects";
    if (type === "freelancers") return "freelancers";
    return "services";
  };

  const handleSaveSearch = () => {
    if (!q.trim()) {
      toast.error("Avval qidiruv so'zini kiriting");
      return;
    }
    if (!user) {
      navigate({ to: "/login", search: { redirect: `/search?q=${encodeURIComponent(q)}&type=${type}` } });
      return;
    }
    const result = saveMarketplaceSearch(user.id, { q, type: saveSearchType() });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Qidiruv saqlandi — yangi natijalar haqida xabar olasiz", {
      action: {
        label: "Ogohlantirishlar",
        onClick: () => navigate({ to: "/settings", search: { tab: "alerts" } }),
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="eyebrow mb-2">Qidiruv</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Bozor bo&apos;ylab qidirish</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Xizmatlar, mutaxassislar va loyihalar — bitta joyda.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl liquid-glass-panel px-4 py-3">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit(input)}
              placeholder="Kalit so'z, ko'nikma yoki loyiha nomi…"
              aria-label="Bozor qidiruvi"
              className="min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <button
            type="button"
            onClick={() => submit(input)}
            className="touch-target rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95"
          >
            Qidirish
          </button>
          {q.trim() && (
            <button
              type="button"
              onClick={handleSaveSearch}
              className="touch-target inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:border-primary/30"
            >
              <Bell className="size-4" /> Saqlash
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="mobile-scroll-x flex gap-2 pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => navigate({ search: (prev) => ({ ...prev, type: tab.key }) })}
                className={`touch-target rounded-lg px-3 py-1.5 text-xs font-semibold transition-default ${
                  type === tab.key ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="shrink-0 font-mono uppercase tracking-widest">Saralash</span>
            <select
              value={sort}
              onChange={(e) =>
                navigate({
                  search: (prev) => ({ ...prev, sort: e.target.value as SortOption }),
                })
              }
              className="touch-target min-h-9 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground"
              aria-label="Natijalarni saralash"
            >
              {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                <option key={key} value={key}>
                  {sortLabels[key]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hydrated && marketplaceStats && (
          <div className="mt-4">
            <MarketplaceStatsBar stats={marketplaceStats} />
          </div>
        )}

        {q && total > 0 && (
          <p className="mt-4 rounded-lg border border-success/20 bg-success/5 px-4 py-2.5 text-sm text-foreground">
            <span className="font-semibold">{total} ta natija</span>
            <span className="text-muted-foreground">
              {" "}— &quot;{q}&quot; bo&apos;yicha
              {serviceResults.length > 0 && ` ${serviceResults.length} xizmat`}
              {freelancerResults.length > 0 && ` · ${freelancerResults.length} mutaxassis`}
              {projectResults.length > 0 && ` · ${projectResults.length} loyiha`}
            </span>
          </p>
        )}

        {q && total === 0 && hydrated && (
          <div className="mt-4 space-y-3">
            <p className="font-mono text-xs text-muted-foreground">
              &quot;{q}&quot; bo&apos;yicha natija topilmadi — imlo xatosini tekshiring yoki quyidagilarni sinab ko&apos;ring:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setInput(s.query);
                    submit(s.query);
                  }}
                  className="touch-target rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/25"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {q && !hydrated ? (
          <div className="mt-10 flex justify-center" aria-busy="true" aria-label="Qidiruv natijalari yuklanmoqda">
            <LoadingSpinner size="md" />
          </div>
        ) : !q ? (
          <div className="mt-10 space-y-6">
            <EmptyState
              icon={SearchIcon}
              title="Qidiruvni boshlang"
              description="Kalit so'z, ko'nikma yoki loyiha nomi kiriting — biz eng mos natijalarni ko'rsatamiz."
              benefit={SEARCH_TIPS[0]}
            />
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Mashhur qidiruvlar</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      setInput(s.query);
                      submit(s.query);
                    }}
                    className="touch-target rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition-default hover:border-primary/25 hover:bg-primary/5 active:scale-[0.98]"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : total === 0 ? (
          <EmptyState
            className="mt-10"
            icon={SearchIcon}
            title="Natija topilmadi"
            description="Boshqa kalit so'z yoki kategoriya bilan urinib ko'ring."
            benefit={SEARCH_TIPS[1]}
            action={
              <Link to="/projects" className="touch-target rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground active:scale-[0.98]">
                Barcha loyihalar
              </Link>
            }
            secondaryAction={
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  navigate({ search: { q: "", type, sort } });
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Qidiruvni tozalash
              </button>
            }
          />
        ) : (
          <div className="mt-8 space-y-10">
            {showServices && serviceResults.length > 0 && (
              <section>
                <h2 className="font-display mb-4 text-lg font-semibold">Xizmatlar ({serviceResults.length})</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {serviceResults.slice(0, type === "all" ? 6 : 24).map((s) => (
                    <ServiceCard key={s.slug} s={s} />
                  ))}
                </div>
              </section>
            )}
            {showFreelancers && freelancerResults.length > 0 && (
              <section>
                <h2 className="font-display mb-4 text-lg font-semibold">Mutaxassislar ({freelancerResults.length})</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {freelancerResults.slice(0, type === "all" ? 6 : 24).map((f) => (
                    <FreelancerCard key={f.username} f={f} />
                  ))}
                </div>
              </section>
            )}
            {showProjects && projectResults.length > 0 && (
              <section>
                <h2 className="font-display mb-4 text-lg font-semibold">Loyihalar ({projectResults.length})</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {projectResults.slice(0, type === "all" ? 6 : 24).map((p) => (
                    <ProjectCard key={p.slug} p={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
