import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import { LoadingSpinner } from "@/components/site/feedback";
import {
  ChevronRight,
  ExternalLink,
  Github,
  Heart,
  Share2,
  MessageSquare,
  ArrowRight,
  X,
  ChevronLeft,
  Maximize2,
  Play,
} from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { GradientAvatar } from "@/components/site/avatar";
import { CaseStudyDisplay } from "@/components/portfolio/case-study-display";
import { PortfolioCover } from "@/components/portfolio/portfolio-preview-card";
import { SaveButtonInline } from "@/components/site/save-button";
import { useSaved } from "@/hooks/use-saved";
import { useAuth } from "@/hooks/use-auth";
import { useClientCheckout } from "@/hooks/use-client-checkout";
import { useActiveRole } from "@/hooks/use-active-role";
import { EntityNotFound } from "@/components/site/entity-not-found";
import { getPortfolioBySlug, getPublicPortfolioBySlug, subscribePortfolios } from "@/lib/portfolio-store";
import {
  recordPortfolioView,
  recordPortfolioSave,
  recordPortfolioShare,
  recordPortfolioContactClick,
  recordPortfolioHireConversion,
} from "@/lib/portfolio-analytics-store";

export const Route = createFileRoute("/portfolio/$slug")({
  beforeLoad: ({ params }) => {
    if (params.slug === "create") {
      throw redirect({ to: "/portfolio/create" });
    }
    if (params.slug === "edit") {
      throw redirect({ to: "/portfolio" });
    }
  },
  loader: ({ params }) => ({ slug: params.slug }),
  head: () => ({
    meta: [{ title: "Portfolio — Ishbor" }],
  }),
  component: PortfolioDetailPage,
});

function parseHue(img: string, fallback: number, idx = 0): number {
  if (img.startsWith("gradient:")) return Number(img.split(":")[1]) || fallback;
  return (fallback + idx * 35) % 360;
}

function PortfolioSaveButton({ slug }: { slug: string }) {
  const { saved, toggle } = useSaved("portfolio", slug);
  return (
    <button
      type="button"
      onClick={() => {
        const nowSaved = toggle();
        if (nowSaved) recordPortfolioSave(slug);
      }}
      className={`rounded-lg border px-4 py-2 text-sm font-medium ${
        saved ? "border-primary/30 bg-primary/5 text-primary" : "border-border hover:border-primary/20"
      }`}
    >
      <Heart className={`inline size-4 mr-1 ${saved ? "fill-primary" : ""}`} /> {saved ? "Saqlangan" : "Saqlash"}
    </button>
  );
}

function PortfolioDetailPage() {
  const { slug } = Route.useParams();
  const hydrated = useClientHydrated();
  const rawItem = useSyncExternalStore(
    subscribePortfolios,
    () => (hydrated ? getPortfolioBySlug(slug) : undefined),
    () => undefined,
  );

  if (!hydrated || rawItem === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="flex justify-center py-32">
          <LoadingSpinner />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!rawItem) {
    return (
      <EntityNotFound
        title="Portfolio topilmadi"
        description="Bu portfolio elementi mavjud emas yoki o'chirilgan."
        backTo="/freelancers"
        backLabel="Frilanserlarni ko'rish"
      />
    );
  }

  return <PortfolioDetailContent rawItem={rawItem} slug={slug} />;
}

function PortfolioDetailContent({
  rawItem,
  slug,
}: {
  rawItem: NonNullable<ReturnType<typeof getPortfolioBySlug>>;
  slug: string;
}) {
  const navigate = useNavigate();
  const goCheckout = useClientCheckout();
  const { user, isAuthenticated } = useAuth();
  const { activeRole } = useActiveRole();
  const isClientViewer = activeRole === "client";
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (lightbox === null && !fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox, fullscreen]);

  const isOwner = user?.id === rawItem.ownerUserId;
  const publicItem = getPublicPortfolioBySlug(slug);
  const item = isOwner || publicItem ? rawItem : null;

  useEffect(() => {
    if (item && (publicItem || isOwner)) {
      recordPortfolioView(slug);
    }
  }, [slug, item, publicItem, isOwner]);

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Portfolio mavjud emas</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Bu portfolio elementi hali ommaviy ko'rinmaydi.
          </p>
          <Link to={`/freelancers/${rawItem.freelancerUsername}`} className="mt-6 inline-block text-primary hover:underline">
            Frilanser profilini ko'rish
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const galleryHues = item.galleryImages.length > 0
    ? item.galleryImages.map((g, i) => parseHue(g, item.hue, i))
    : [item.hue, (item.hue + 40) % 360, (item.hue + 80) % 360];

  const handleShare = async () => {
    const url = window.location.href;
    recordPortfolioShare(slug);
    if (navigator.share) {
      await navigator.share({ title: item.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Havola nusxalandi");
  };

  const handleContact = () => {
    recordPortfolioContactClick(slug);
    navigate({ to: "/messages" });
  };

  const handleHire = () => {
    recordPortfolioContactClick(slug);
    recordPortfolioHireConversion(slug);
    goCheckout({ type: "hire", freelancer: item.freelancerUsername });
  };

  const linkEntries = [
    { key: "github", label: "GitHub", url: item.links.github, icon: Github },
    { key: "gitlab", label: "GitLab", url: item.links.gitlab, icon: ExternalLink },
    { key: "behance", label: "Behance", url: item.links.behance, icon: ExternalLink },
    { key: "dribbble", label: "Dribbble", url: item.links.dribbble, icon: ExternalLink },
    { key: "liveDemo", label: "Jonli demo", url: item.links.liveDemo, icon: ExternalLink },
    { key: "figma", label: "Figma", url: item.links.figma, icon: ExternalLink },
  ].filter((l) => l.url);

  const completionLabel = new Date(item.completionDate).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <SiteNav />

      <div className="relative">
        <div className="relative h-48 sm:h-64 md:h-80">
          <PortfolioCover hue={item.hue} aspect="aspect-auto h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="-mt-20 relative sm:-mt-24">
            <nav className="font-mono mb-4 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Link to="/freelancers" className="hover:text-primary">Iste'dod</Link>
              <ChevronRight className="size-3 opacity-50" />
              <Link to={`/freelancers/${item.freelancerUsername}`} params={{ username: item.freelancerUsername }} className="hover:text-primary">
                {item.freelancerName}
              </Link>
              <ChevronRight className="size-3 opacity-50" />
              <span className="text-foreground">{item.title}</span>
            </nav>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-lg sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{item.category}</span>
                  <h1 className="font-display mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{item.title}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Yakunlangan {completionLabel}</p>
                  <Link
                    to={`/freelancers/${item.freelancerUsername}`}
                    params={{ username: item.freelancerUsername }}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-default hover:border-primary/20"
                  >
                    <GradientAvatar name={item.freelancerName} hue={item.freelancerHue} size={28} rounded="rounded-md" />
                    {item.freelancerName}
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isOwner && (
                    <Link
                      to="/portfolio/edit/$slug"
                      params={{ slug }}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary/20"
                    >
                      Tahrirlash
                    </Link>
                  )}
                  <PortfolioSaveButton slug={slug} />
                  <button type="button" onClick={handleShare} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary/20">
                    <Share2 className="inline size-4 mr-1" /> Ulashish
                  </button>
                  {isClientViewer && (
                    <button type="button" onClick={handleHire} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">
                      Yollash <ArrowRight className="inline size-4 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-8 min-w-0">
            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold">Loyiha ko'rinishi</h2>
              <p className="mt-4 text-base leading-relaxed text-foreground/85">{item.description}</p>
              {item.objectives && (
                <div className="mt-6">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-primary">Maqsadlar</h3>
                  <p className="mt-2 text-sm leading-relaxed">{item.objectives}</p>
                </div>
              )}
              {item.challenges && (
                <div className="mt-5">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-primary">Qiyinchiliklar</h3>
                  <p className="mt-2 text-sm leading-relaxed">{item.challenges}</p>
                </div>
              )}
              {item.solutions && (
                <div className="mt-5">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-primary">Yechimlar</h3>
                  <p className="mt-2 text-sm leading-relaxed">{item.solutions}</p>
                </div>
              )}
            </section>

            {item.metrics.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold">Natijalar</h2>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {item.metrics.map((m) => (
                    <div key={m.label} className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4 text-center">
                      <div className="font-display text-2xl font-bold text-primary">{m.value}</div>
                      <div className="font-mono mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
                    </div>
                  ))}
                </div>
                {item.outcomes && (
                  <p className="mt-5 text-sm leading-relaxed text-foreground/85">{item.outcomes}</p>
                )}
              </section>
            )}

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Galereya</h2>
                <button
                  type="button"
                  onClick={() => setFullscreen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Maximize2 className="size-3.5" /> To'liq ekran
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {galleryHues.map((hue, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox(i)}
                    className="overflow-hidden rounded-xl border border-border transition-default hover:border-primary/20 focus-ring"
                  >
                    <PortfolioCover hue={hue} aspect="aspect-[4/3]" />
                  </button>
                ))}
              </div>
            </section>

            {item.videoUrl && (
              <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold">Video ko'rib chiqish</h2>
                <a
                  href={item.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-secondary/20 p-4 transition-default hover:border-primary/20"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Play className="size-4 fill-current" />
                  </span>
                  <span className="text-sm font-medium">Loyiha videosini ko'rish</span>
                  <ExternalLink className="ml-auto size-4 text-muted-foreground" />
                </a>
              </section>
            )}

            <CaseStudyDisplay caseStudy={item.caseStudy} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display text-sm font-bold">Loyiha tafsilotlari</h3>
              <dl className="mt-4 space-y-3 text-sm">
                {item.clientName && (
                  <div><dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Mijoz</dt><dd className="mt-0.5 font-medium">{item.clientName}</dd></div>
                )}
                <div><dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Muddat</dt><dd className="mt-0.5 font-medium">{item.duration}</dd></div>
                <div><dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Jamoa</dt><dd className="mt-0.5 font-medium">{item.teamSize}</dd></div>
                <div><dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Byudjet</dt><dd className="mt-0.5 font-medium">{item.budgetRange}</dd></div>
              </dl>
            </div>

            {(item.skills.length > 0 || item.technologies.length > 0) && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display text-sm font-bold">Texnologiya steki</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[...item.skills, ...item.technologies].map((t) => (
                    <span key={t} className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {linkEntries.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display text-sm font-bold">Tashqi havolalar</h3>
                <div className="mt-3 space-y-2">
                  {linkEntries.map((l) => (
                    <a
                      key={l.key}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-default hover:border-primary/20 hover:text-primary"
                    >
                      <l.icon className="size-4 shrink-0" />
                      <span className="truncate">{l.label}</span>
                      <ExternalLink className="ml-auto size-3 shrink-0 opacity-50" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {!isAuthenticated || isClientViewer ? (
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.08] to-card p-5">
                <h3 className="font-display text-sm font-bold">O'xshash ish qiziqtiradimi?</h3>
                <p className="mt-2 text-xs text-muted-foreground">Yollash {item.freelancerName.split(" ")[0]}ni keyingi loyihangiz uchun yollang.</p>
                <div className="mt-4 flex flex-col gap-2">
                  <button type="button" onClick={handleHire} className="rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95">
                    Frilanserni yollash
                  </button>
                  <button type="button" onClick={handleContact} className="rounded-xl border border-border py-2.5 text-sm font-medium hover:border-primary/20">
                    <MessageSquare className="inline size-4 mr-1" /> Xabar yuborish
                  </button>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      {lightbox !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-8"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Galereya"
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute right-4 top-4 z-10 inline-flex size-10 items-center justify-center rounded-xl bg-white/10 text-white transition-default hover:bg-white/20 focus-ring"
              aria-label="Yopish"
            >
              <X className="size-5" />
            </button>
            <div
              className="flex w-full max-w-6xl flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <PortfolioCover
                hue={galleryHues[lightbox]!}
                aspect="aspect-video"
                className="w-full max-h-[calc(100dvh-8rem)] rounded-xl border border-white/10 shadow-2xl"
              />
              <div className="mt-4 flex w-full items-center justify-between text-white">
                <button
                  type="button"
                  onClick={() => setLightbox((lightbox - 1 + galleryHues.length) % galleryHues.length)}
                  className="inline-flex size-10 items-center justify-center rounded-lg bg-white/10 transition-default hover:bg-white/20 focus-ring"
                  aria-label="Oldingi rasm"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <span className="font-mono text-sm">
                  {lightbox + 1} / {galleryHues.length}
                </span>
                <button
                  type="button"
                  onClick={() => setLightbox((lightbox + 1) % galleryHues.length)}
                  className="inline-flex size-10 items-center justify-center rounded-lg bg-white/10 transition-default hover:bg-white/20 focus-ring"
                  aria-label="Keyingi rasm"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {fullscreen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label="To'liq ekran galereya">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <span className="text-sm font-medium text-white">
                Galereya · {galleryHues.length} ta rasm
              </span>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="inline-flex size-10 items-center justify-center rounded-xl bg-white/10 text-white transition-default hover:bg-white/20 focus-ring"
                aria-label="Yopish"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto p-4 sm:p-6">
              <div className="grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2">
                {galleryHues.map((hue, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setFullscreen(false);
                      setLightbox(i);
                    }}
                    className="w-full overflow-hidden rounded-xl border border-white/10 transition-default hover:border-white/30 focus-ring"
                  >
                    <PortfolioCover hue={hue} aspect="aspect-video" className="w-full" />
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}

      <SiteFooter />
    </div>
  );
}
