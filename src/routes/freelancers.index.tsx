import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { saveMarketplaceSearch } from "@/lib/alerts-store";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { FreelancerCard } from "@/components/site/cards";
import { CardSkeleton, EmptyState } from "@/components/site/feedback";
import { freelancers } from "@/lib/mock-data";
import {
  getAllDiscoverableFreelancers,
  subscribeDiscoverableFreelancers,
} from "@/lib/freelancer-profile-resolver";
import { usePageReady } from "@/hooks/use-page-ready";
import { MarketplaceToolbar, useMarketplaceSearch } from "@/components/site/marketplace-toolbar";
import { MarketplacePulseMini } from "@/components/site/marketplace-pulse-mini";
import { filterFreelancers, normalizeSearch, type MarketplaceSearch } from "@/lib/marketplace";
import { Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import {
  applyPersonalizedFreelancerOrder,
  getRecommendationsVersion,
  shouldPersonalizeList,
  subscribeRecommendations,
} from "@/lib/recommendations";
import { buildPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/freelancers/")({
  validateSearch: (search: Record<string, unknown>): MarketplaceSearch => normalizeSearch(search),
  head: () =>
    buildPageMeta({
      title: "Iste'dod topish — Ishbor",
      description: "Markaziy Osiyo bo'ylab tekshirilgan frilanserlar yollang.",
      path: "/freelancers",
    }),
  component: FreelancersPage,
});

const filterChips = [
  { key: "top-rated", label: "Eng yuqori reyting" },
  { key: "available", label: "Hozir mavjud" },
  { key: "under-50", label: "$50/soatdan past" },
  { key: "tashkent", label: "Tashkent" },
  { key: "verified", label: "Shaxs tasdiqlangan" },
  { key: "trust", label: "Yuqori ishonch" },
];

function FreelancersPage() {
  const ready = usePageReady();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeRole } = useActiveRole();
  const search = Route.useSearch();
  const setSearch = useMarketplaceSearch(search, "/freelancers");
  const recVersion = useSyncExternalStore(subscribeRecommendations, getRecommendationsVersion, () => 0);
  const discoverable = useSyncExternalStore(
    subscribeDiscoverableFreelancers,
    getAllDiscoverableFreelancers,
    () => freelancers,
  );
  const filtered = useMemo(() => {
    const base = filterFreelancers(discoverable, search);
    if (user && activeRole === "client" && shouldPersonalizeList(search)) {
      return applyPersonalizedFreelancerOrder(base, user.id);
    }
    return base;
  }, [search, user?.id, activeRole, recVersion, discoverable]);

  const handleSaveSearch = () => {
    const q = search.q ?? "";
    if (!q.trim()) {
      toast.error("Qidiruv so'zini kiriting");
      return;
    }
    if (!user) {
      navigate({ to: "/login", search: { redirect: "/freelancers" } });
      return;
    }
    const result = saveMarketplaceSearch(user.id, {
      q,
      type: "freelancers",
      filter: search.filter,
    });
    if ("error" in result) toast.error(result.error);
    else toast.success("Qidiruv saqlandi");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="eyebrow mb-3">Bozor · Iste'dod</div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
            <span className="font-serif-italic font-medium text-primary">Elita</span> Markaziy Osiyo iste'dodini yollang.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Har bir frilanser shaxsi tasdiqlangan va kasbi tekshirilgan. Soatlik yoki belgilangan.
          </p>

          <MarketplaceToolbar
            placeholder="Iste'dod qidirish…"
            q={search.q ?? ""}
            sort={search.sort ?? "ranking_score"}
            activeFilter={search.filter}
            chips={filterChips}
            resultCount={filtered.length}
            resultLabel="frilanser"
            onSearchChange={setSearch}
            showSaveSearch
            onSaveSearch={handleSaveSearch}
          />
          <MarketplacePulseMini />
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { slug: "toshkent", label: "Toshkent" },
              { slug: "samarqand", label: "Samarqand" },
              { slug: "buxoro", label: "Buxoro" },
            ].map((r) => (
              <Link
                key={r.slug}
                to="/freelancers/region/$city"
                params={{ city: r.slug }}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-default hover:border-primary/40 hover:text-primary"
              >
                {r.label}
              </Link>
            ))}
          </div>
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
            title="Frilanserlar topilmadi"
            description="Qidiruv yoki filtrlarni o'zgartirib ko'ring."
            action={
              <button onClick={() => setSearch({ q: "", filter: "", sort: "newest" })} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Filtrlarni tozalash
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 stagger-children">
            {filtered.map((f) => <FreelancerCard key={f.id} f={f} />)}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
