import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
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
  Building2,
  Images,
  UserPlus,
  Search,
  Handshake,
  Briefcase,
} from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { UniversalSearch } from "@/components/site/search";
import { FreelancerCard, ServiceCard, ProjectCard } from "@/components/site/cards";
import { AgencyCard } from "@/components/agency/agency-card";
import { GradientAvatar } from "@/components/site/avatar";
import { freelancers, services, projects, categories } from "@/lib/mock-data";
import { getPublishedAgencies } from "@/lib/agency-store";
import { computeAgencyMetrics } from "@/lib/agency-metrics-store";
import { recordConversionEvent } from "@/lib/conversion-store";
import { LiveActivityFeed } from "@/components/site/live-activity-feed";
import { MarketplacePulse } from "@/components/site/marketplace-pulse";
import { FeeTransparencySection } from "@/components/site/fee-transparency-section";
import { getLandingStats } from "@/lib/landing-stats";
import { getPublishedProjects, subscribeProjects } from "@/lib/projects-store";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import {
  getPersonalizedHomeContent,
  getRecommendationsVersion,
  subscribeRecommendations,
} from "@/lib/recommendations";

export const Route = createFileRoute("/")({ head: () => ({ meta: [{ title: "Ishbor — Markaziy Osiyoning eng yaxshi talentlari bozori" }, { name: "description", content: "Markaziy Osiyo bo'ylab tekshirilgan dizaynerlar, muhandislar va strateglarni yollang. Eskrou himoyasi bilan." }] }), component: Landing });

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

const rolePaths = [
  {
    role: "Mijoz",
    tag: "Men yollamoqchiman",
    title: "Loyiha joylang, takliflar oling",
    body: "Tekshirilgan frilanserlardan soatlar ichida takliflar oling. Eskrou himoyasi bilan xavfsiz yollang.",
    href: "/register",
    search: { type: "client" as const },
    cta: "Mijoz sifatida boshlash",
    icon: UserPlus,
  },
  {
    role: "Frilanser",
    tag: "Men ishlashni xohlayman",
    title: "Portfel yarating, loyihalarga ariza yuboring",
    body: "Ko'nikmalaringizni ko'rsating, xizmat paketlari yarating va daromad olishni boshlang.",
    href: "/register",
    search: { type: "freelancer" as const },
    cta: "Frilanser sifatida boshlash",
    icon: Briefcase,
  },
  {
    role: "Agentlik",
    tag: "Jamoa bilan ishlayman",
    title: "Agentlik yarating, jamoa bilan katta loyihalar",
    body: "Jamoa a'zolarini taklif qiling, portfolio hikoyalari e'lon qiling va korporativ mijozlarga xizmat ko'rsating.",
    href: "/login",
    search: { redirect: "/agencies/create" as const },
    cta: "Agentlik yaratish",
    icon: Building2,
  },
];

const trustBadges = [
  { icon: Lock, label: "Eskrou himoyasi", sub: "Har bir tranzaksiya" },
  { icon: BadgeCheck, label: "Tasdiqlangan", sub: `${freelancers.length}+ mutaxassis` },
  { icon: ShieldCheck, label: "Nizo hal qilish", sub: "24 soat ichida" },
  { icon: Star, label: "Sharh tizimi", sub: "Ikki tomonlama baho" },
];

const statsFallback = [
  { label: "Ochiq loyihalar", value: `${projects.length}+`, isLive: false },
  { label: "Tekshirilgan mutaxassislar", value: `${freelancers.length}+`, isLive: false },
  { label: "Eskrou himoyasi", value: "100%", isLive: true },
  { label: "O'rtacha javob vaqti", value: "< 2 soat", isLive: false },
];

const testimonials = [
  {
    quote:
      "Butun mahsulot jamoamizni Ishbor orqali uch haftada yig'dik. Sifat Londondan topgan mutaxassislarimiz bilan bir darajada.",
    name: "Sardor Mahmudov",
    role: "CTO, Asaka Capital",
    hue: 250,
  },
  {
    quote:
      "Bu yil qilgan eng yaxshi qarorimiz. Eskrou jarayoni foydalangan eng toza tizim — Upworkdan aniqroq, Stripe Connectdan tezroq.",
    name: "Elena Park",
    role: "Founder, Aralink Labs",
    hue: 220,
  },
  {
    quote:
      "Ishbor nihoyat Toshkent talentini dunyo darajasidagi mutaxassis sifatida ko'rsatadi. Eng yuqori baho belgisi haqiqatan ham nimadir anglatadi.",
    name: "Bekzod Tursunov",
    role: "Head of Design, Tezda",
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
  const displayAgencies = mounted ? getPublishedAgencies().slice(0, 3) : [];
  const displayProjects = mounted ? homeContent.projects : staticProjects;
  const displayServices = mounted ? homeContent.services : staticServices;

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
            Toshkent · Olmaota · Bishkek · Dushanbe — jonli
          </div>
          <h1 className="font-display mx-auto max-w-4xl text-balance text-[2rem] font-extrabold leading-[1.06] tracking-[-0.03em] sm:text-4xl sm:leading-[1.04] md:text-5xl lg:text-6xl">
            Markaziy Osiyoning <span className="text-primary">yetakchi</span> freelance bozori.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            Tekshirilgan mutaxassislarni yollang, loyihalar joylang va ishni yakunlang — barchasi eskrou himoyasi bilan.
          </p>

          <div className="mt-10">
            <UniversalSearch />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
            <Link
              to="/projects/preview"
              className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-left transition-default hover:border-primary/40"
            >
              <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Men yollamoqchiman</div>
              <div className="font-display mt-2 text-lg font-bold">Loyiha joylash</div>
              <p className="mt-1 text-sm text-muted-foreground">Soatlar ichida tekshirilgan freelancerlardan takliflar oling.</p>
            </Link>
            <Link
              to="/projects"
              className="rounded-xl border border-border bg-card p-5 text-left transition-default hover:border-primary/20"
            >
              <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Men ishlashni xohlayman</div>
              <div className="font-display mt-2 text-lg font-bold">Loyihalarni ko'rish</div>
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

      <section className="border-b border-border bg-surface/30 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 text-center">
            <div className="eyebrow mb-2">Nega Ishbor?</div>
            <h2 className="font-display mx-auto max-w-2xl text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Fiverr va Upwork emas — Markaziy Osiyo uchun maxsus marketplace
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Global platformalar mintaqaviy to&apos;lov, eskrou va tilni qamrab olmaydi. Ishbor shu bo&apos;shliqni to&apos;ldiradi.
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-elevated/50">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Xususiyat</th>
                  <th className="px-4 py-3 text-left font-semibold text-primary">Ishbor</th>
                  <th className="px-4 py-3 text-left text-muted-foreground">Fiverr</th>
                  <th className="px-4 py-3 text-left text-muted-foreground">Upwork</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Mahalliy to'lov (Humo, Uzcard)", "✓", "—", "—"],
                  ["Eskrou har tranzaksiyada", "✓", "Cheklangan", "Connect + fee"],
                  ["O'zbek tilida UX", "✓", "—", "—"],
                  ["Markaziy Osiyo talenti", "✓", "Global", "Global"],
                  ["24 soat nizo hal qilish", "✓", "—", "Haftalar"],
                  ["Shaxs tasdiqlash + ishonch balli", "✓", "Asosan reyting", "Asosan reyting"],
                ].map(([feature, ishbor, fiverr, upwork]) => (
                  <tr key={feature} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{feature}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{ishbor}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fiverr}</td>
                    <td className="px-4 py-3 text-muted-foreground">{upwork}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                q: "Ishbor nima?",
                a: "Tekshirilgan mutaxassislarni yollash va loyihalar joylash uchun eskrou himoyalangan marketplace.",
              },
              {
                q: "Kimlar uchun?",
                a: "Mijozlar, frilanserlar va agentliklar — loyihadan to'lovgacha to'liq oqim.",
              },
              {
                q: "Nega ishonish kerak?",
                a: "Eskrou himoyasi, shaxs tasdiqlash, 24 soatlik nizo hal qilish va haqiqiy sharhlar.",
              },
              {
                q: "Birinchi qadam?",
                a: "Rolingizni tanlang — loyiha joylang, portfel yarating yoki agentlik oching.",
              },
            ].map((item) => (
              <div key={item.q} className="rounded-xl border border-border bg-card p-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary">{item.q}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {trustBadges.map((b) => (
              <div key={b.label} className="flex flex-col items-center rounded-xl border border-border bg-card px-3 py-4 text-center">
                <b.icon className="size-5 text-primary" />
                <div className="mt-2 text-sm font-semibold">{b.label}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{b.sub}</div>
              </div>
            ))}
          </div>
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

      <section className="section-y border-b border-border bg-surface/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="eyebrow mb-2">O'z yo'lingizni tanlang</div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Mijoz, frilanser yoki agentlik</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {rolePaths.map((path) => (
              <Link
                key={path.role}
                to={path.href}
                search={"search" in path ? path.search : undefined}
                className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-default hover:border-primary/30 hover:shadow-md"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary">{path.tag}</div>
                <div className="mt-3 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <path.icon className="size-5" />
                </div>
                <h3 className="font-display mt-4 text-lg font-bold group-hover:text-primary">{path.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{path.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {path.cta} <ArrowUpRight className="size-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
            {categories.map((c) => (
              <Link
                key={c.slug}
                to="/services/category/$slug"
                params={{ slug: c.slug }}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-default hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)]"
              >
                <div className="font-display mb-4 text-2xl text-primary">{c.glyph}</div>
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="font-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {c.count.toLocaleString()} mutaxassis
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
              Ishonch uchun yaratilgan
            </div>
            <h2 className="font-display text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Korporativ darajadagi xavfsizlik. <span className="font-serif-italic font-medium">Startap</span> tezligi.
            </h2>
            <p className="mt-3 max-w-md text-sm text-background/60 leading-relaxed">
              Har bir tranzaksiya eskrou himoyasida. Har bir freelancer shaxsi tasdiqlangan. Har bir nizo 24 soat ichida hal qilinadi.
            </p>
          </div>
          <div className="space-y-2.5">
            {[
              {
                icon: Lock,
                title: "Eskrou himoyasi",
                body: "Yakuniy bosqichni tasdiqlaguningizcha mablag'lar xavfsiz saqlanadi.",
              },
              {
                icon: BadgeCheck,
                title: "Tasdiqlangan ma'lumotnomalar",
                body: "Har bir freelancer ko'p bosqichli tekshiruvdan o'tadi.",
              },
              {
                icon: Banknote,
                title: "Tezkor mahalliy to'lovlar",
                body: "Humo, Uzcard, Kaspi yoki SWIFT orqali 60 soniyadan kam vaqtda yechib oling.",
              },
              {
                icon: Clock,
                title: "24 soatlik nizo hal qilish",
                body: "Mustaqil mediatorlar har bir nizoni 24 soat ichida hal qiladi.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/8 p-4"
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
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="eyebrow mb-2">Portfolio ishlar</div>
              <h2 className="font-display truncate text-2xl font-bold tracking-tight sm:text-3xl">
                Case study va natijalar bilan tanishing
              </h2>
            </div>
            <Link
              to="/freelancers"
              className="shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline hidden sm:inline-flex"
            >
              Mutaxassislarni ko'rish <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {freelancers.slice(0, 4).map((f) => (
              <FreelancerCard key={f.id} f={f} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="eyebrow mb-2">Agentliklar</div>
              <h2 className="font-display truncate text-2xl font-bold tracking-tight sm:text-3xl">
                Jamoa bilan katta loyihalarni bajaring
              </h2>
            </div>
            <Link
              to="/agencies"
              className="shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline hidden sm:inline-flex"
            >
              Barcha agentliklar <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayAgencies.map((agency) => (
                <AgencyCard key={agency.slug} agency={agency} metrics={computeAgencyMetrics(agency)} />
              ))}
          </div>
          {mounted && displayAgencies.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <Building2 className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Hozircha e'lon qilingan agentliklar yo'q.</p>
              <Link to="/login" search={{ redirect: "/agencies/create" }} className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Birinchi agentlikni yaratish
              </Link>
            </div>
          )}
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

      <LiveActivityFeed />

      <MarketplacePulse />

      <section className="border-b border-border bg-primary/5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center sm:px-6 md:flex-row md:text-left">
          <div className="flex-1">
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Referral dasturi</div>
            <h2 className="font-display mt-1 text-xl font-bold">Do'stingizni taklif qiling — 50.000 UZS kredit oling</h2>
            <p className="mt-1 text-sm text-muted-foreground">Har bir faol referral uchun kredit. Sozlamalar → Referral bo'limida kodingiz.</p>
          </div>
          <Link
            to="/register"
            className="inline-flex h-10 shrink-0 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Bepul qo'shilish
          </Link>
        </div>
      </section>

      <section className="section-y">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
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
            <Link
              to="/freelancers"
              className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-default hover:border-foreground/20 focus-ring"
            >
              Mutaxassislarni ko'rish
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}