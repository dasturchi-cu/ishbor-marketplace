import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { Check, Sparkles, ChevronLeft, ArrowRight, CreditCard, Building2, Bot } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { ConversionFlowBanner } from "@/components/site/conversion-flow";
import { PlanUsageSummary } from "@/components/monetization/plan-usage-summary";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import { getActiveDashboardPath } from "@/lib/active-role-store";
import { PLANS, getSubscription, getProposalUsage, subscribeSubscriptions, type PlanId } from "@/lib/subscription-store";
import { subscribeServices, getMyPublishedServices } from "@/lib/services-store";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Narxlar — Ishbor" }] }),
  component: PricingPage,
});

const planFeatures: Record<PlanId, string[]> = {
  free: [
    "10 ta taklif / oy",
    "3 ta xizmat",
    "Asosiy profil",
    "Marketplace kirish",
  ],
  pro: [
    "Cheksiz takliflar",
    "20 ta xizmat",
    "Ajratilgan profil",
    "Ustuvor qo'llab-quvvatlash",
    "Kengaytirilgan analitika",
    "Ajratilgan 10% chegirma",
  ],
  elite: [
    "Pro dagi hamma narsa",
    "Cheksiz xizmatlar",
    "Ajratilgan ro'yxatlar",
    "Elite nishoni",
    "Ustuvor reyting (+25 ball)",
    "Ajratilgan 20% chegirma",
  ],
};

const PRICING_FLOW = [
  { key: "compare", label: "Rejani tanlash" },
  { key: "subscribe", label: "To'lov", to: "/subscription" },
  { key: "active", label: "Faollashtirish", to: "/dashboard/freelancer" },
];

function nextStepCopy(plan: PlanId, isAuth: boolean): { hint: string; primaryLabel: string; primaryTo: string; primarySearch?: { plan?: PlanId } } {
  if (!isAuth) {
    return {
      hint: "Frilanser sifatida ro'yxatdan o'ting, keyin mos rejani tanlang va darhol ishlay boshlang.",
      primaryLabel: "Ro'yxatdan o'tish",
      primaryTo: "/register",
    };
  }
  if (plan === "elite") {
    return {
      hint: "Elite rejangiz faol. Obunani boshqaring yoki ish maydoniga qayting.",
      primaryLabel: "Obunani boshqarish",
      primaryTo: "/subscription",
    };
  }
  if (plan === "pro") {
    return {
      hint: "Pro rejangiz faol. Elite ga o'ting yoki obunani boshqaring.",
      primaryLabel: "Elite ga o'tish",
      primaryTo: "/subscription",
      primarySearch: { plan: "elite" },
    };
  }
  return {
    hint: "Ko'proq taklif va analitika uchun Pro rejani tanlang — keyingi qadam to'lov.",
    primaryLabel: "Pro rejani tanlash",
    primaryTo: "/subscription",
    primarySearch: { plan: "pro" },
  };
}

function PricingPage() {
  const { user, isAuthenticated } = useAuth();
  const { activeRole } = useActiveRole();
  const paidPlans: PlanId[] = ["free", "pro", "elite"];
  const currentPlan = user ? getSubscription(user.id).plan : "free";
  const backTo = isAuthenticated ? getActiveDashboardPath(activeRole) : "/";
  const backLabel = isAuthenticated ? "Ish maydoniga qaytish" : "Bosh sahifa";
  const next = nextStepCopy(currentPlan, isAuthenticated);

  useSyncExternalStore(
    subscribeSubscriptions,
    () => (user ? getProposalUsage(user.id).used : 0),
    () => 0,
  );
  useSyncExternalStore(
    subscribeServices,
    () => (user ? getMyPublishedServices(user.id).length : 0),
    () => 0,
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <nav className="font-mono mb-6 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link
            to={backTo}
            className="touch-target inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-default hover:border-primary/20 focus-ring"
          >
            <ChevronLeft className="size-3.5" />
            {backLabel}
          </Link>
          <span className="hidden text-border sm:inline">/</span>
          <span className="text-foreground">Tariflar</span>
        </nav>

        <ConversionFlowBanner
          title="Obuna yo'li"
          steps={PRICING_FLOW}
          currentStep="compare"
          nextHint={next.hint}
          variant="compact"
          className="mb-6"
        />

        <div className="mb-10 text-center">
          <div className="eyebrow">Frilanser obunasi</div>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Rejalar va narxlar</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Takliflar, xizmatlar va ko'rinish uchun mos rejani tanlang. Tanlaganingizdan keyin to'lov va faollashtirish bir necha qadamda yakunlanadi.
          </p>
        </div>

        <div className="mb-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {(currentPlan === "free" || !isAuthenticated) && (
            <Link
              to={next.primaryTo}
              search={next.primarySearch}
              className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.25)] transition-default hover:opacity-90 focus-ring sm:w-auto"
            >
              {next.primaryLabel}
              <ArrowRight className="size-4" />
            </Link>
          )}
          {currentPlan === "pro" && isAuthenticated && (
            <Link
              to="/subscription"
              search={{ plan: "elite" }}
              className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.25)] transition-default hover:opacity-90 focus-ring sm:w-auto"
            >
              Elite ga o&apos;tish
              <ArrowRight className="size-4" />
            </Link>
          )}
          <Link
            to={backTo}
            className="touch-target inline-flex w-full items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-medium transition-default hover:border-primary/20 focus-ring sm:w-auto"
          >
            {backLabel}
          </Link>
        </div>

        {isAuthenticated && user && (
          <PlanUsageSummary userId={user.id} planId={currentPlan} className="mb-6" />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paidPlans.map((id) => {
            const plan = PLANS[id];
            const highlighted = id === "pro";
            const isCurrent = isAuthenticated && currentPlan === id;
            return (
              <div
                key={id}
                className={`relative flex flex-col rounded-2xl border p-5 sm:p-6 ${
                  highlighted ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-card"
                } ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
              >
                {highlighted && !isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Mashhur
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/30 bg-card px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Joriy reja
                  </span>
                )}
                <div className="flex items-center gap-2">
                  {id === "elite" && <Sparkles className="size-4 text-amber-500" />}
                  <h2 className="font-display text-xl font-bold">{plan.name}</h2>
                </div>
                <div className="mt-3">
                  <span className="font-display text-3xl font-extrabold">
                    {plan.priceMonthly === 0 ? "Bepul" : `${plan.priceMonthly.toLocaleString()} UZS`}
                  </span>
                  {plan.priceMonthly > 0 && (
                    <span className="text-sm text-muted-foreground"> / oy</span>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {planFeatures[id].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <span className="mt-6 block w-full rounded-lg border border-primary/20 bg-primary/5 py-2.5 text-center text-sm font-semibold text-primary">
                    Faol reja
                  </span>
                ) : (
                  <Link
                    to="/subscription"
                    search={{ plan: id === "free" ? undefined : id }}
                    className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-default focus-ring ${
                      highlighted
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "border border-border hover:border-primary/30"
                    }`}
                  >
                    {id === "free" ? "Bepul rejada qolish" : `${plan.name} tanlash`}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold">Boshqa imkoniyatlar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Obunadan tashqari — kreditlar, agentlik va AI vositalari alohida bo'limlarda.
          </p>
          <ul className="mt-5 divide-y divide-border">
            <li>
              <Link
                to="/promotions"
                className="flex items-center justify-between gap-4 py-3 transition-default hover:text-primary"
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <CreditCard className="size-4 text-primary" />
                  Promotsiya va kreditlar
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
            <li>
              <Link
                to="/agencies"
                className="flex items-center justify-between gap-4 py-3 transition-default hover:text-primary"
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <Building2 className="size-4 text-primary" />
                  Agentliklar va jamoa
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
            <li>
              <Link
                to="/ai"
                className="flex items-center justify-between gap-4 py-3 transition-default hover:text-primary"
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <Bot className="size-4 text-primary" />
                  AI yordamchi markazi
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
