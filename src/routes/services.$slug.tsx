import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Star, Clock, Heart, Share2, ShieldCheck, Check, ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { GradientAvatar } from "@/components/site/avatar";
import { ServiceCard } from "@/components/site/cards";
import { services } from "@/lib/mock-data";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const s = services.find((x) => x.slug === params.slug) ?? services[0];
    if (!s) throw notFound();
    return { service: s };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.service?.title ?? "Service"} — Ishbor` },
      { name: "description", content: loaderData?.service?.title ?? "" },
    ],
  }),
  notFoundComponent: () => <div className="p-8">Service not found</div>,
  errorComponent: ({ error }) => <div className="p-8">{error.message}</div>,
  component: ServiceDetail,
});

const packages = [
  { tier: "Essential", price: 480, delivery: "7 days", revisions: 2, features: ["1 platform (iOS or Android)", "Up to 6 screens", "Static prototype"] },
  { tier: "Premium", price: 980, delivery: "12 days", revisions: 4, features: ["iOS + Android", "Up to 16 screens", "Interactive prototype", "Design tokens"] },
  { tier: "Enterprise", price: 2400, delivery: "21 days", revisions: "Unlimited", features: ["Full product suite", "Design system + handoff", "Animation specs", "30-day support"] },
];

function ServiceDetail() {
  const { service } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="font-mono mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link to="/services">Services</Link>
          <span>/</span>
          <span>{service.category}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div>
            <h1 className="font-display max-w-2xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
              {service.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <GradientAvatar name={service.seller} hue={service.sellerHue} size={28} />
                <span className="font-medium">{service.seller}</span>
              </div>
              <div className="inline-flex items-center gap-1 text-muted-foreground">
                <Star className="size-3.5 fill-gold text-gold" />
                <span className="font-mono text-foreground">{service.rating.toFixed(2)}</span>
                <span>({service.reviews} reviews)</span>
              </div>
              <div className="inline-flex items-center gap-1 text-muted-foreground">
                <Clock className="size-3.5" />
                {service.delivery} delivery
              </div>
            </div>

            <div
              className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border"
              style={{
                background: `linear-gradient(135deg, oklch(0.72 0.15 ${service.hue}) 0%, oklch(0.42 0.12 ${service.hue + 30}) 100%)`,
              }}
            >
              <div
                className="grain h-full w-full"
                style={{
                  background:
                    "radial-gradient(60% 60% at 30% 20%, rgba(255,255,255,0.18), transparent 70%)",
                }}
              />
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                "Verified portfolio",
                "Escrow protected",
                "24h response time",
              ].map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-2 rounded-xl border border-border bg-primary/8 p-3 text-sm text-primary"
                >
                  <ShieldCheck className="size-4" />
                  {b}
                </div>
              ))}
            </div>

            <section className="mt-12">
              <h2 className="font-display mb-4 text-2xl font-bold tracking-tight">About this service</h2>
              <p className="text-foreground/85 leading-relaxed">
                You'll receive a production-grade design system tailored for a regulated
                financial product. I've shipped retail banking apps for two regional
                neobanks and consulted on a digital payments rollout for the national post.
                Every deliverable comes with motion specs, accessibility annotations, and a
                handoff session for your engineering team.
              </p>
              <p className="mt-4 text-foreground/85 leading-relaxed">
                I work in 2-week sprints with weekly Loom updates and a dedicated Slack
                channel. Localization-first — Cyrillic, Latin, Arabic scripts handled with
                proper kerning and weight pairings.
              </p>

              <h3 className="font-display mt-10 text-lg font-bold">What's included</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  "Brand-aligned mobile UI",
                  "Component library in Figma",
                  "Design tokens (CSS / JSON)",
                  "Motion specifications",
                  "Accessibility audit (AA)",
                  "Engineering handoff session",
                ].map((i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-primary" /> {i}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12 border-t border-border pt-8">
              <h2 className="font-display mb-6 text-2xl font-bold tracking-tight">Reviews</h2>
              <div className="space-y-5">
                {[
                  { name: "Sardor M.", hue: 200, rating: 5, body: "Best investment we made this quarter. Nargiza delivered ahead of schedule and the design system is something we'll use for years.", time: "2 weeks ago" },
                  { name: "Aisha K.", hue: 320, rating: 5, body: "Exceptional eye for typography. The Cyrillic pairing alone was worth the entire engagement.", time: "1 month ago" },
                  { name: "Daniyar B.", hue: 22, rating: 5, body: "Communication is on a different level. Felt like working with a senior product partner, not a contractor.", time: "1 month ago" },
                ].map((r) => (
                  <div key={r.name} className="rounded-2xl border border-border bg-card p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <GradientAvatar name={r.name} hue={r.hue} size={36} />
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{r.name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {r.time}
                        </div>
                      </div>
                      <div className="flex items-center text-gold">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p
                      className="text-sm text-foreground/85"
                      dangerouslySetInnerHTML={{ __html: r.body }}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="grid grid-cols-3 border-b border-border bg-elevated/40 text-xs">
                {packages.map((p, i) => (
                  <button
                    key={p.tier}
                    className={`py-3 font-mono uppercase tracking-widest transition-default ${
                      i === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary/20"
                    }`}
                  >
                    {p.tier}
                  </button>
                ))}
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <div className="eyebrow">Premium package</div>
                  <div className="font-display mt-1 text-4xl font-bold tracking-tight">
                    ${packages[1]!.price.toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Production-grade mobile design system for fintech, with full handoff.
                </p>
                <ul className="space-y-2 text-sm">
                  {packages[1]!.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="size-4 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
                  <div>
                    <div className="font-mono uppercase tracking-widest text-muted-foreground">
                      Delivery
                    </div>
                    <div className="mt-0.5 text-sm font-semibold">{packages[1]!.delivery}</div>
                  </div>
                  <div>
                    <div className="font-mono uppercase tracking-widest text-muted-foreground">
                      Revisions
                    </div>
                    <div className="mt-0.5 text-sm font-semibold">{packages[1]!.revisions}</div>
                  </div>
                </div>
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)]">
                  Continue ($980) <ArrowRight className="size-4" />
                </button>
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface py-3 text-sm font-semibold transition-default hover:border-primary/20">
                  Contact seller
                </button>
                <div className="flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <button className="inline-flex items-center gap-1 hover:text-foreground">
                    <Heart className="size-3.5" /> Save
                  </button>
                  <button className="inline-flex items-center gap-1 hover:text-foreground">
                    <Share2 className="size-3.5" /> Share
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-20 border-t border-border pt-12">
          <h2 className="font-display mb-6 text-2xl font-bold tracking-tight">Related services</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 4).map((s) => (
              <ServiceCard key={s.id} s={s} />
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}