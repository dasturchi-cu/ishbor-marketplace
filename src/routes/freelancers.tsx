import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { FreelancerCard } from "@/components/site/cards";
import { CardSkeleton } from "@/components/site/feedback";
import { freelancers } from "@/lib/mock-data";
import { usePageReady } from "@/hooks/use-page-ready";

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
  const ready = usePageReady();

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

          <div className="mt-6 flex flex-col gap-2 sm:mt-8 sm:gap-3">
            <div className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 focus-ring">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                placeholder="Search talent…"
                className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="flex gap-2">
              <button className="touch-target inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
                <SlidersHorizontal className="size-4" /> Filters
              </button>
              <button className="touch-target inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
                Sort <ChevronDown className="size-4" />
              </button>
            </div>
          </div>

          <div className="mobile-scroll-x -mx-1 mt-4 flex gap-2 px-1 sm:flex-wrap sm:px-0">
            {filters.map((f, i) => (
              <button
                key={f}
                className={`touch-target shrink-0 rounded-lg border px-3 text-xs font-medium transition-default ${
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
          {!ready
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            : [...freelancers, ...freelancers].map((f, i) => <FreelancerCard key={i} f={f} />)}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}