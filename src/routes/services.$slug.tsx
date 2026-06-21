import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import { LoadingSpinner } from "@/components/site/feedback";
import { Star, Clock, Check, ChevronRight, Users, ShieldCheck, MessageSquare, Share2, ShoppingCart, Lock, Repeat2 } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { GradientAvatar } from "@/components/site/avatar";
import { ServiceCard } from "@/components/site/cards";
import { SellerTrustBar, TrustGuaranteeCard } from "@/components/site/trust";
import { SaveButtonInline } from "@/components/site/save-button";
import { ConversionFlowBanner, SERVICE_ORDER_FLOW } from "@/components/site/conversion-flow";
import { ServiceGallery } from "@/components/site/service-detail/gallery";
import { PackageCard, PackageComparison } from "@/components/site/service-detail/package-card";
import { FaqSection } from "@/components/site/service-detail/faq-section";
import { ServiceReviews } from "@/components/site/service-detail/reviews-section";
import {
  services,
  enrichService,
  getServiceReviews,
  getSimilarServices,
} from "@/lib/mock-data";
import { getServiceBySlug, subscribeServices } from "@/lib/services-store";
import { applyLiveServiceMetrics } from "@/lib/growth-metrics";
import { recordServiceView } from "@/lib/analytics-utils";
import { FeaturedPurchaseCard } from "@/components/analytics/featured-purchase-card";
import { useAuth } from "@/hooks/use-auth";
import { isFeaturedActive } from "@/lib/featured-store";
import { getSession } from "@/lib/auth";
import { EntityNotFound } from "@/components/site/entity-not-found";
import { ClientCheckoutLink } from "@/components/checkout/client-checkout-link";

export const Route = createFileRoute("/services/$slug")({
  head: () => ({ meta: [{ title: "Xizmat — Ishbor" }] }),
  component: ServiceDetail,
});

function resolveService(slug: string, stored?: ReturnType<typeof getServiceBySlug>) {
  const storedService = stored ?? getServiceBySlug(slug);
  const raw = storedService ?? services.find((x) => x.slug === slug);
  if (!raw) return null;
  const session = getSession();
  const status = storedService?.status ?? "published";
  const isOwner = !!(session && storedService?.ownerUserId === session.user.id);
  if (status !== "published" && !isOwner) return null;
  return {
    service: applyLiveServiceMetrics(enrichService(raw)),
    serviceReviews: getServiceReviews(slug),
    similarServices: getSimilarServices(slug),
  };
}

function ServiceDetail() {
  const { slug } = Route.useParams();
  const hydrated = useClientHydrated();
  const storedService = useSyncExternalStore(
    subscribeServices,
    () => getServiceBySlug(slug),
    () => services.find((x) => x.slug === slug),
  );
  const data = useMemo(() => {
    if (!hydrated) return undefined;
    return resolveService(slug, storedService);
  }, [hydrated, slug, storedService]);
  const { user } = useAuth();

  if (!hydrated || data === undefined) {
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

  if (!data) {
    return (
      <EntityNotFound
        title="Xizmat topilmadi"
        description="Bu xizmat mavjud emas, arxivlangan yoki hali e'lon qilinmagan."
        backTo="/services"
        backLabel="Xizmatlarni ko'rish"
      />
    );
  }

  return <ServiceDetailContent {...data} user={user} />;
}

function ServiceDetailContent({
  service,
  serviceReviews,
  similarServices,
  user,
}: {
  service: ReturnType<typeof enrichService>;
  serviceReviews: ReturnType<typeof getServiceReviews>;
  similarServices: ReturnType<typeof getSimilarServices>;
  user: ReturnType<typeof useAuth>["user"];
}) {
  const defaultPkg =
    service.packages.find((p) => p.popular)?.tier.toLowerCase() ??
    service.packages[0]?.tier.toLowerCase() ??
    "essential";
  const isOwner = user?.username === service.sellerUsername;

  useEffect(() => {
    recordServiceView(service.slug, service.sellerUsername);
  }, [service.slug, service.sellerUsername]);

  const handleShare = async () => {
    const url = `${window.location.origin}/services/${service.slug}`;
    if (navigator.share) {
      await navigator.share({ title: service.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Xizmat havolasi nusxalandi");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <nav className="font-mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link to="/services" className="transition-default hover:text-primary">Xizmatlar</Link>
          <ChevronRight className="size-3 opacity-50" />
          <span>{service.category}</span>
          <ChevronRight className="size-3 opacity-50" />
          <span className="line-clamp-1 text-foreground">{service.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
          <div className="space-y-8">
            {/* Service hero */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_-24px_oklch(0.546_0.185_257/0.14)]">
              <div className="p-6 sm:p-8">
                <div className="font-mono inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  {service.category}
                </div>
                <h1 className="font-display mt-4 max-w-3xl text-balance text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-[2rem] lg:leading-tight">
                  {service.title}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-2.5 text-sm">
                  <Link
                    to="/freelancers/$username"
                    params={{ username: service.sellerUsername }}
                    className="inline-flex items-center gap-2.5 rounded-full border border-border bg-secondary/40 py-1.5 pl-1.5 pr-3.5 transition-default hover:border-primary/25 hover:bg-primary/[0.04]"
                  >
                    <GradientAvatar name={service.seller} hue={service.sellerHue} size={32} rounded="rounded-full" />
                    <span className="font-medium">{service.seller}</span>
                  </Link>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-muted-foreground">
                    <Star className="size-3.5 fill-gold text-gold" />
                    <span className="font-mono font-semibold text-foreground">{service.rating.toFixed(2)}</span>
                    <span>({service.reviews})</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-muted-foreground">
                    <Clock className="size-3.5" />
                    {service.delivery}
                  </span>
                  {service.inProgress > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-muted-foreground">
                      <Users className="size-3.5" />
                      {service.inProgress} jarayonda
                    </span>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {!isOwner ? (
                    <ClientCheckoutLink
                      search={{
                        type: "service" as const,
                        service: service.slug,
                        package: defaultPkg as "essential" | "premium" | "enterprise",
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_10px_28px_-10px_oklch(0.546_0.185_257/0.45)] transition-default hover:opacity-95 active:scale-[0.98] focus-ring"
                    >
                      <ShoppingCart className="size-4" /> Hozir buyurtma berish
                    </ClientCheckoutLink>
                  ) : (
                    <Link
                      to="/my-services"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold transition-default hover:border-primary/25"
                    >
                      Xizmatni boshqarish
                    </Link>
                  )}
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-1 sm:max-w-md">
                    <Link
                      to="/messages"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium transition-default hover:border-primary/25 focus-ring"
                    >
                      <MessageSquare className="size-4" /> Bog'lanish
                    </Link>
                    <SaveButtonInline type="service" id={service.slug} />
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium transition-default hover:border-primary/25 focus-ring"
                    >
                      <Share2 className="size-4" />
                      <span className="hidden sm:inline">Ulashish</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-border px-6 py-5 sm:px-8">
                <SellerTrustBar
                  level={service.sellerLevel}
                  identityVerified={service.sellerIdentityVerified}
                  successScore={service.sellerSuccessScore}
                  completionRate={service.sellerCompletionRate}
                  onTime={service.sellerOnTime}
                  responseTime={service.sellerResponseTime}
                  repeatClients={service.sellerRepeatClients}
                  totalEarned={service.sellerTotalEarned}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <ServiceGallery images={service.gallery} hue={service.hue} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TrustGuaranteeCard
                icon={Lock}
                label="Eskrou himoyalangan"
                detail="Tasdiqdan keyin mablag' chiqariladi"
                tone="primary"
                layout="inline"
              />
              {service.sellerIdentityVerified && (
                <TrustGuaranteeCard
                  icon={ShieldCheck}
                  label="Shaxs tasdiqlangan"
                  detail="Davlat ID tasdiqlangan"
                  tone="success"
                  layout="inline"
                />
              )}
              <TrustGuaranteeCard
                icon={Clock}
                label={`Javob beradi ${service.sellerResponseTime}`}
                detail="O'rtacha javob vaqti"
                tone="neutral"
                layout="inline"
              />
              <TrustGuaranteeCard
                icon={Repeat2}
                label={`${service.sellerRepeatClients}% takroriy`}
                detail="Mijozlar qayta yollaydi"
                tone="neutral"
                layout="inline"
              />
            </div>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold tracking-tight">Bu xizmat haqida</h2>
              <p className="mt-4 max-w-prose leading-relaxed text-foreground/85">{service.description}</p>
              <p className="mt-4 max-w-prose leading-relaxed text-foreground/85">{service.descriptionExtended}</p>

              <h3 className="font-display mt-8 text-lg font-bold">What&apos;s included</h3>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {service.included.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5 text-sm">
                    <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} /> {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold tracking-tight">Paketlarni solishtirish</h2>
              <p className="mt-1 text-sm text-muted-foreground">Vaqt va byudjetingizga mos doirani tanlang</p>
              <div className="mt-5">
                <PackageComparison packages={service.packages} serviceSlug={service.slug} />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold tracking-tight">Ko'p so'raladigan savollar</h2>
              <div className="mt-5">
                <FaqSection faqs={service.faqs} />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold tracking-tight">Sharhlar</h2>
              <p className="mt-1 text-sm text-muted-foreground">{service.reviews} tasdiqlangan mijoz sharhi</p>
              <div className="mt-5">
                <ServiceReviews
                  reviews={serviceReviews}
                  rating={service.rating}
                  totalReviews={service.reviews}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <PackageCard
              packages={service.packages}
              serviceSlug={service.slug}
              queuePosition={service.queuePosition}
            />

            <ConversionFlowBanner
              title="Xizmat buyurtmasi"
              steps={SERVICE_ORDER_FLOW}
              currentStep="service"
              nextHint="Paketni tanlang va eskrou himoyasi bilan buyurtma bering."
              variant="compact"
            />

            {isOwner && (
              <FeaturedPurchaseCard
                target={{ type: "service", slug: service.slug, title: service.title }}
                featured={isFeaturedActive(service.featured, service.featuredUntil)}
                featuredUntil={service.featuredUntil}
              />
            )}

            <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card">
              <div className="border-b border-primary/10 px-5 py-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <h4 className="text-sm font-semibold">Pulingiz xavfsiz</h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  To'lov eskrouda saqlanadi va faqat yetkazilgan ishni tasdiqlaganingizda chiqariladi. To'liq qaytarish, agar
                  sotuvchi vaqtida yetkaza olmasa.
                </p>
              </div>
              <div className="grid grid-cols-2 divide-x divide-border/80">
                <div className="px-5 py-4">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Navbat</div>
                  <div className="font-display mt-1 text-lg font-bold">{service.queuePosition} oldinda</div>
                </div>
                <div className="px-5 py-4">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    Hal qilish
                  </div>
                  <div className="font-display mt-1 text-lg font-bold">&lt; 24h</div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-16 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border bg-gradient-to-r from-primary/[0.06] via-secondary/30 to-transparent px-6 py-6 sm:px-8">
            <h2 className="font-display text-xl font-bold tracking-tight">O'xshash xizmatlar</h2>
            <p className="mt-1 text-sm text-muted-foreground">Bo'limidagi boshqa variantlar {service.category}</p>
          </div>
          <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4 stagger-children">
            {similarServices.map((s) => (
              <ServiceCard key={s.id} s={s} compact />
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />

      {!isOwner && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border bg-card/95 p-3 backdrop-blur-md lg:hidden">
          <ClientCheckoutLink
            search={{
              type: "service" as const,
              service: service.slug,
              package: defaultPkg as "essential" | "premium" | "enterprise",
            }}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.4)] focus-ring"
          >
            <ShoppingCart className="size-4" /> Hozir buyurtma berish
          </ClientCheckoutLink>
          <Link
            to="/messages"
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-medium focus-ring"
          >
            <MessageSquare className="size-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
