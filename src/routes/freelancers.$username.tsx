import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  Star,
  MapPin,
  Calendar,
  Briefcase,
  MessageSquare,
  Heart,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { GradientAvatar } from "@/components/site/avatar";
import { ServiceCard } from "@/components/site/cards";
import {
  LevelBadge,
  TrustMetricsGrid,
  EscrowShield,
  CompactTrustRow,
  SuccessScoreBadge,
} from "@/components/site/trust";
import { PortfolioGallery } from "@/components/site/profile/portfolio-gallery";
import { SkillsMatrix } from "@/components/site/profile/skills-matrix";
import { VideoIntro } from "@/components/site/profile/video-intro";
import { VerificationCenter } from "@/components/site/profile/verification-center";
import { SuccessMetrics } from "@/components/site/profile/success-metrics";
import { ProfileReviews } from "@/components/site/profile/profile-reviews";
import {
  freelancers,
  services,
  enrichFreelancer,
  getFreelancerReviews,
} from "@/lib/mock-data";

export const Route = createFileRoute("/freelancers/$username")({
  loader: ({ params }) => {
    const raw = freelancers.find((x) => x.username === params.username);
    if (!raw) throw notFound();
    const freelancer = enrichFreelancer(raw);
    const freelancerReviews = getFreelancerReviews(params.username);
    const freelancerServices = services.filter((s) => s.sellerUsername === params.username);
    return { freelancer, freelancerReviews, freelancerServices };
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
  const { freelancer: f, freelancerReviews, freelancerServices } = Route.useLoaderData();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const handleMessage = () => navigate({ to: "/messages" });
  const handleSave = () => {
    setSaved((v) => !v);
    toast.success(saved ? "Removed from saved profiles" : "Profile saved");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="font-mono mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link to="/freelancers">Talent</Link>
          <ChevronRight className="size-3" />
          <span>{f.city}</span>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{f.name}</span>
        </nav>

        {/* Premium hero */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_48px_-16px_oklch(0.546_0.185_257/0.08)]">
          <div
            className="relative h-36 sm:h-48"
            style={{
              background: `linear-gradient(120deg, oklch(0.72 0.15 ${f.hue}) 0%, oklch(0.32 0.12 ${f.hue + 50}) 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
              <LevelBadge level={f.level} className="bg-white/20 text-white backdrop-blur-sm" />
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/80">
                Member since {f.memberSince}
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="-mt-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-end gap-4">
                <GradientAvatar
                  name={f.name}
                  hue={f.hue}
                  size={112}
                  rounded="rounded-2xl"
                  className="ring-4 ring-card shadow-lg"
                />
                <div className="pb-1">
                  <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{f.name}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{f.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" /> {f.city}
                    </span>
                    <span className="text-border">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3 fill-gold text-gold" />
                      <span className="font-mono text-foreground">{f.rating.toFixed(2)}</span>
                      ({f.reviews} reviews)
                    </span>
                    <span className="text-border">·</span>
                    <span className="font-mono font-semibold text-primary">
                      ${(f.earned / 1000).toFixed(0)}k earned
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <CompactTrustRow
                      level={f.level}
                      identityVerified={f.identityVerified}
                      businessVerified={f.businessVerified}
                      successScore={f.successScore}
                    />
                  </div>
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={handleSave}
                  className={`touch-target inline-flex items-center justify-center rounded-lg border bg-surface transition-default hover:border-primary/20 focus-ring ${
                    saved ? "border-primary/30 text-primary" : "border-border"
                  }`}
                  aria-label={saved ? "Unsave profile" : "Save profile"}
                >
                  <Heart className={`size-4 ${saved ? "fill-primary" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={handleMessage}
                  className="touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-sm font-medium transition-default hover:border-primary/20 focus-ring sm:w-auto"
                >
                  <MessageSquare className="size-4" /> Message
                </button>
                <Link
                  to="/checkout"
                  search={{ type: "hire" as const, freelancer: f.username }}
                  className="touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring sm:w-auto"
                >
                  Hire — ${f.rate}/h <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <SuccessMetrics f={f} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            {/* About + video intro */}
            <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <div>
                <h2 className="font-display mb-3 text-lg font-bold">About</h2>
                <p className="leading-relaxed text-foreground/85">{f.bio}</p>
              </div>
              {f.videoIntro && (
                <VideoIntro name={f.name} hue={f.hue} duration={f.videoIntro.duration} />
              )}
            </section>

            {/* Performance & trust */}
            <section>
              <h2 className="font-display mb-4 text-lg font-bold">Performance & trust</h2>
              <div className="rounded-2xl border border-border bg-card p-5">
                <TrustMetricsGrid
                  successScore={f.successScore}
                  completionRate={f.completionRate}
                  onTimeDelivery={f.onTimeDelivery}
                  responseTime={f.responseTime}
                  repeatClients={f.repeatClients}
                />
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <EscrowShield size="sm" />
                  <SuccessScoreBadge score={f.successScore} />
                </div>
              </div>
            </section>

            {/* Skills matrix */}
            <section>
              <h2 className="font-display mb-4 text-lg font-bold">Skills matrix</h2>
              <SkillsMatrix skills={f.skillMatrix} />
            </section>

            {/* Portfolio gallery */}
            <section>
              <h2 className="font-display mb-4 text-lg font-bold">Portfolio</h2>
              <PortfolioGallery items={f.portfolio} />
            </section>

            {/* Case studies */}
            {f.caseStudies.length > 0 && (
              <section>
                <h2 className="font-display mb-4 text-lg font-bold">Case studies</h2>
                <div className="space-y-4">
                  {f.caseStudies.map((cs) => (
                    <div key={cs.title} className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
                      <div className="flex items-start gap-3">
                        <GradientAvatar name={cs.client} hue={cs.clientHue} size={40} rounded="rounded-lg" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-sm font-bold">{cs.title}</h3>
                          <div className="font-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                            {cs.client}
                          </div>
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
              <section>
                <h2 className="font-display mb-4 text-lg font-bold">Services offered</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {freelancerServices.map((s) => (
                    <ServiceCard key={s.id} s={s} />
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section>
              <h2 className="font-display mb-4 text-lg font-bold">Reviews</h2>
              <ProfileReviews reviews={freelancerReviews} />
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            {/* Quick hire CTA */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Hourly rate
                  </div>
                  <div className="font-display text-3xl font-bold">
                    ${f.rate}
                    <span className="text-lg text-muted-foreground">/h</span>
                  </div>
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
                <button
                  type="button"
                  onClick={handleMessage}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface py-2.5 text-sm font-medium transition-default hover:border-primary/20 focus-ring"
                >
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
                  { label: "Member since", value: f.memberSince, icon: Calendar },
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

            {/* Verification center */}
            <VerificationCenter items={f.verification} />

            {/* Languages */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-display mb-3 text-sm font-bold">Languages</h3>
              <ul className="space-y-2 text-sm">
                {f.languages.map((x) => (
                  <li key={x.language} className="flex items-center justify-between">
                    <span>{x.language}</span>
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
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Your payment is held in escrow and released only when you approve the milestone. 24h dispute
                    resolution guaranteed.
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
