import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

type FooterLink = {
  to: string;
  label: string;
  search?: Record<string, string>;
  params?: Record<string, string>;
};

const cols: { title: string; links: FooterLink[] }[] = [
  {
    title: "Bozor",
    links: [
      { to: "/services", label: "Barcha xizmatlar" },
      { to: "/services/category/$slug", params: { slug: "design" }, label: "Dizayn va brend" },
      { to: "/services/category/$slug", params: { slug: "development" }, label: "Dasturlash" },
      { to: "/services/category/$slug", params: { slug: "marketing" }, label: "Marketing" },
      { to: "/freelancers", label: "Mutaxassislarni ko'rish" },
      { to: "/projects", label: "Loyihalarni ko'rish" },
      { to: "/projects/preview", label: "Loyiha rejasini tuzish" },
    ],
  },
  {
    title: "Ish",
    links: [
      { to: "/login", label: "Mijoz paneli", search: { redirect: "/dashboard" } },
      { to: "/login", label: "Frilanser paneli", search: { redirect: "/dashboard/freelancer" } },
      { to: "/login", label: "Hamyon va eskrou", search: { redirect: "/wallet" } },
      { to: "/pricing", label: "Tariflar" },
    ],
  },
  {
    title: "Kompaniya",
    links: [
      { to: "/terms", label: "Savdo shartlari" },
      { to: "/privacy", label: "Maxfiylik" },
      { to: "/register", label: "Ishborda qo'shilish" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-elevated/30">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_2fr]">
          <div className="max-w-sm space-y-3">
            <Logo />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Markaziy Osiyoning mustaqil ijodkorlari, muhandislari va strateglari
              uchun premium bozor. Eskrou himoyasi, UZS yoki USD da to'lov.
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="size-1.5 rounded-full bg-success animate-pulse-subtle" />
                Barcha tizimlar normal
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-8">
            {cols.map((c) => (
              <div key={c.title} className="space-y-2.5">
                <h5 className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {c.title}
                </h5>
                <ul className="space-y-2 text-sm">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        params={l.params}
                        search={l.search}
                        className="text-muted-foreground transition-default hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <div>(c) 2026 Ishbor Marketplace · Toshkent, O'zbekiston</div>
          <div className="flex items-center gap-5">
            <Link to="/terms" className="transition-default hover:text-foreground">
              Savdo shartlari
            </Link>
            <Link to="/privacy" className="transition-default hover:text-foreground">
              Maxfiylik
            </Link>
            <span className="font-mono">UZ · EN · RU</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
