import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { ServiceCard } from "@/components/site/cards";
import { categories } from "@/lib/mock-data";
import { getPublishedServices } from "@/lib/services-store";
import { CategoryBrowseRow } from "@/components/site/category-browse-row";

export const Route = createFileRoute("/services/category/$slug")({
  head: ({ params }) => {
    const cat = categories.find((c) => c.slug === params.slug);
    const name = cat?.name ?? params.slug;
    return {
      meta: [
        { title: `${name} xizmatlari — Ishbor` },
        { name: "description", content: `Markaziy Osiyoda ${name} bo'yicha tekshirilgan frilanser xizmatlari.` },
        { property: "og:title", content: `${name} — Ishbor` },
      ],
    };
  },
  component: CategoryServicesPage,
});

function CategoryServicesPage() {
  const { slug } = Route.useParams();
  const category = categories.find((c) => c.slug === slug);
  const allServices = getPublishedServices();
  const filtered = allServices.filter((s) => {
    const q = (category?.name ?? slug).toLowerCase();
    return s.category.toLowerCase().includes(q) || s.title.toLowerCase().includes(slug);
  });

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Kategoriya topilmadi</h1>
          <Link to="/services" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Barcha xizmatlarga qaytish
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Kategoriya</div>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">
            {category.glyph} {category.name}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {category.count.toLocaleString()}+ mutaxassis. Eskrou himoyasi bilan xavfsiz yollang.
          </p>
          <CategoryBrowseRow activeSlug={slug} className="mt-6" />
        </div>
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 12).map((s) => (
              <ServiceCard key={s.id} s={s} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Hozircha bu kategoriyada xizmatlar kam.{" "}
            <Link to="/register" search={{ type: "freelancer" }} className="font-medium text-primary hover:underline">
              Birinchi xizmatni yarating
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
