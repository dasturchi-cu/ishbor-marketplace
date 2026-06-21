import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { FreelancerCard, ServiceCard, ProjectCard } from "@/components/site/cards";
import { EmptyState, LoadingSpinner } from "@/components/site/feedback";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import { freelancers, services, projects } from "@/lib/mock-data";
import { getAllServices } from "@/lib/services-store";
import { getPublishedProjects } from "@/lib/projects-store";
import {
  filterFreelancers,
  filterProjects,
  filterServices,
  normalizeSearch,
  pickSearchRoute,
  type SortOption,
} from "@/lib/marketplace";
import { POPULAR_SEARCHES, SEARCH_TIPS } from "@/lib/search-suggestions";

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
    return {
      meta: [
        { title: q ? `"${q}" — Qidiruv — Ishbor` : "Qidiruv — Ishbor" },
        { name: "description", content: "Xizmatlar, mutaxassislar va loyihalar bo'yicha qidiruv" },
      ],
    };
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
  const [input, setInput] = useState(q);
  const hydrated = useClientHydrated();

  const allServices = useMemo(() => (hydrated ? getAllServices() : services), [hydrated]);
  const allProjects = useMemo(
    () => (hydrated ? getPublishedProjects() : projects.filter((p) => !p.status || p.status === "published")),
    [hydrated],
  );

  const params = { q, category: "", sort, filter: "" };

  const serviceResults = useMemo(() => filterServices(allServices, params), [allServices, q, sort]);
  const freelancerResults = useMemo(() => filterFreelancers(freelancers, params), [q, sort]);
  const projectResults = useMemo(() => filterProjects(allProjects.length ? allProjects : projects, params), [allProjects, q, sort]);

  const total = serviceResults.length + freelancerResults.length + projectResults.length;

  const submit = (query: string) => {
    const trimmed = query.trim();
    const route = pickSearchRoute(trimmed);
    navigate({
      to: "/search",
      search: { q: trimmed, type: route.to === "/freelancers" ? "freelancers" : route.to === "/projects" ? "projects" : type === "all" ? "services" : type, sort },
    });
  };

  const showServices = type === "all" || type === "services";
  const showFreelancers = type === "all" || type === "freelancers";
  const showProjects = type === "all" || type === "projects";

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
        </div>

        <div className="mt-4 mobile-scroll-x flex gap-2 pb-1">
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

        {q && total === 0 && (
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            &quot;{q}&quot; bo&apos;yicha natija topilmadi
          </p>
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
                {POPULAR_SEARCHES.map((s) => (
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
