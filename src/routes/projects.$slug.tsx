import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import { LoadingSpinner } from "@/components/site/feedback";
import { Star, Clock, Users, ShieldCheck, Check, ArrowRight, CircleCheck as CheckCircle2, DollarSign, Calendar, Send, ChevronRight, UserCheck, X, FileText, Sparkles, Pencil, FolderOpen } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { GradientAvatar } from "@/components/site/avatar";
import { EscrowShield, LevelBadge } from "@/components/site/trust";
import { ConversionFlowBanner, FREELANCER_HIRE_FLOW } from "@/components/site/conversion-flow";
import {
  createApplication,
  getApplicationsByProjectSlug,
  acceptApplication,
  updateApplicationStatus,
  subscribeApplications,
  shortlistApplication,
} from "@/lib/applications-store";
import { getProjectBySlug, isProjectOwner, subscribeProjects } from "@/lib/projects-store";
import {
  budgetTypeLabels,
  experienceLevelLabels,
  formatPostedAgo,
  formatProjectBudget,
} from "@/lib/project-validation";
import { getSession } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { freelancers } from "@/lib/mock-data";
import { FeaturedPurchaseCard } from "@/components/analytics/featured-purchase-card";
import { PageBreadcrumb } from "@/components/ux/page-breadcrumb";
import { PrimaryLink, SecondaryLink, primaryActionClass } from "@/components/ux/action-buttons";
import { ClientCheckoutLink } from "@/components/checkout/client-checkout-link";
import { useClientCheckout } from "@/hooks/use-client-checkout";
import { isFeaturedActive } from "@/lib/featured-store";
import { EntityNotFound } from "@/components/site/entity-not-found";

type ProjectSearch = { proposal?: boolean; published?: boolean };

export const Route = createFileRoute("/projects/$slug")({
  validateSearch: (search: Record<string, unknown>): ProjectSearch => ({
    proposal: search.proposal === true || search.proposal === "true",
    published: search.published === true || search.published === "true" || search.published === '"true"',
  }),
  head: () => ({
    meta: [{ title: "Loyiha — Ishbor" }],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { slug } = Route.useParams();
  const { proposal: openProposal, published } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hydrated = useClientHydrated();
  const p = useSyncExternalStore(
    subscribeProjects,
    () => (hydrated ? getProjectBySlug(slug) : undefined),
    () => undefined,
  );

  if (!hydrated || p === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="flex justify-center py-32">
          <LoadingSpinner size="md" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!p) {
    return (
      <EntityNotFound
        title="Loyiha topilmadi"
        description="Bu loyiha mavjud emas, yopilgan yoki faqat egasiga ko'rinadi."
        backTo="/projects"
        backLabel="Loyihalarni ko'rish"
      />
    );
  }

  const isOwner = user ? isProjectOwner(p.slug, user.id) : false;

  if ((p.status === "draft" || p.status === "paused" || p.status === "closed") && !isOwner) {
    return (
      <EntityNotFound
        title="Loyiha topilmadi"
        description="Bu loyiha mavjud emas, yopilgan yoki faqat egasiga ko'rinadi."
        backTo="/projects"
        backLabel="Loyihalarni ko'rish"
      />
    );
  }

  return <ProjectDetailContent p={p} openProposal={openProposal} published={published} isOwner={isOwner} />;
}

function ProjectDetailContent({
  p,
  openProposal,
  published,
  isOwner,
}: {
  p: NonNullable<ReturnType<typeof getProjectBySlug>>;
  openProposal?: boolean;
  published?: boolean;
  isOwner: boolean;
}) {
  const navigate = useNavigate();
  const goCheckout = useClientCheckout();
  const { user } = useAuth();
  const [showPublishedBanner, setShowPublishedBanner] = useState(!!published);
  const applications = useSyncExternalStore(
    subscribeApplications,
    () => getApplicationsByProjectSlug(p.slug),
    () => getApplicationsByProjectSlug(p.slug),
  );

  const [showProposal, setShowProposal] = useState(false);
  const [proposalText, setProposalText] = useState("");
  const [proposalRate, setProposalRate] = useState("");
  const [proposalMuddat, setProposalMuddat] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);
  const [proposalSort, setProposalSort] = useState<"newest" | "amount-asc" | "amount-desc">("newest");

  const sortedApplications = [...applications].sort((a, b) => {
    if (proposalSort === "amount-asc") {
      return (a.proposalAmount ?? a.budget) - (b.proposalAmount ?? b.budget);
    }
    if (proposalSort === "amount-desc") {
      return (b.proposalAmount ?? b.budget) - (a.proposalAmount ?? a.budget);
    }
    return 0;
  });

  useEffect(() => {
    if (openProposal) setShowProposal(true);
  }, [openProposal]);

  const openProposalForm = () => {
    if (!getSession()) {
      toast.info("Taklif yuborish uchun tizimga kiring");
      navigate({ to: "/login", search: { redirect: `/projects/${p.slug}?proposal=true` } });
      return;
    }
    setShowProposal(true);
  };

  const handleSubmit = () => {
    if (!getSession()) {
      toast.error("Tizimga kirish talab qilinadi", { description: "Taklif yuborish uchun frilanser sifatida kiring." });
      navigate({ to: "/login", search: { redirect: `/projects/${p.slug}?proposal=true` } });
      return;
    }
    const app = createApplication({
      projectTitle: p.title,
      projectSlug: p.slug,
      client: p.client,
      clientHue: p.clientHue,
      budget: p.budget,
      proposalAmount: Number(proposalRate) || p.budget,
      deliveryTime: proposalMuddat || p.duration,
      category: p.category,
      coverNote: proposalText.trim(),
    });
    if ("error" in app) {
      toast.error(app.error, { action: { label: "Narxlar", onClick: () => navigate({ to: "/pricing" }) } });
      return;
    }
    setCreatedAppId(app.id);
    setSubmitted(true);
    toast.success("Ariza yaratildi", { description: "Taklifingiz endi mijoz ko'rib chiqishida." });
    navigate({ to: "/applications/$id", params: { id: app.id } });
  };

  const canSubmit = proposalText.trim() && proposalRate.trim() && proposalMuddat.trim();
  const canPropose = !isOwner && (!p.status || p.status === "published");

  const handleAccept = (appId: string) => {
    const result = acceptApplication(appId);
    if (!result) {
      toast.error("Arizani qabul qilib bo'lmadi");
      return;
    }
    toast.success("Frilanser qabul qilindi", { description: "Buyurtma yaratildi. Ishni boshlash uchun eskrouni moliyalashtiring." });
    goCheckout({ type: "order", order: result.orderId });
  };

  const handleReject = (appId: string) => {
    updateApplicationStatus(appId, "rejected");
    toast.success("Taklif rad etildi");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {showPublishedBanner && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-success/25 bg-success/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <div className="font-display text-sm font-bold text-success">Loyiha muvaffaqiyatli joylandi</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Frilanserlar endi ko'rib chiqishi va taklif yuborishi mumkin.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPublishedBanner(false)}
              className="touch-target rounded-lg p-1.5 text-muted-foreground transition-default hover:bg-secondary hover:text-foreground"
              aria-label="Yopish"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {isOwner && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <FolderOpen className="size-5" />
              </div>
              <div>
                <div className="font-display text-sm font-semibold">Bu loyiha sizga tegishli</div>
                <p className="text-xs text-muted-foreground">Takliflarni ko'rib chiqing yoki loyihani yangilang</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="#project-proposals" className={`${primaryActionClass} text-xs`}>
                Takliflarni ko&apos;rish
              </a>
              <SecondaryLink to="/projects/create" search={{ edit: p.slug }} className="text-xs">
                <Pencil className="size-3.5" /> Tahrirlash
              </SecondaryLink>
            </div>
          </div>
        )}

        {isOwner && (
          <FeaturedPurchaseCard
            target={{ type: "project", slug: p.slug, title: p.title }}
            featured={isFeaturedActive(p.featured, p.featuredUntil)}
            featuredUntil={p.featuredUntil}
          />
        )}
        <PageBreadcrumb
          items={[
            { label: "Loyihalar", to: "/projects" },
            { label: p.category },
            { label: p.title },
          ]}
        />

        <ConversionFlowBanner
          title="Frilanserni yollash yo'li"
          steps={FREELANCER_HIRE_FLOW}
          currentStep={submitted ? "application" : showProposal ? "proposal" : "project"}
          nextHint={
            submitted
              ? "Mijoz taklifingizni ko'rib chiqayotganda arizangizni kuzating."
              : showProposal
                ? "Mijoz ko'rib chiqadigan ariza yaratish uchun taklif yuboring."
                : "Qisqacha ma'lumotni o'qing, keyin yollanish uchun mos taklif yuboring."
          }
          variant="compact"
          className="mb-6"
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <article className="overflow-hidden rounded-2xl border border-border bg-card transition-default hover:border-primary/20">
              <div className="border-b border-border bg-elevated/40 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                    {p.category}
                  </span>
                  {p.escrowProtected && <EscrowShield size="sm" />}
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {experienceLevelLabels[p.experienceLevel]}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{p.title}</h1>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <GradientAvatar name={p.client} hue={p.clientHue} size={32} rounded="rounded-lg" />
                    <span className="font-medium text-foreground">{p.client}</span>
                    {p.clientVerified && (
                      <span className="inline-flex items-center gap-1 text-success">
                        <CheckCircle2 className="size-3.5" /> Tasdiqlangan
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {formatPostedAgo(p.postedAgo)}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <ProjectStat
                    label="Byudjet"
                    value={formatProjectBudget(p)}
                    sub={budgetTypeLabels[p.budgetType]}
                    icon={DollarSign}
                    accent
                  />
                  <ProjectStat label="Muddat" value={p.duration} icon={Calendar} />
                  <ProjectStat label="Takliflar" value={String(applications.length || p.proposals)} icon={Users} />
                </div>
              </div>
            </article>

            <ProjectSection title="Tavsif">
              <p className="text-sm leading-relaxed text-foreground/85">{p.description}</p>
            </ProjectSection>

            {p.scope.length > 0 && (
              <ProjectSection title="Ish doirasi">
                <ul className="space-y-2.5">
                  {p.scope.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                        <Check className="size-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </ProjectSection>
            )}

            <ProjectSection title="Talab qilinadigan ko'nikmalar">
              <div className="flex flex-wrap gap-1.5">
                {p.skills.map((s) => (
                  <span key={s} className="rounded-md bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </ProjectSection>
            <section>
              {isOwner ? (
                <section id="project-proposals" className="overflow-hidden rounded-2xl border border-border bg-card transition-default hover:border-primary/20">
                  <div className="border-b border-border px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="font-display text-base font-semibold">Takliflar ({applications.length})</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Takliflarni solishtiring, frilanserni qabul qiling va buyurtmani boshlash uchun eskrouni moliyalashtiring.
                        </p>
                      </div>
                      {applications.length > 1 && (
                        <select
                          value={proposalSort}
                          onChange={(e) => setProposalSort(e.target.value as typeof proposalSort)}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium outline-none transition-default focus:border-primary/30"
                        >
                          <option value="newest">Saralash: Eng yangi</option>
                          <option value="amount-asc">Saralash: Eng arzon</option>
                          <option value="amount-desc">Saralash: Eng qimmat</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {sortedApplications.length === 0 ? (
                      <div className="flex flex-col items-center px-6 py-12 text-center">
                        <div className="grid size-14 place-items-center rounded-2xl border border-border bg-surface text-muted-foreground">
                          <FileText className="size-6" />
                        </div>
                        <h3 className="font-display mt-4 text-base font-semibold">Hali takliflar yo&apos;q</h3>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                          Frilanserlar odatda 24–48 soat ichida taklif yuboradi. Kutayotganda loyiha tavsifini yangilashingiz mumkin.
                        </p>
                      </div>
                    ) : (
                      sortedApplications.map((app) => (
                        <div key={app.id} className="p-5 transition-default hover:bg-secondary/20 sm:p-6">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <GradientAvatar name={app.freelancerName ?? "Frilanser"} hue={app.freelancerHue ?? 250} size={44} rounded="rounded-xl" />
                              <div>
                                <div className="font-display text-sm font-semibold">{app.freelancerName ?? "Frilanser"}</div>
                                <div className="font-mono text-[10px] text-muted-foreground">
                                  ${(app.proposalAmount ?? app.budget).toLocaleString()} · {app.deliveryTime}
                                </div>
                              </div>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest ${
                              app.status === "accepted" ? "bg-success/10 text-success" :
                              app.status === "rejected" ? "bg-destructive/10 text-destructive" :
                              "bg-secondary text-muted-foreground"
                            }`}>{app.status}</span>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{app.coverNote}</p>
                          {app.status === "pending" || app.status === "shortlisted" ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                onClick={() => handleAccept(app.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-default hover:opacity-90"
                              >
                                <UserCheck className="size-3.5" /> Qabul qilish
                              </button>
                              {app.status === "pending" && (
                                <button
                                  onClick={() => { shortlistApplication(app.id); toast.success("Taklif tanlovga qo'yildi"); }}
                                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium transition-default hover:border-primary/20"
                                >
                                  Tanlovga qo'yish
                                </button>
                              )}
                              <button
                                onClick={() => handleReject(app.id)}
                                className="rounded-lg border border-border px-4 py-2 text-xs font-medium transition-default hover:border-primary/20"
                              >
                                Rad etish
                              </button>
                              {app.freelancerUsername && (
                                <Link
                                  to="/freelancers/$username"
                                  params={{ username: app.freelancerUsername }}
                                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium transition-default hover:border-primary/20"
                                >
                                  Profilni ko'rish
                                </Link>
                              )}
                            </div>
                          ) : app.status === "accepted" && app.orderId ? (
                            <ClientCheckoutLink
                              search={{ type: "order", order: app.orderId }}
                              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-default hover:text-primary/80"
                            >
                              Eskrouni moliyalashtirish <ArrowRight className="size-3" />
                            </ClientCheckoutLink>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </section>
              ) : !canPropose ? (
                <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                  Bu loyiha hozircha taklif qabul qilmayapti.
                </div>
              ) : !showProposal ? (
                <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-display text-lg font-semibold">Bu loyihaga taklif yuboring</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Tajribangiz va yondashuvingizni yozing — mijoz ko'rib chiqadi.
                      </p>
                    </div>
                    <button
                      onClick={openProposalForm}
                      className="touch-target inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring"
                    >
                      <Send className="size-4" /> Taklif yuborish
                    </button>
                  </div>
                </div>
              ) : submitted ? (
                <div className="rounded-2xl border border-success/25 bg-success/5 p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <div>
                      <div className="font-display text-lg font-bold text-success">Taklif yuborildi</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Ariza yaratildi. {p.client} taklifingizni ko'rib chiqadi.
                      </p>
                      {createdAppId && (
                        <Link
                          to="/applications/$id"
                          params={{ id: createdAppId }}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-default hover:text-primary/80"
                        >
                          Arizani ko'rish <ArrowRight className="size-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-card transition-default hover:border-primary/20">
                  <div className="border-b border-border bg-elevated/40 px-5 py-4 sm:px-6">
                    <h2 className="font-display text-base font-semibold">Taklifingizni yuboring</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {p.client}ga bu loyiha uchun nima uchun mos ekanligingizni tushuntiring.
                    </p>
                  </div>
                  <div className="space-y-5 p-5 sm:p-6">
                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Muqova xati
                      </label>
                      <textarea
                        value={proposalText}
                        onChange={(e) => setProposalText(e.target.value)}
                        rows={5}
                        placeholder="Yondashuvingiz, tajribangiz va nima uchun eng yaxshi nomzod ekanligingizni yozing..."
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-default focus:border-primary/30 placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          Taklif summasi ({p.budgetType})
                        </label>
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5">
                          <DollarSign className="size-4 text-muted-foreground" />
                          <input
                            value={proposalRate}
                            onChange={(e) => setProposalRate(e.target.value)}
                            type="number"
                            placeholder={p.budgetType === "hourly" ? "55" : "12000"}
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                          />
                          {p.budgetType === "hourly" && <span className="text-xs text-muted-foreground">/hr</span>}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          Yetkazish muddati
                        </label>
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5">
                          <Calendar className="size-4 text-muted-foreground" />
                          <input
                            value={proposalMuddat}
                            onChange={(e) => setProposalMuddat(e.target.value)}
                            placeholder="3 hafta"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-xs">
                      <EscrowShield size="sm" />
                      <span className="text-muted-foreground">To'lov himoyalangan — mablag'lar faqat sizning tasdig'ingizdan keyin chiqariladi</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
                      >
                        <Send className="size-3.5" /> Taklif yuborish
                      </button>
                      <button
                        onClick={() => setShowProposal(false)}
                        className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-default hover:border-primary/20 focus-ring"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
            <div className="overflow-hidden rounded-2xl border border-border bg-card transition-default hover:border-primary/20">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                  <GradientAvatar name={p.client} hue={p.clientHue} size={48} rounded="rounded-xl" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display text-sm font-bold">{p.client}</span>
                      {p.clientVerified && <CheckCircle2 className="size-4 text-success" />}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {p.clientVerified ? "Tasdiqlangan mijoz" : "Mijoz"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-5">
                <SidebarStat label="Jami sarflangan" value={`$${(p.clientSpent / 1000).toFixed(0)}k`} />
                <SidebarStat label="Yollashlar" value={String(p.clientHires)} />
                <SidebarStat label="A'zo bo'lgan" value={p.clientMemberSince} />
                <SidebarStat label="Joylangan" value={p.postedAgo} />
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 transition-default hover:border-primary/30">
              <div className="mb-3 grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <h4 className="font-display text-sm font-semibold">To'liq eskrou himoyasi</h4>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Mijoz bu loyihani eskrouga oldindan moliyalashtirgan. Bosqich yakunlanganda to'lovingiz kafolatlanadi.
                Nizolar mustaqil mediatorlar tomonidan 24 soat ichida hal qilinadi.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card transition-default hover:border-primary/20">
              <div className="border-b border-border px-5 py-4">
                <h3 className="font-display text-sm font-semibold">Talablar</h3>
              </div>
              <ul className="divide-y divide-border">
                {[
                  { label: "Tajriba", value: experienceLevelLabels[p.experienceLevel] },
                  { label: "Byudjet turi", value: budgetTypeLabels[p.budgetType] },
                  { label: "Muddat", value: p.duration },
                  { label: "Eskrou", value: p.escrowProtected ? "Moliyalashtirilgan" : "Kutilmoqda" },
                ].map((r) => (
                  <li key={r.label} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium capitalize">{r.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card transition-default hover:border-primary/20">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <h3 className="font-display text-sm font-semibold">Tavsiya etilgan iste'dodlar</h3>
                </div>
              </div>
              <div className="divide-y divide-border">
                {freelancers.slice(0, 3).map((f) => (
                  <Link
                    key={f.id}
                    to="/freelancers/$username"
                    params={{ username: f.username }}
                    className="flex items-center gap-3 px-5 py-3.5 transition-default hover:bg-secondary/20"
                  >
                    <GradientAvatar name={f.name} hue={f.hue} size={36} rounded="rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">{f.name}</div>
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{f.title}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <LevelBadge level={f.level} className="!px-1.5 !py-0 !text-[8px]" />
                        <span className="flex items-center gap-0.5 font-mono text-[9px] text-muted-foreground">
                          <Star className="size-2.5 fill-gold text-gold" />
                          {f.rating.toFixed(2)}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground">${f.rate}/soat</span>
                      </div>
                    </div>
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function ProjectSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card transition-default hover:border-primary/20">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="font-display text-base font-semibold">{title}</h2>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ProjectStat({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-default hover:border-primary/20 ${
        accent ? "border-primary/20 bg-primary/5" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className={`size-3 ${accent ? "text-primary" : ""}`} />
        {label}
      </div>
      <div className="font-display mt-1.5 text-xl font-bold tracking-tight sm:text-2xl">{value}</div>
      {sub && (
        <div className="font-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}

function SidebarStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
