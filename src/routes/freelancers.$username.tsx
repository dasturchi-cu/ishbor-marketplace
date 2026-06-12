import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Star, MapPin, ShieldCheck, Calendar, Briefcase, MessageSquare, Heart } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { GradientAvatar } from "@/components/site/avatar";
import { ServiceCard } from "@/components/site/cards";
import { freelancers, services } from "@/lib/mock-data";

export const Route = createFileRoute("/freelancers/$username")({
  loader: ({ params }) => {
    const f = freelancers.find((x) => x.username === params.username) ?? freelancers[0];
    if (!f) throw notFound();
    return { freelancer: f };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.freelancer?.name ?? "Freelancer"} — Ishbor` },
      { name: "description", content: loaderData?.freelancer?.title ?? "" },
    ],
  }),
  notFoundComponent: () => <div className="p-8">Profile not found</div>,
  errorComponent: ({ error }) => <div className="p-8">{error.message}</div>,
  component: FreelancerProfile,
});

function FreelancerProfile() {
  const { freelancer: f } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="font-mono mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link to="/freelancers">Talent</Link>
          <span>/</span>
          <span>{f.city}</span>
        </nav>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div
            className="h-32 sm:h-40"
            style={{
              background: `linear-gradient(120deg, oklch(0.72 0.15 ${f.hue}) 0%, oklch(0.32 0.12 ${f.hue + 50}) 100%)`,
            }}
          />
          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <GradientAvatar
                  name={f.name}
                  hue={f.hue}
                  size={96}
                  rounded="rounded-2xl"
                  className="ring-4 ring-card"
                />
                <div className="pb-2">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                      {f.name}
                    </h1>
                    <ShieldCheck className="size-5 text-success" />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{f.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" /> {f.city}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3 fill-gold text-gold" />
                      <span className="font-mono text-foreground">{f.rating.toFixed(2)}</span>
                      ({f.reviews})
                    </span>
                    <span
                      className={`font-mono uppercase tracking-widest ${
                        f.level === "Top Rated" ? "text-primary" : "text-gold"
                      }`}
                    >
                      {f.level}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface transition-default hover:border-primary/20 focus-ring">
                  <Heart className="size-4" />
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
                  <MessageSquare className="size-4" /> Message
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring">
                  Hire — ${f.rate}/h
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <section>
              <h2 className="font-display mb-3 text-lg font-bold">About</h2>
              <p className="text-foreground/85 leading-relaxed">{f.bio}</p>
            </section>

            <section className="mt-10">
              <h2 className="font-display mb-4 text-lg font-bold">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {f.skills.map((s: string) => (
                  <span
                    key={s}
                    className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="font-display mb-4 text-lg font-bold">Portfolio</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="grain aspect-[4/5] overflow-hidden rounded-xl border border-border"
                    style={{
                      background: `linear-gradient(${130 + i * 20}deg, oklch(0.72 0.15 ${
                        (f.hue + i * 30) % 360
                      }) 0%, oklch(0.32 0.14 ${(f.hue + i * 40 + 30) % 360}) 100%)`,
                    }}
                  />
                ))}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="font-display mb-4 text-lg font-bold">Services offered</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {services.slice(0, 2).map((s) => (
                  <ServiceCard key={s.id} s={s} />
                ))}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="font-display mb-4 text-lg font-bold">Work history</h2>
              <div className="space-y-4">
                {[
                  { title: "Fintech app redesign", client: "Asaka Capital", rating: 5, body: "Top 1% talent. Hired again." },
                  { title: "Brand identity system", client: "Hunar Bazaar", rating: 5, body: "Exceptional eye, sharp delivery." },
                  { title: "Pitch deck — Series A", client: "Aralink Labs", rating: 5, body: "Closed our round. Worth every cent." },
                ].map((w) => (
                  <div key={w.title} className="rounded-2xl border border-border bg-card p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold">{w.title}</h3>
                      <div className="flex items-center gap-0.5 text-gold">
                        {Array.from({ length: w.rating }).map((_, i) => (
                          <Star key={i} className="size-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <div className="font-mono mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                      {w.client}
                    </div>
                    <p className="text-sm text-foreground/85">{w.body}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="grid grid-cols-2 gap-y-4">
                {[
                  { label: "Earned", value: `$${(f.earned / 1000).toFixed(0)}k`, icon: Briefcase },
                  { label: "Jobs", value: f.jobs, icon: Briefcase },
                  { label: "Member since", value: "2022", icon: Calendar },
                  { label: "Response", value: "< 2h", icon: MessageSquare },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="font-mono mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                      <s.icon className="size-3" /> {s.label}
                    </div>
                    <div className="font-display text-lg font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-display mb-3 text-sm font-bold">Languages</h3>
              <ul className="space-y-2 text-sm">
                {[
                  { l: "Uzbek", level: "Native" },
                  { l: "Russian", level: "Fluent" },
                  { l: "English", level: "Professional" },
                ].map((x) => (
                  <li key={x.l} className="flex items-center justify-between">
                    <span>{x.l}</span>
                    <span className="font-mono text-xs text-muted-foreground">{x.level}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/8 p-5">
              <div className="font-mono mb-1 text-[10px] uppercase tracking-widest text-primary">
                Verified
              </div>
              <p className="text-sm">
                Pasport ID, phone, email, and payment method verified by Ishbor Trust.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}