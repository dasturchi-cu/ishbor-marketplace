import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Star, MapPin, Calendar, Briefcase, MessageSquare, Heart, ArrowRight, Check, ChevronRight } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { GradientAvatar } from "@/components/site/avatar";
import { ServiceCard } from "@/components/site/cards";
import { LevelBadge, VerifiedIdentityBadge, VerifiedBusinessBadge, SuccessScoreBadge, TrustMetricsGrid, EscrowShield, CompactTrustRow } from "@/components/site/trust";
import { freelancers, services, reviews } from "@/lib/mock-data";

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
  const freelancerServices = services.filter((s) => s.sellerUsername === f.username);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="font-mono mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link to="/freelancers">Talent</Link>
          <span>/</span>
          <span>{f.city}</span>
        </nav>

        {/* Hero card with trust badges */}
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
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{f.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" /> {f.city}
                    </span>
                    <span className="text-border">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3 fill-gold text-gold" />
                      <span className="font-mono text-foreground">{f.rating.toFixed(2)}</span>
                      ({f.reviews})
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <CompactTrustRow level={f.level} identityVerified={f.identityVerified} businessVerified={f.businessVerified} successScore={f.successScore} />
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
                <Link
                  to="/checkout"
                  search={{ type: "hire" as const, freelancer: f.username }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring"
                >
                  Hire — ${f.rate}/h
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            {/* About */}
            <section>
              <h2 className="font-display mb-3 text-lg font-bold">About</h2>
              <p className="text-foreground/85 leading-relaxed">{f.bio}</p>
            </section>

            {/* Trust metrics — prominent section */}
            <section className="mt-8">
              <h2 className="font-display mb-4 text-lg font-bold">Performance & trust</h2>
              <div className="rounded-2xl border border-border bg-card p-5">
                <TrustMetricsGrid successScore={f.successScore} completionRate={f.completionRate} onTimeDelivery={f.onTimeDelivery} responseTime={f.responseTime} repeatClients={f.repeatClients} />
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <EscrowShield size="sm" />
                  {f.businessVerified && <VerifiedBusinessBadge />}
                  <VerifiedIdentityBadge />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    ${(f.earned / 1000).toFixed(0)}k total earned
                  </span>
                </div>
              </div>
            </section>

            {/* Skills */}
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

            {/* Portfolio highlights */}
            <section className="mt-10">
              <h2 className="font-display mb-4 text-lg font-bold">Portfolio highlights</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {f.portfolio.map((p, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-xl border border-border transition-default hover:border-primary/20 hover:-translate-y-0.5">
                    <div
                      className="grain aspect-[4/5] w-full"
                      style={{
                        background: `linear-gradient(${130 + i * 20}deg, oklch(0.72 0.15 ${p.hue}) 0%, oklch(0.32 0.14 ${(p.hue + 40) % 360}) 100%)`,
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <div className="text-xs font-semibold text-white">{p.title}</div>
                      <div className="font-mono text-[10px] text-white/60">{p.category} · {p.year}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Case studies */}
            {f.caseStudies.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display mb-4 text-lg font-bold">Case studies</h2>
                <div className="space-y-4">
                  {f.caseStudies.map((cs) => (
                    <div key={cs.title} className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
                      <div className="flex items-start gap-3">
                        <GradientAvatar name={cs.client} hue={cs.clientHue} size={40} rounded="rounded-lg" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-sm font-bold">{cs.title}</h3>
                          <div className="font-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{cs.client}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/10 bg-background px-3 py-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Result</span>
                        <span className="text-sm font-semibold text-foreground">{cs.result}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Services offered */}
            {freelancerServices.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display mb-4 text-lg font-bold">Services offered</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {freelancerServices.map((s) => (
                    <ServiceCard key={s.id} s={s} />
                  ))}
                </div>
              </section>
            )}

            {/* Work history / reviews */}
            <section className="mt-10">
              <h2 className="font-display mb-4 text-lg font-bold">Work history</h2>
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <GradientAvatar name={r.from} hue={r.fromHue} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{r.from}</span>
                          <div className="flex items-center text-gold">
                            {Array.from({ length: r.rating }).map((_, i) => (
                              <Star key={i} className="size-3 fill-current" />
                            ))}
                          </div>
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {r.project} · {r.date}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/85">{r.body}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            {/* Quick hire CTA */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Hourly rate</div>
                  <div className="font-display text-3xl font-bold">${f.rate}<span className="text-lg text-muted-foreground">/h</span></div>
                </div>
                <EscrowShield size="md" />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                {f.available ? (
                  <span className="inline-flex items-center gap-1.5 text-success">
                    <span className="size-1.5 rounded-full bg-success animate-pulse-subtle" />
                    Available now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-muted-foreground" />
                    Currently busy
                  </span>
                )}
                <span className="text-border">·</span>
                <span>Responds {f.responseTime}</span>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  to="/checkout"
                  search={{ type: "hire" as const, freelancer: f.username }}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring"
                >
                  Hire now <ArrowRight className="size-3.5" />
                </Link>
                <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface py-2.5 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
                  <MessageSquare className="size-3.5" /> Send message
                </button>
              </div>
            </div>

            {/* Stats sidebar */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="grid grid-cols-2 gap-y-4">
                {[
                  { label: "Earned", value: `$${(f.earned / 1000).toFixed(0)}k`, icon: Briefcase },
                  { label: "Jobs", value: f.jobs, icon: Briefcase },
                  { label: "Member since", value: "2022", icon: Calendar },
                  { label: "Response", value: f.responseTime, icon: MessageSquare },
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

            {/* Verification card */}
            <div className="rounded-xl border border-success/20 bg-success/5 p-5">
              <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-success">
                Ishbor Trust Verified
              </div>
              <ul className="space-y-2">
                {[
                  { label: "Pasport ID", done: f.identityVerified },
                  { label: "Business entity", done: f.businessVerified },
                  { label: "Phone number", done: true },
                  { label: "Email address", done: true },
                  { label: "Payment method", done: true },
                ].map((v) => (
                  <li key={v.label} className="flex items-center gap-2 text-sm">
                    <Check className={`size-3.5 ${v.done ? "text-success" : "text-muted-foreground"}`} />
                    <span className={v.done ? "text-foreground" : "text-muted-foreground"}>{v.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Languages */}
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

            {/* Escrow guarantee */}
            <div className="rounded-xl border border-primary/20 bg-primary/8 p-5">
              <div className="flex items-start gap-3">
                <EscrowShield size="md" className="shrink-0" />
                <div>
                  <div className="text-sm font-semibold">Payment protected</div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Your payment is held in escrow and released only when you approve the milestone. 24h dispute resolution guaranteed.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
