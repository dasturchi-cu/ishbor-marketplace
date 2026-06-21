import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowUpRight,
  Star,
  Quote,
  Search,
  Handshake,
  Briefcase,
} from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { UniversalSearch } from "@/components/site/search";
import { FreelancerCard, ServiceCard, ProjectCard } from "@/components/site/cards";
import { GradientAvatar } from "@/components/site/avatar";
import { freelancers, services, projects, categories } from "@/lib/mock-data";
import { recordConversionEvent } from "@/lib/conversion-store";
import { FeeTransparencySection } from "@/components/site/fee-transparency-section";
import { AuthTrustStrip } from "@/components/site/auth-trust-strip";
import { getLandingStats, getCategoryLiveCount } from "@/lib/landing-stats";
import { getPublishedProjects, subscribeProjects } from "@/lib/projects-store";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import {
  getPersonalizedHomeContent,
  getRecommendationsVersion,
  subscribeRecommendations,
} from "@/lib/recommendations";
import { HomeNextStepStrip } from "@/components/ux/journey-banner";
import { resolvePrimaryNextAction } from "@/lib/journey-guidance";
import { buildPageMeta, buildJsonLdHead, buildWebSiteJsonLd, buildOrganizationJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    ...buildPageMeta({
      title: "Ishbor — Markaziy Osiyo uchun eskrou himoyalangan frilans bozori",
      description: "Tekshirilgan frilanserlarni yollang — to'lov eskrouda, Humo/Uzcard bilan. O'zbek tilida, Markaziy Osiyo talenti uchun.",
      path: "/",
    }),
    ...buildJsonLdHead([buildWebSiteJsonLd(), buildOrganizationJsonLd()]),
  }),
  component: Landing,
});

const howItWorks = [
  {
    step: "01",
    title: "Loyiha yoki xizmat joylang",
    body: "Mijoz loyiha e'lon qiladi yoki frilanser xizmat paketini yaratadi.",
    icon: Briefcase,
  },
  {
    step: "02",
    title: "Mos mutaxassis toping",
    body: "AI tavsiyalari, qidiruv va CRM orqali eng yaxshi moslikni tanlang.",
    icon: Search,
  },
  {
    step: "03",
    title: "Eskrou bilan xavfsiz yakunlang",
    body: "To'lov eskrouda saqlanadi. Ish tasdiqlangandan keyin mablag' chiqariladi.",
    icon: Handshake,
  },
];

const statsFallback = [
  { label: "Ochiq loyihalar", value: `${projects.length}+`, isLive: false },
  { label: "Tekshirilgan mutaxassislar", value: `${freelancers.length}+`, isLive: false },
  { label: "Faol xizmatlar", value: "50+", isLive: false },
  { label: "Eskrou himoyasi", value: "100%", isLive: true },
];

const testimonials = [
  {
    quote:
      "Telegram guruhlarida emas — rasmiy shartnoma va eskrou bilan ishlash ancha xavfsiz. 2 kun ichida 3 ta taklif oldik, Humo orqali to'lov qildik.",
    name: "Dilnoza Karimova",
    role: "Marketing direktori, Payme Business",
    hue: 250,
  },
  {
    quote:
      "Fiverr va Upworkda dollar va inglizcha kerak edi. Ishbor o'zbekcha, so'm va mahalliy talent — shu uchun tanladik.",
    name: "Jasur Rakhimov",
    role: "Asoschi, Tezda Logistics",
    hue: 220,
  },
  {
    quote:
      "Ishonch balli va tasdiqlangan profillar tufayli noto'g'ri odamni yollash xavfi kamaydi. 24 soat ichida nizo hal qilindi.",
    name: "Bekzod Tursunov",
    role: "Head of Design, Uzum",
    hue: 240,
  },
];

function Landing() {
  useEffect(() => {
    recordConversionEvent("landing_view");
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  const recVersion = useSyncExternalStore(subscribeRecommendations, getRecommendationsVersion, () => 0);
  const statsVersion = useSyncExternalStore(
    subscribeProjects,
    () => getPublishedProjects().length,
    () => 0,
  );

  const stats = useMemo(() => getLandingStats(), [statsVersion]);
  const statsDisplay = mounted ? stats : statsFallback;

  const homeContent = useMemo(() => {
    if (!mounted) {
      return getPersonalizedHomeContent(undefined);
    }
    return getPersonalizedHomeContent(user?.id, user ? activeRole : undefined);
  }, [mounted, user?.id, activeRole, recVersion]);

  const staticFreelancers = useMemo(() => freelancers.slice(0, 6), []);
  const staticProjects = useMemo(() => projects.slice(0, 4), []);
  const staticServices = useMemo(() => services.slice(0, 4), []);

  const displayFreelancers = mounted ? homeContent.freelancers : staticFreelancers;
  const displayProjects = mounted ? homeContent.projects : staticProjects;
  const displayServices = mounted ? homeContent.services : staticServices;

  const loggedInNext = useMemo(() => {
    if (!mounted || !user) return null;
    return resolvePrimaryNextAction(user, activeRole ?? "client");
  }, [mounted, user, activeRole, recVersion]);

  const freelancerEyebrow = !mounted
    ? "Eng yuqori baholangan mutaxassislar"
    : homeContent.personalized
      ? "Sizga mos mutaxassislar"
      : "Eng yuqori baholangan mutaxassislar";
  const projectEyebrow = !mounted
    ? "Ochiq loyihalar"
    : homeContent.personalized && activeRole === "freelancer"
      ? "Sizga mos loyihalar"
      : "Ochiq loyihalar";
  const serviceEyebrow = !mounted
    ? "Premium xizmatlar"
    : homeContent.personalized
      ? "Sizga mos xizmatlar"
      : "Premium xizmatlar";

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
          <div className="font-mono mx-auto mb-5 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-lg surface-panel px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-foreground sm:text-[10px] sm:tracking-[0.2em]">
            <span className="size-1.5 rounded-full bg-primary animate-pulse-subtle" />
            Mijozlar va frilanserlar uchun xavfsiz ish maydoni · Mahalliy to&apos;lov
          </div>
          <h1 className="font-display mx-auto max-w-4xl text-balance text-[2rem] font-extrabold leading-[1.06] tracking-[-0.03em] sm:text-4xl sm:leading-[1.04] md:text-5xl lg:text-6xl">
            Tekshirilgan frilanserlarni yollang — <span className="text-primary">to&apos;lov eskrouda</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            Ishbor — Markaziy Osiyo uchun eskrou himoyalangan frilans bozori. Loyiha joylang yoki ish toping; to&apos;lov xavfsiz, jarayon aniq.
          </p>

          {user && loggedInNext && (
            <HomeNextStepStrip
              greeting={`Salom, ${user.fullName.split(" ")[0] ?? "do'stim"}`}
              roleLabel={activeRole === "freelancer" ? "Frilanser" : activeRole === "agency" ? "Agentlik" : "Mijoz"}
              nextHref={loggedInNext.href}
              nextCta={loggedInNext.cta}
              nextHint={loggedInNext.description}
            />
          )}

          {!user && <AuthTrustStrip variant="landing" className="mt-6" />}
          {user && <AuthTrustStrip variant="landing" className="mt-6" />}

          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            <Link
              to="/projects/preview"
              className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring"
            >
              Loyiha joylash
            </Link>
            <Link
              to="/projects"
              className="inline-flex h-11 items-center rounded-lg border border-border bg-surface px-6 text-sm font-semibold transition-default hover:border-primary/30 focus-ring"
            >
              Ish topish
            </Link>
            <Link
              to="/freelancers"
              className="inline-flex h-11 items-center rounded-lg border border-border bg-surface px-6 text-sm font-semibold transition-default hover:border-primary/30 focus-ring"
            >
              Mutaxassislarni ko&apos;rish
            </Link>
          </div>

          <div className="mt-8">
            <UniversalSearch />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
            <Link
              to="/projects/preview"
              className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-left transition-default hover:border-primary/40"
            >
              <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Men yollamoqchiman</div>
              <div className="font-display mt-2 text-lg font-bold">Loyiha joylash</div>
              <p className="mt-1 text-sm text-muted-foreground">Soatlar ichida tekshirilgan frilanserlardan takliflar oling.</p>
            </Link>
            <Link
              to="/projects"
              className="rounded-xl border border-border bg-card p-5 text-left transition-default hover:border-primary/20"
            >
              <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Men ishlashni xohlayman</div>
              <div className="font-display mt-2 text-lg font-bold">Loyihalarni ko&apos;rish</div>
              <p className="mt-1 text-sm text-muted-foreground">Ochiq shartnomalarni toping va mos takliflar yuboring.</p>
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-y-5 border-t border-border pt-8 md:grid-cols-4">
            {statsDisplay.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-mono mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {s.label}
                  {"isLive" in s && s.isLive && (
                    <span className="ml-1 text-primary">· jonli</span>
                  )}
                </div>
                <div className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Ko'rsatkichlar platforma faolligini aks ettiradi.
          </p>
        </div>
      </section>

      <section className="section-y border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="eyebrow mb-2">Qanday ishlaydi</div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">3 qadamda boshlang</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              Oddiy va xavfsiz jarayon — loyihadan to'lovgacha har bir qadam aniq.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {howItWorks.map((step, i) => (
              <div key={step.step} className="relative rounded-xl border border-border bg-card p-6">
                {i < howItWorks.length - 1 && (
                  <div aria-hidden className="absolute -right-3 top-1/2 hidden size-6 -translate-y-1/2 text-muted-foreground md:block">
                    <ArrowUpRight className="size-5 rotate-[-45deg]" />
                  </div>
                )}
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary">{step.step}</div>
                <div className="mt-3 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="size-5" />
                </div>
                <h3 className="font-display mt-4 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FeeTransparencySection />

      <section className="section-y border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="eyebrow mb-2">Kategoriyalarni ko'rish</div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                An'anaviy hunarmandlardan zamonaviy texnologiyalargacha
              </h2>
            </div>
            <Link
              to="/services"
              className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
            >
              Hammasini ko'rish <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => {
              const liveCount = mounted ? getCategoryLiveCount(c.slug) : 0;
              const countLabel = liveCount > 0 ? `${liveCount}+ e'lon` : "Katalogni ko'rish";
              return (
              <Link
                key={c.slug}
                to="/services/category/$slug"
                params={{ slug: c.slug }}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-default hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)]"
              >
                <div className="font-display mb-4 text-2xl text-primary">{c.glyph}</div>
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="font-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {countLabel}
                </div>
                <ArrowUpRight className="absolute right-3 top-3 size-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );})}
          </div>
        </div>
      </section>

      <section className="section-y border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="eyebrow mb-2">{freelancerEyebrow}</div>
              <h2 className="font-display truncate text-2xl font-bold tracking-tight sm:text-3xl">
                Mintaqaning eng intizomli ijodkorlari
              </h2>
            </div>
            <Link
              to="/freelancers"
              className="shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline hidden sm:inline-flex"
            >
              Katalogni ko'rish <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 stagger-children">
            {displayFreelancers.map((f) => (
              <FreelancerCard key={f.id} f={f} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="eyebrow mb-2">{projectEyebrow}</div>
              <h2 className="font-display truncate text-2xl font-bold tracking-tight sm:text-3xl">
                Butun mintaqadan shartnomalar uchun taklif bering
              </h2>
            </div>
            <Link
              to="/projects"
              className="shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline hidden sm:inline-flex"
            >
              Hammasini ko'rish <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {displayProjects.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="eyebrow mb-2">{serviceEyebrow}</div>
              <h2 className="font-display truncate text-2xl font-bold tracking-tight sm:text-3xl">
                Tayyor mahsulotlashtirilgan ishlar
              </h2>
            </div>
            <Link
              to="/services"
              className="shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline hidden sm:inline-flex"
            >
              Xizmatlarni ko'rish <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {displayServices.map((s) => (
              <ServiceCard key={s.id} s={s} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="eyebrow mb-2">Quruvchilar ishonadi</div>
            <h2 className="font-display mx-auto max-w-2xl text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Startap asoschilaridan milliy muassasalargacha
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure
                key={i}
                className="flex flex-col rounded-xl border border-border bg-card p-5 transition-default hover:border-primary/15"
              >
                <Quote className="mb-3 size-4 text-primary/60" />
                <blockquote className="flex-1 text-balance text-sm leading-relaxed text-foreground/85">
                  {t.quote}
                </blockquote>
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

      <section className="section-y border-b border-border">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Bugun yollashni <span className="text-primary">boshlang</span>.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Birinchi loyihangizni bepul joylang. Takliflarni kun emas, soatlar ichida oling.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <Link
              to="/projects/preview"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring"
            >
              Loyiha joylash
            </Link>
            <Link
              to="/projects"
              className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-default hover:border-foreground/20 focus-ring"
            >
              Ish topish
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}