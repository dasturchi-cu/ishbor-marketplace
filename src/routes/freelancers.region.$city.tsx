import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useSyncExternalStore } from "react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { FreelancerCard } from "@/components/site/cards";
import { EmptyState } from "@/components/site/feedback";
import { freelancers } from "@/lib/mock-data";
import {
  getAllDiscoverableFreelancers,
  subscribeDiscoverableFreelancers,
} from "@/lib/freelancer-profile-resolver";
import { buildPageMeta, buildJsonLdHead, buildBreadcrumbJsonLd } from "@/lib/seo";
import { Users } from "lucide-react";

const REGION_MAP: Record<string, { label: string; match: string[] }> = {
  toshkent: { label: "Toshkent", match: ["Tashkent", "Toshkent"] },
  samarqand: { label: "Samarqand", match: ["Samarkand", "Samarqand"] },
  buxoro: { label: "Buxoro", match: ["Bukhara", "Buxoro"] },
  almaty: { label: "Olmaota", match: ["Almaty", "Olmaota"] },
};

export const Route = createFileRoute("/freelancers/region/$city")({
  loader: ({ params }) => {
    const region = REGION_MAP[params.city.toLowerCase()];
    return { city: params.city, region: region ?? null };
  },
  head: ({ loaderData }) => {
    const label = loaderData?.region?.label ?? loaderData?.city ?? "Mintaqa";
    const path = `/freelancers/region/${loaderData?.city ?? ""}`;
    return {
      ...buildPageMeta({
        title: `${label} frilanserlari — Ishbor`,
        description: `${label} shahrida tekshirilgan frilanserlar. Eskrou himoyasi va mahalliy to'lovlar bilan xavfsiz yollash.`,
        path,
      }),
      ...buildJsonLdHead(
        buildBreadcrumbJsonLd([
          { name: "Bosh sahifa", path: "/" },
          { name: "Frilanserlar", path: "/freelancers" },
          { name: label },
        ]),
      ),
    };
  },
  component: RegionFreelancersPage,
});

function RegionFreelancersPage() {
  const { city, region } = Route.useLoaderData();
  const discoverable = useSyncExternalStore(
    subscribeDiscoverableFreelancers,
    getAllDiscoverableFreelancers,
    () => freelancers,
  );

  const filtered = useMemo(() => {
    if (!region) return [];
    return discoverable.filter((f) =>
      region.match.some((m) => f.city?.toLowerCase().includes(m.toLowerCase())),
    );
  }, [discoverable, region]);

  if (!region) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Mintaqa topilmadi</h1>
          <Link to="/freelancers" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Barcha frilanserlarga qaytish
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="eyebrow mb-3">Bozor · Mintaqa</div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            {region.label} frilanserlari
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            {region.label} shahrida ishlaydigan tekshirilgan mutaxassislar. Eskrou himoyasi bilan xavfsiz yollash.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">{filtered.length} frilanser topildi</p>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Hozircha frilanser yo'q"
            description={`${region.label} uchun frilanserlar tez orada qo'shiladi.`}
            action={
              <Link to="/freelancers" className="text-sm font-medium text-primary hover:underline">
                Barcha frilanserlar
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((f) => (
              <FreelancerCard key={f.username} f={f} />
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-2">
          {Object.entries(REGION_MAP).map(([slug, r]) => (
            <Link
              key={slug}
              to="/freelancers/region/$city"
              params={{ city: slug }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-default ${
                slug === city.toLowerCase()
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
