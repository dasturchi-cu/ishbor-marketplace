import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { ProjectCard } from "@/components/site/cards";
import { projects } from "@/lib/mock-data";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Ishbor Marketplace" },
      { name: "description", content: "Find open contracts across Central Asia." },
    ],
  }),
  component: ProjectsPage,
});

const tabs = ["All", "Design", "Development", "Strategy", "Architecture", "Legal", "Marketing"];

function ProjectsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="eyebrow mb-3">Marketplace · The Open Floor</div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Open projects, ready for proposals.
              </h1>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Vetted clients. Funded escrow. Bid with confidence.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring">
              <Plus className="size-4" /> Post a project
            </button>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 focus-ring">
              <Search className="size-4 text-muted-foreground" />
              <input
                placeholder='Search projects — "Webflow build"'
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
              <SlidersHorizontal className="size-4" /> Filters · Budget · Duration
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((t, i) => (
              <button
                key={t}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-default ${
                  i === 0
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-foreground/80 hover:text-foreground hover:border-primary/20"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2 stagger-children">
          {[...projects, ...projects].map((p, i) => (
            <ProjectCard key={i} p={p} />
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}