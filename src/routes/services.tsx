import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { ServiceCard } from "@/components/site/cards";
import { services, categories } from "@/lib/mock-data";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Ishbor Marketplace" },
      { name: "description", content: "Productized services from vetted Central Asian creators." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="eyebrow mb-3">Marketplace · Services</div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Productized work, ready to ship.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Fixed scope, fixed price, fixed timeline. Hand-picked offerings from the region's best.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 focus-ring">
              <Search className="size-4 text-muted-foreground" />
              <input
                placeholder='Search services — "marketplace build"'
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
              <SlidersHorizontal className="size-4" /> Filters
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
              Sort · Recommended <ChevronDown className="size-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.slug}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground/80 transition-default hover:text-foreground hover:border-primary/20 focus-ring"
              >
                {c.name}
                <span className="ml-1.5 text-muted-foreground">{c.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-mono text-foreground">{services.length * 312}</span> services available
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
          {[...services, ...services].map((s, i) => (
            <ServiceCard key={i} s={s} />
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}