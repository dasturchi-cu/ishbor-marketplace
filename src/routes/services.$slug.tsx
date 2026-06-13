import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Star, Clock, Check, ChevronRight, Users, ShieldCheck, MessageSquare, Heart, Share2, ShoppingCart } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { GradientAvatar } from "@/components/site/avatar";
import { ServiceCard } from "@/components/site/cards";
import { SellerTrustBar, EscrowShield, VerifiedIdentityBadge } from "@/components/site/trust";
import { ConversionFlowBanner, CLIENT_HIRE_FLOW } from "@/components/site/conversion-flow";
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

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const raw = services.find((x) => x.slug === params.slug);
    if (!raw) throw notFound();
    const service = enrichService(raw);
    const serviceReviews = getServiceReviews(params.slug);
    const similarServices = getSimilarServices(params.slug);
    return { service, serviceReviews, similarServices };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.service?.title ?? "Service"} — Ishbor` },
      { name: "description", content: loaderData?.service?.description ?? "" },
    ],
  }),
  notFoundComponent: () => <div className="p-8">Service not found</div>,
  errorComponent: ({ error }) => <div className="p-8">{error.message}</div>,
  component: ServiceDetail,
});

function ServiceDetail() {
  const { service, serviceReviews, similarServices } = Route.useLoaderData();
  const [saved, setSaved] = useState(false);
  const defaultPkg = service.packages.find((p) => p.popular)?.tier.toLowerCase() ?? "premium";

  const handleShare = async () => {
    const url = `${window.location.origin}/services/${service.slug}`;
    if (navigator.share) {
      await navigator.share({ title: service.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Service link copied");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="font-mono mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link to="/services">Services</Link>
          <ChevronRight className="size-3" />
          <span>{service.category}</span>
          <ChevronRight className="size-3" />
          <span className="line-clamp-1 text-foreground">{service.title}</span>
        </nav>

        <ConversionFlowBanner
          title="Client hiring path"
          steps={CLIENT_HIRE_FLOW}
          currentStep="service"
          nextHint="Order this service to fund escrow-protected work. Payment is released only when you approve delivery."
          className="mb-8"
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div>
            <h1 className="font-display max-w-2xl text-balance text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
              {service.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <Link
                to="/freelancers/$username"
                params={{ username: service.sellerUsername }}
                className="flex items-center gap-2 transition-default hover:opacity-80"
              >
                <GradientAvatar name={service.seller} hue={service.sellerHue} size={28} />
                <span className="font-medium">{service.seller}</span>
              </Link>
              <div className="inline-flex items-center gap-1 text-muted-foreground">
                <Star className="size-3.5 fill-gold text-gold" />
                <span className="font-mono text-foreground">{service.rating.toFixed(2)}</span>
                <span>({service.reviews} reviews)</span>
              </div>
              <div className="inline-flex items-center gap-1 text-muted-foreground">
                <Clock className="size-3.5" />
                {service.delivery} delivery
              </div>
              {service.inProgress > 0 && (
                <div className="inline-flex items-center gap-1 text-muted-foreground">
                  <Users className="size-3.5" />
                  {service.inProgress} in progress
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/checkout"
                search={{
                  type: "service" as const,
                  service: service.slug,
                  package: defaultPkg as "essential" | "premium" | "enterprise",
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] transition-default hover:opacity-90 focus-ring"
              >
                <ShoppingCart className="size-4" /> Order now
              </Link>
              <Link
                to="/messages"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-default hover:border-primary/20 focus-ring"
              >
                <MessageSquare className="size-4" /> Contact freelancer
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSaved((v) => !v);
                  toast.success(saved ? "Removed from saved" : "Service saved");
                }}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-default focus-ring ${
                  saved ? "border-primary/30 bg-primary/5 text-primary" : "border-border hover:border-primary/20"
                }`}
              >
                <Heart className={`size-4 ${saved ? "fill-primary" : ""}`} /> Save service
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-default hover:border-primary/20 focus-ring"
              >
                <Share2 className="size-4" /> Share service
              </button>
            </div>

            <div className="mt-5">
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

            <div className="mt-6">
              <ServiceGallery images={service.gallery} hue={service.hue} />
            </div>

            {/* Trust indicators */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2 rounded-xl border border-success/15 bg-success/5 px-3 py-2.5 text-sm">
                <EscrowShield size="sm" />
              </div>
              {service.sellerIdentityVerified && (
                <div className="flex items-center gap-2 rounded-xl border border-success/15 bg-success/5 px-3 py-2.5 text-sm">
                  <VerifiedIdentityBadge />
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl border border-border bg-primary/8 px-3 py-2.5 text-sm text-primary">
                <Clock className="size-4" /> Responds {service.sellerResponseTime}
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-primary/8 px-3 py-2.5 text-sm text-primary">
                <ShieldCheck className="size-4" /> {service.sellerRepeatClients}% repeat clients
              </div>
            </div>

            <section className="mt-12">
              <h2 className="font-display mb-4 text-2xl font-bold tracking-tight">About this service</h2>
              <p className="leading-relaxed text-foreground/85">{service.description}</p>
              <p className="mt-4 leading-relaxed text-foreground/85">{service.descriptionExtended}</p>

              <h3 className="font-display mt-10 text-lg font-bold">What&apos;s included</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {service.included.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-primary" /> {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12">
              <h2 className="font-display mb-4 text-2xl font-bold tracking-tight">Compare packages</h2>
              <PackageComparison packages={service.packages} />
            </section>

            <section className="mt-12">
              <h2 className="font-display mb-4 text-2xl font-bold tracking-tight">Frequently asked questions</h2>
              <FaqSection faqs={service.faqs} />
            </section>

            <section className="mt-12 border-t border-border pt-8">
              <h2 className="font-display mb-6 text-2xl font-bold tracking-tight">Reviews</h2>
              <ServiceReviews
                reviews={serviceReviews}
                rating={service.rating}
                totalReviews={service.reviews}
              />
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <PackageCard
              packages={service.packages}
              serviceSlug={service.slug}
              queuePosition={service.queuePosition}
            />

            <div className="rounded-xl border border-primary/20 bg-primary/8 p-5">
              <h4 className="text-sm font-semibold">Your money is safe</h4>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Payment is held in escrow and only released when you approve the delivered work. Full refund if
                the seller fails to deliver on time.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border bg-background p-2">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Queue</div>
                  <div className="font-mono text-sm font-semibold">{service.queuePosition} ahead</div>
                </div>
                <div className="rounded-lg border border-border bg-background p-2">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    Resolution
                  </div>
                  <div className="font-mono text-sm font-semibold">&lt; 24h</div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-20 border-t border-border pt-12">
          <h2 className="font-display mb-6 text-2xl font-bold tracking-tight">Similar services</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {similarServices.map((s) => (
              <ServiceCard key={s.id} s={s} />
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />

      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border bg-card/95 p-3 backdrop-blur lg:hidden">
        <Link
          to="/checkout"
          search={{
            type: "service" as const,
            service: service.slug,
            package: defaultPkg as "essential" | "premium" | "enterprise",
          }}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground focus-ring"
        >
          <ShoppingCart className="size-4" /> Order now
        </Link>
        <Link
          to="/messages"
          className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium focus-ring"
        >
          <MessageSquare className="size-4" />
        </Link>
      </div>
    </div>
  );
}
