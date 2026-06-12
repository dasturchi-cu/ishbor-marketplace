import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

const cols = [
  {
    title: "Marketplace",
    links: [
      { to: "/services", label: "Browse services" },
      { to: "/freelancers", label: "Browse talent" },
      { to: "/projects", label: "Browse projects" },
    ],
  },
  {
    title: "Work",
    links: [
      { to: "/dashboard", label: "Client dashboard" },
      { to: "/dashboard/freelancer", label: "Freelancer dashboard" },
      { to: "/wallet", label: "Wallet & escrow" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/", label: "About" },
      { to: "/", label: "Press" },
      { to: "/", label: "Careers" },
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
              The premium marketplace for Central Asia's independent
              creators, engineers, and strategists. Secured by escrow, paid in
              UZS or USD.
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="size-1.5 rounded-full bg-success animate-pulse-subtle" />
                All systems normal
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
          <div>(c) 2026 Ishbor Marketplace · Tashkent, Uzbekistan</div>
          <div className="flex items-center gap-5">
            <Link to="/" className="transition-default hover:text-foreground">
              Terms of trade
            </Link>
            <Link to="/" className="transition-default hover:text-foreground">
              Privacy
            </Link>
            <span className="font-mono">UZ · EN · RU</span>
          </div>
        </div>
      </div>
    </footer>
  );
}