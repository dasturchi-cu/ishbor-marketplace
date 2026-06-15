import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  Star,
  MapPin,
  Calendar,
  Briefcase,
  MessageSquare,
  ArrowRight,
  ChevronRight,
  Share2,
  UserPlus,
  X,
} from "lucide-react";
import { useState, useSyncExternalStore, useEffect, useMemo } from "react";
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
import { PortfolioPreviewGrid } from "@/components/portfolio/portfolio-preview-card";
import { SkillsMatrix } from "@/components/site/profile/skills-matrix";
import { VerificationCenter } from "@/components/site/profile/verification-center";
import { SuccessMetrics } from "@/components/site/profile/success-metrics";
import { VideoIntro } from "@/components/site/profile/video-intro";
import { ProfileReviews } from "@/components/site/profile/profile-reviews";
import { ConversionFlowBanner, FREELANCER_HIRE_CHECKOUT_FLOW } from "@/components/site/conversion-flow";
import { SaveButtonInline } from "@/components/site/save-button";
import {
  freelancers,
  services,
  enrichFreelancer,
  getFreelancerReviews,
} from "@/lib/mock-data";
import { getReviewsForFreelancer } from "@/lib/reviews-store";
import { useAuth } from "@/hooks/use-auth";
import { getMyPublishedProjects, subscribeProjects } from "@/lib/projects-store";
import { createDirectHireApplication } from "@/lib/applications-store";
import { getPublishedPortfoliosByUsername, subscribePortfolios } from "@/lib/portfolio-store";
import type { PortfolioItem } from "@/lib/portfolio-types";
import { computeSuccessScore, computeResponseRate, formatResponseTime } from "@/lib/growth-metrics";
import { ReputationBadge } from "@/components/reputation/reputation-badge";
import { computeFreelancerReputation } from "@/lib/reputation-store";
import { ClientCheckoutLink } from "@/components/checkout/client-checkout-link";
import { useClientCheckout } from "@/hooks/use-client-checkout";
import { ensureClientRoleForCheckout } from "@/lib/client-checkout";
import { getOrdersForFreelancer } from "@/lib/orders-store";
import { recordProfileView, recordContactClick, getEntityEventCount } from "@/lib/analytics-utils";
import { FeaturedPurchaseCard } from "@/components/analytics/featured-purchase-card";
import { isProfileFeatured } from "@/lib/featured-store";
import { EntityNotFound } from "@/components/site/entity-not-found";

const EMPTY_PROJECTS: never[] = [];
const EMPTY_PORTFOLIO: PortfolioItem[] = [];

type ProfileTab = "about" | "portfolio" | "services" | "reviews";

const profileTabs: { key: ProfileTab; label: string }[] = [
  { key: "about", label: "Haqida" },
  { key: "portfolio", label: "Portfel" },
  { key: "services", label: "Xizmatlar" },
  { key: "reviews", label: "Sharhlar" },
];

export const Route = createFileRoute("/freelancers/$username")({
  loader: ({ params }) => {
    const raw = freelancers.find((x) => x.username === params.username);
    if (!raw) throw notFound();
    const freelancer = enrichFreelancer(raw);
    const storedReviews = getReviewsForFreelancer(params.username).filter(
      (r) => r.direction !== "freelancer_to_client",
    );
    const freelancerReviews = storedReviews.length > 0 ? storedReviews : getFreelancerReviews(params.username);
    const freelancerServices = services.filter((s) => s.sellerUsername === params.username);
    return { freelancer, freelancerReviews, freelancerServices };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.freelancer?.name ?? "Frilanser"} — Ishbor` },
      { name: "description", content: loaderData?.freelancer?.title ?? "" },
    ],
  }),
  notFoundComponent: () => (
    <EntityNotFound
      title="Profil topilmadi"
      description="Bu frilanser mavjud emas yoki profil o'chirilgan."
      backTo="/freelancers"
      backLabel="Frilanserlarni ko'rish"
    />
  ),
  component: FreelancerProfile,
});

function FreelancerProfile() {
  const { freelancer: f, freelancerReviews, freelancerServices } = Route.useLoaderData();
  const navigate = useNavigate();
  const goCheckout = useClientCheckout();
  const { user, isAuthenticated } = useAuth();
  const [showInvite, setShowInvite] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [activeTab, setActiveTab] = useState<ProfileTab>("about");
  const myProjects = useSyncExternalStore(
    subscribeProjects,
    () => (user ? getMyPublishedProjects(user.id) : EMPTY_PROJECTS),
    () => EMPTY_PROJECTS,
  );
  const portfolioItems = useSyncExternalStore(
    subscribePortfolios,
    () => getPublishedPortfoliosByUsername(f.username),
    () => EMPTY_PORTFOLIO,
  );

  const isOwnProfile = user?.username === f.username;
  const liveSuccess = useMemo(() => computeSuccessScore(f.username), [f.username]);
  const liveResponse = useMemo(() => computeResponseRate(f.username), [f.username]);
  const liveEarned = useMemo(
    () => getOrdersForFreelancer(f.username).filter((o) => o.status === "completed").reduce((s, o) => s + o.amount, 0),
    [f.username],
  );
  const profileViews = useMemo(() => getEntityEventCount("profile_view", f.username), [f.username]);
  const responseTimeLabel = formatResponseTime(liveResponse.medianMinutes);

  useEffect(() => {
    recordProfileView(f.username);
  }, [f.username]);

  const liveMetrics = {
    earned: liveEarned,
    jobs: liveSuccess.completedJobs,
    successScore: liveSuccess.score,
    onTimeDelivery: liveSuccess.onTimeRate,
    repeatClients: liveSuccess.repeatClientRate,
  };
  const reputation = computeFreelancerReputation(f.username);

  const handleShare = async () => {
    const url = `${window.location.origin}/freelancers/${f.username}`;
    if (navigator.share) {
      await navigator.share({ title: f.name, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Profil havolasi nusxalandi");
  };

  const handleInvite = () => {
    if (!isAuthenticated) {
      navigate({ to: "/login", search: { redirect: `/freelancers/${f.username}` } });
      return;
    }
    ensureClientRoleForCheckout();
    if (myProjects.length === 0) {
      toast.info("Avval loyiha joylang", { description: "Frilanserlarni taklif qilishdan oldin loyiha yarating." });
      navigate({ to: "/projects/create" });
      return;
    }
    setSelectedProject(myProjects[0]!.slug);
    setShowInvite(true);
  };

  const confirmInvite = () => {
    const project = myProjects.find((p) => p.slug === selectedProject);
    if (!project || !user) return;
    const { orderId } = createDirectHireApplication({
      projectTitle: project.title,
      projectSlug: project.slug,
      client: user.company ?? user.fullName,
      clientHue: user.avatarHue,
      clientSlug: user.companySlug,
      budget: project.budget,
      category: project.category,
      freelancerUsername: f.username,
      freelancerName: f.name,
      freelancerHue: f.hue,
    });
    setShowInvite(false);
    toast.success("Taklif yuborildi", { description: "Buyurtma yaratildi. Yollashni faollashtirish uchun eskrouni moliyalashtiring." });
    goCheckout({ type: "order", order: orderId });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <nav className="font-mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link to="/freelancers" className="transition-default hover:text-primary">Iste'dod</Link>
          <ChevronRight className="size-3 opacity-50" />
          <span>{f.city}</span>
          <ChevronRight className="size-3 opacity-50" />
          <span className="text-foreground">{f.name}</span>
        </nav>

        {/* Profil hero */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_-24px_oklch(0.546_0.185_257/0.14)]">
          <div
            className="relative h-40 sm:h-52"
            style={{
              background: `linear-gradient(135deg, oklch(0.68 0.17 ${f.hue}) 0%, oklch(0.52 0.17 257) 45%, oklch(0.28 0.11 ${f.hue + 35}) 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(255,255,255,0.22),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_100%_100%,rgba(0,0,0,0.18),transparent_60%)]" />
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
            <div className="absolute left-5 right-5 top-5 flex flex-wrap items-start justify-between gap-3 sm:left-6 sm:right-6">
              <LevelBadge level={f.level} className="border border-white/20 bg-white/15 text-white backdrop-blur-md" />
              <div className="font-mono rounded-full border border-white/15 bg-black/10 px-3 py-1 text-[10px] uppercase tracking-widest text-white/90 backdrop-blur-sm">
                A'zo bo'lgan sana: {f.memberSince}
              </div>
            </div>
          </div>

          <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-16 flex flex-col gap-6 lg:-mt-[4.5rem] lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <GradientAvatar
                  name={f.name}
                  hue={f.hue}
                  size={128}
                  rounded="rounded-2xl"
                  className="shrink-0 ring-4 ring-card shadow-[0_12px_40px_-12px_oklch(0.546_0.185_257/0.35)]"
                />
                <div className="min-w-0 pb-0.5">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem] lg:text-3xl">
                    {f.name}
                  </h1>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{f.title}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-2.5 py-1">
                      <MapPin className="size-3 text-primary" /> {f.city}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-2.5 py-1">
                      <Star className="size-3 fill-gold text-gold" />
                      <span className="font-mono font-semibold text-foreground">{f.rating.toFixed(2)}</span>
                      <span>({f.reviews} sharh)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 font-mono font-semibold text-primary">
                      ${(liveEarned / 1000).toFixed(0)}k topilgan
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <ReputationBadge tier={reputation.tier} size="md" />
                    <CompactTrustRow
                      level={f.level}
                      identityVerified={f.identityVerified}
                      businessVerified={f.businessVerified}
                      successScore={liveSuccess.score}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {f.skills.slice(0, 5).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-border bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground/80"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {!isOwnProfile && (
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto lg:min-w-[280px]">
                <ClientCheckoutLink
                  search={{ type: "hire" as const, freelancer: f.username }}
                  onClick={() => recordContactClick(f.username)}
                  className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_10px_28px_-10px_oklch(0.546_0.185_257/0.45)] transition-default hover:opacity-95 active:scale-[0.98] focus-ring"
                >
                  Yollash ${f.rate}/h <ArrowRight className="size-4" />
                </ClientCheckoutLink>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/messages"
                    onClick={() => recordContactClick(f.username)}
                    className="touch-target inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium transition-default hover:border-primary/25 hover:bg-primary/[0.03] focus-ring"
                  >
                    <MessageSquare className="size-4" /> Xabar
                  </Link>
                  {isAuthenticated && !isOwnProfile ? (
                    <>
                      <button
                        type="button"
                        onClick={handleInvite}
                        className="touch-target inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm font-semibold text-primary transition-default hover:border-primary/40 focus-ring"
                      >
                        <UserPlus className="size-4" /> Taklif qilish
                      </button>
                      <SaveButtonInline type="freelancer" id={f.username} />
                    </>
                  ) : (
                    <SaveButtonInline type="freelancer" id={f.username} label="Profilni saqlash" />
                  )}
                </div>
              </div>
              )}
            </div>

            <div className="mt-8">
              <SuccessMetrics f={f} live={liveMetrics} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
          <div className="space-y-6 min-w-0">
            <div className="flex flex-wrap gap-2 border-b border-border pb-1">
              {profileTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-default ${
                    activeTab === tab.key
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {tab.key === "portfolio" && portfolioItems.length > 0 && (
                    <span className="ml-1.5 font-mono text-[10px] opacity-70">{portfolioItems.length}</span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === "about" && (
              <div className="space-y-8">
                <section className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
                    <div className="p-6 sm:p-8">
                      <h2 className="font-display text-xl font-bold tracking-tight">Haqida</h2>
                      <p className="mt-4 max-w-prose text-base leading-relaxed text-foreground/85">{f.bio}</p>
                    </div>
                    {f.videoIntro && (
                      <div className="border-t border-border lg:border-l lg:border-t-0">
                        <VideoIntro name={f.name} hue={f.hue} duration={f.videoIntro.duration} />
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                  <h2 className="font-display text-xl font-bold tracking-tight">Natija va ishonch</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Ishborda tasdiqlangan faoliyat</p>
                  <div className="mt-6 rounded-xl border border-border bg-secondary/20 p-5">
                    <TrustMetricsGrid
                      successScore={liveSuccess.score}
                      completionRate={liveSuccess.completionRate}
                      onTimeDelivery={liveSuccess.onTimeRate}
                      responseTime={responseTimeLabel}
                      repeatClients={liveSuccess.repeatClientRate}
                    />
                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-5">
                      <EscrowShield size="sm" />
                      <SuccessScoreBadge score={liveSuccess.score} />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                  <h2 className="font-display text-xl font-bold tracking-tight">Ko'nikmalar matritsasi</h2>
                  <div className="mt-5">
                    <SkillsMatrix skills={f.skillMatrix} />
                  </div>
                </section>

                {f.caseStudies.length > 0 && (
                  <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                    <h2 className="font-display text-xl font-bold tracking-tight">Keys stadiyalar</h2>
                    <div className="mt-5 space-y-4">
                      {f.caseStudies.map((cs) => (
                        <div
                          key={cs.title}
                          className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] to-transparent p-5 transition-default hover:border-primary/25"
                        >
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
                            <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Natija</span>
                            <span className="text-sm font-semibold text-foreground">{cs.result}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === "portfolio" && (
              <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold tracking-tight">Portfel</h2>
                <p className="mt-1 text-sm text-muted-foreground">So'nggi loyihalardan tanlangan ishlar</p>
                <div className="mt-5">
                  <PortfolioPreviewGrid
                    items={portfolioItems}
                      emptyMessage="Hali joylangan portfolio elementlari yo'q."
                  />
                </div>
              </section>
            )}

            {activeTab === "services" && (
              <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold tracking-tight">Taklif etilgan xizmatlar</h2>
                {freelancerServices.length > 0 ? (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {freelancerServices.map((s) => (
                      <ServiceCard key={s.id} s={s} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">Hali xizmatlar ro'yxati yo'q.</p>
                )}
              </section>
            )}

            {activeTab === "reviews" && (
              <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold tracking-tight">Sharhlar</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.reviews} tasdiqlangan mijoz sharhi</p>
                <div className="mt-5">
                  <ProfileReviews reviews={freelancerReviews} />
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.08] via-card to-card shadow-[0_16px_48px_-20px_oklch(0.546_0.185_257/0.2)]">
              <div className="border-b border-primary/10 px-5 py-4">
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Yollash {f.name.split(" ")[0]}
                </div>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Soatlik stavka
                    </div>
                    <div className="font-display text-4xl font-bold tracking-tight">
                      ${f.rate}
                      <span className="text-xl font-medium text-muted-foreground">/h</span>
                    </div>
                  </div>
                  <EscrowShield size="md" />
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {f.available ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 font-medium text-success">
                      <span className="size-1.5 rounded-full bg-success animate-pulse-subtle" />
                      Hozir mavjud
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1">
                      <span className="size-1.5 rounded-full bg-muted-foreground" />
                      Hozir band
                    </span>
                  )}
                  <span className="text-muted-foreground/60">|</span>
                  <span>Javob beradi {f.responseTime}</span>
                </div>
                {!isOwnProfile && (
                <>
                <div className="mt-4 flex flex-col gap-2">
                  <ClientCheckoutLink
                    search={{ type: "hire" as const, freelancer: f.username }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.4)] transition-default hover:opacity-95 active:scale-[0.98] focus-ring"
                  >
                    Frilanserni yollash <ArrowRight className="size-4" />
                  </ClientCheckoutLink>
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={handleInvite}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 py-2.5 text-sm font-semibold text-primary transition-default hover:border-primary/40 focus-ring"
                    >
                      <UserPlus className="size-4" /> Loyihaga taklif qilish
                    </button>
                  )}
                  <Link
                    to="/messages"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface py-2.5 text-sm font-medium transition-default hover:border-primary/25 focus-ring"
                  >
                    <MessageSquare className="size-4" /> Xabar yuborish
                  </Link>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <SaveButtonInline type="freelancer" id={f.username} />
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-medium transition-default hover:border-primary/25 focus-ring"
                    >
                      <Share2 className="size-3.5" /> Ulashish
                    </button>
                  </div>
                </div>
                <p className="mt-4 rounded-lg bg-secondary/50 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
                  To'lov, eskrou moliyalashtirish, keyin faol buyurtma. Har bir bosqichni tasdiqlaganingizda mablag' chiqariladi.
                </p>
                </>
                )}
              </div>
            </div>

            <ConversionFlowBanner
              title="Mutaxassis yollash"
              steps={FREELANCER_HIRE_CHECKOUT_FLOW}
              currentStep="profile"
              nextHint="To'g'ridan-to'g'ri yollang yoki avval loyiha orqali taklif yuboring."
              className="rounded-2xl"
            />

            {isOwnProfile && user && (
              <FeaturedPurchaseCard
                target={{ type: "profile", slug: user.username ?? user.id, title: user.fullName }}
                featured={isProfileFeatured(user.id)}
              />
            )}

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                {[
                  { label: "Topilgan", value: `$${(liveEarned / 1000).toFixed(0)}k`, icon: Briefcase },
                  { label: "Ishlar", value: liveSuccess.completedJobs, icon: Briefcase },
                  { label: "Profil ko'rishlar", value: profileViews, icon: Calendar },
                  { label: "Javob", value: `${liveResponse.rate}%`, icon: MessageSquare },
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

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display text-sm font-bold">Tillar</h3>
              <ul className="space-y-2 text-sm">
                {f.languages.map((x) => (
                  <li key={x.language} className="flex items-center justify-between">
                    <span>{x.language}</span>
                    <span className="font-mono text-xs text-muted-foreground">{x.level}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-card p-5">
              <div className="flex items-start gap-3">
                <EscrowShield size="md" className="shrink-0" />
                <div>
                  <div className="text-sm font-semibold">To'lov himoyalangan</div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    To'lovingiz eskrouda saqlanadi va faqat bosqichni tasdiqlaganingizda chiqariladi. 24 soatlik nizo
                    hal qilish kafolatlangan.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Loyihaga taklif qilish</h3>
              <button onClick={() => setShowInvite(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Taklif qilish uchun loyihani tanlang {f.name}. Eskrou moliyalashtirish uchun buyurtma yaratiladi.
            </p>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="mt-4 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/30"
            >
              {myProjects.map((p) => (
                <option key={p.slug} value={p.slug}>{p.title} — ${p.budget.toLocaleString()}</option>
              ))}
            </select>
            <div className="mt-6 flex gap-3">
              <button
                onClick={confirmInvite}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Taklif qilish & create order
              </button>
              <button
                onClick={() => setShowInvite(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:border-primary/20"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
