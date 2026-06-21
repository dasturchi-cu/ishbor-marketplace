import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { FreelancerCard, ServiceCard, ProjectCard } from "@/components/site/cards";
import { EmptyState } from "@/components/site/feedback";
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

  const allServices = useMemo(() => getAllServices(), []);
  const allProjects = useMemo(() => getPublishedProjects(), []);

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
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
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

        <div className="mt-4 flex flex-wrap gap-2">
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

        {q && (
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            &quot;{q}&quot; bo&apos;yicha {total} ta natija
          </p>
        )}

        {!q ? (
          <EmptyState
            className="mt-10"
            icon={SearchIcon}
            title="Qidiruvni boshlang"
            description="Masalan: Figma, fintech, mobil dizayn yoki Next.js"
          />
        ) : total === 0 ? (
          <EmptyState
            className="mt-10"
            icon={SearchIcon}
            title="Natija topilmadi"
            description="Boshqa kalit so'z yoki kategoriya bilan urinib ko'ring."
            action={
              <Link to="/projects" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Barcha loyihalar
              </Link>
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
