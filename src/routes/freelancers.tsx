import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { FreelancerCard } from "@/components/site/cards";
import { freelancers } from "@/lib/mock-data";

export const Route = createFileRoute("/freelancers")({
  head: () => ({
    meta: [
      { title: "Find talent — Ishbor Marketplace" },
      { name: "description", content: "Hire vetted freelancers across Central Asia." },
    ],
  }),
  component: FreelancersPage,
});

const filters = ["All", "Top Rated", "Available Now", "Under $50/h", "Tashkent", "Verified Identity"];

function FreelancersPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="eyebrow mb-3">Marketplace · Talent</div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Hire <span className="font-serif-italic font-medium text-primary">elite</span> Central Asian talent.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Every freelancer is identity-verified and vetted for craft. Hourly or fixed.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 focus-ring">
              <Search className="size-4 text-muted-foreground" />
              <input
                placeholder='Search talent — "senior iOS engineer"'
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
              <SlidersHorizontal className="size-4" /> Filters
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
              Sort · Top Rated <ChevronDown className="size-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map((f, i) => (
              <button
                key={f}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-default ${
                  i === 0
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-foreground/80 hover:text-foreground hover:border-primary/20"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
          {[...freelancers, ...freelancers].map((f, i) => (
            <FreelancerCard key={i} f={f} />
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}