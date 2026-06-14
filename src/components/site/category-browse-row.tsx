import { Link } from "@tanstack/react-router";
import { categories } from "@/lib/mock-data";

type Props = {
  activeSlug?: string;
  className?: string;
};

export function CategoryBrowseRow({ activeSlug, className = "" }: Props) {
  return (
    <div className={className}>
      <div className="font-mono mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        Kategoriyalar bo'yicha ko'rish
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const active = activeSlug === c.slug;
          return (
            <Link
              key={c.slug}
              to="/services/category/$slug"
              params={{ slug: c.slug }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-default ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-foreground hover:border-primary/25 hover:text-primary"
              }`}
            >
              <span aria-hidden>{c.glyph}</span>
              {c.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
