import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Star,
  Banknote,
  Zap,
  Quote,
  Lock,
  BadgeCheck,
  Clock,
} from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { UniversalSearch } from "@/components/site/search";
import { FreelancerCard, ServiceCard, ProjectCard } from "@/components/site/cards";
import { GradientAvatar } from "@/components/site/avatar";
import { freelancers, services, projects, categories } from "@/lib/mock-data";

export const Route = createFileRoute("/")({ head: () => ({ meta: [{ title: "Ishbor — The marketplace for Central Asia's best talent" }, { name: "description", content: "Hire vetted designers, engineers, and strategists across Central Asia. Secured by escrow." }] }), component: Landing });

const stats = [
  { label: "Trade Volume", value: "$42M+" },
  { label: "Verified Talent", value: "12,400" },
  { label: "Escrow Protected", value: "100%" },
  { label: "Avg. Time to Hire", value: "2h" },
];

const testimonials = [
  {
    quote:
      "We assembled our entire product team through Ishbor in three weeks. Quality on par with anything we've sourced from London.",
    name: "Sardor Mahmudov",
    role: "CTO, Asaka Capital",
    hue: 250,
  },
  {
    quote:
      "Best decision we made this year. The escrow flow is the cleanest I've used — clearer than Upwork, faster than Stripe Connect.",
    name: "Elena Park",
    role: "Founder, Aralink Labs",
    hue: 220,
  },
  {
    quote:
      "Ishbor finally treats Tashkent talent like the world-class operators they are. The Top Rated badge actually means something.",
    name: "Bekzod Tursunov",
    role: "Head of Design, Tezda",
    hue: 240,
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(50% 40% at 50% 0%, color-mix(in oklab, var(--color-primary) 14%, transparent), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, color-mix(in oklab, var(--color-primary) 50%, transparent), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="font-mono mx-auto mb-5 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-foreground backdrop-blur-sm sm:text-[10px] sm:tracking-[0.2em]">
            <span className="size-1.5 rounded-full bg-primary animate-pulse-subtle" />
            Live in Tashkent · Almaty · Bishkek · Dushanbe
          </div>
          <h1 className="font-display mx-auto max-w-4xl text-balance text-[2rem] font-extrabold leading-[1.06] tracking-[-0.03em] sm:text-4xl sm:leading-[1.04] md:text-5xl lg:text-6xl">
            Central Asia's <span className="text-primary">premier</span> freelance marketplace.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            Hire vetted talent, post projects, and ship work — all secured by escrow.
          </p>

          <div className="mt-10">
            <UniversalSearch />
          </div>

          <div className="mt-14 grid grid-cols-2 gap-y-5 border-t border-border pt-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-mono mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {s.label}
                </div>
                <div className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="eyebrow mb-2">Browse categories</div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                From classical artisans to next-wave technologies
              </h2>
            </div>
            <Link
              to="/services"
              className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
            >
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.slug}
                to="/services"
                search={{ category: c.slug }}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-default hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)]"
              >
                <div className="font-display mb-4 text-2xl text-primary">{c.glyph}</div>
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="font-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {c.count.toLocaleString()} pros
                </div>
                <ArrowUpRight className="absolute right-3 top-3 size-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="eyebrow mb-2">Top-rated specialists</div>
              <h2 className="font-display truncate text-2xl font-bold tracking-tight sm:text-3xl">
                The region's most disciplined creators
              </h2>
            </div>
            <Link
              to="/freelancers"
              className="shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline hidden sm:inline-flex"
            >
              View directory <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
            {freelancers.slice(0, 6).map((f) => (
              <FreelancerCard key={f.id} f={f} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-foreground py-20 text-background">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-1/2 size-[500px] -translate-y-1/2 translate-x-1/3 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--color-primary) 30%, transparent), transparent)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-2 md:items-center">
          <div>
            <div className="font-mono mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
              Built for trust
            </div>
            <h2 className="font-display text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Enterprise-grade security. <span className="font-serif-italic font-medium">Startup</span> speed.
            </h2>
            <p className="mt-3 max-w-md text-sm text-background/60 leading-relaxed">
              Every transaction is escrow-protected. Every freelancer is identity-verified. Every dispute is resolved within 24 hours.
            </p>
          </div>
          <div className="space-y-2.5">
            {[
              {
                icon: Lock,
                title: "Escrow Protection",
                body: "Funds are held securely until you approve the final milestone.",
              },
              {
                icon: BadgeCheck,
                title: "Verified Credentials",
                body: "Every freelancer passes a multi-stage background and skill check.",
              },
              {
                icon: Banknote,
                title: "Instant Local Payouts",
                body: "Withdraw to Humo, Uzcard, Kaspi, or SWIFT in under 60 seconds.",
              },
              {
                icon: Clock,
                title: "24h Dispute Resolution",
                body: "Independent mediators resolve every dispute within 24 hours.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3.5 rounded-xl border border-white/8 bg-white/4 p-4 backdrop-blur-sm"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                  <f.icon className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{f.title}</h4>
                  <p className="mt-0.5 text-xs text-background/55 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="eyebrow mb-2">Open projects</div>
              <h2 className="font-display truncate text-2xl font-bold tracking-tight sm:text-3xl">
                Bid on contracts from across the region
              </h2>
            </div>
            <Link
              to="/projects"
              className="shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline hidden sm:inline-flex"
            >
              See all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {projects.slice(0, 4).map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="eyebrow mb-2">Premium services</div>
              <h2 className="font-display truncate text-2xl font-bold tracking-tight sm:text-3xl">
                Productized work, ready to ship
              </h2>
            </div>
            <Link
              to="/services"
              className="shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline hidden sm:inline-flex"
            >
              Browse services <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 4).map((s) => (
              <ServiceCard key={s.id} s={s} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="eyebrow mb-2">Trusted by builders</div>
            <h2 className="font-display mx-auto max-w-2xl text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              From scrappy founders to national institutions
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure
                key={i}
                className="flex flex-col rounded-xl border border-border bg-card p-5 transition-default hover:border-primary/15"
              >
                <Quote className="mb-3 size-4 text-primary/60" />
                <blockquote
                  className="flex-1 text-balance text-sm leading-relaxed text-foreground/85"
                  dangerouslySetInnerHTML={{ __html: t.quote }}
                />
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                  <GradientAvatar name={t.name} hue={t.hue} size={32} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{t.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{t.role}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5 text-gold">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="size-3 fill-current" />
                    ))}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
            Start hiring <span className="text-primary">today</span>.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Post your first project free. Receive proposals within hours, not days.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <Link
              to="/projects"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring"
            >
              Post a project
            </Link>
            <Link
              to="/freelancers"
              className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-default hover:border-foreground/20 focus-ring"
            >
              Browse talent
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}