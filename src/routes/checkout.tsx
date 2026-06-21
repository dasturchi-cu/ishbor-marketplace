import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, type ReactNode } from "react";
import { toast } from "sonner";
import { Lock, ShieldCheck, CircleCheck as CheckCircle2, ArrowRight, ChevronLeft, CreditCard, Building2, Clock } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { EntityNotFound } from "@/components/site/entity-not-found";
import { GradientAvatar } from "@/components/site/avatar";
import { EscrowShield, LevelBadge, CompactTrustRow, TrustGuaranteeCard } from "@/components/site/trust";
import { ConversionFlowBanner, SERVICE_ORDER_FLOW, FREELANCER_HIRE_CHECKOUT_FLOW, ORDER_ESCROW_FLOW } from "@/components/site/conversion-flow";
import { enrichService, freelancers, services, type Service, type Freelancer } from "@/lib/mock-data";
import { requireRole } from "@/lib/guards";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { getOrderById, fundOrderEscrow } from "@/lib/orders-store";
import { fundEscrow, getEscrowByOrderId } from "@/lib/escrow-store";
import { getProjectBySlug } from "@/lib/projects-store";
import { createOrder } from "@/lib/orders-store";
import { createEscrowFromOrder } from "@/lib/escrow-store";
import { holdEscrowFunds } from "@/lib/wallet-store";
import { addNotification } from "@/lib/notifications-store";
import { useAuth } from "@/hooks/use-auth";
import { formatPackageTier } from "@/lib/project-validation";
import { recordConversionEvent } from "@/lib/conversion-store";
import { recordServiceOrder } from "@/lib/analytics-utils";
import { recordAnalyticsEvent } from "@/lib/analytics-events-store";
import { getAllServices } from "@/lib/services-store";
import { computeSuccessScore } from "@/lib/growth-metrics";
import { StickyMobileCta } from "@/components/ux/sticky-mobile-cta";
import { primaryActionClass } from "@/components/ux/action-buttons";

type CheckoutSearch = {
  type?: "service" | "hire" | "order";
  service?: string;
  freelancer?: string;
  project?: string;
  order?: string;
  package?: "essential" | "premium" | "enterprise";
};

type CheckoutKind = CheckoutSearch["type"];

function checkoutPresentation(type: CheckoutKind, step: "review" | "payment") {
  if (type === "hire") {
    return {
      flowTitle: "Mutaxassis yollash",
      flowSteps: FREELANCER_HIRE_CHECKOUT_FLOW,
      flowStep: "checkout" as const,
      reviewTitle: step === "payment" ? "Yollash to'lovini yakunlang" : "Yollash shartlarini ko'rib chiqing",
      reviewHint:
        step === "payment"
          ? "Frilanser depoziti eskrouda saqlanadi — ish tasdiqlanguncha mablag' chiqarilmaydi."
          : "Soatlik stavka va taxminiy hajmni tasdiqlang, keyin to'lovga o'ting.",
      confirmedBannerTitle: "Mutaxassis yollash yakunlandi",
      confirmedHint: "Buyurtmalarda ish bosqichlarini kuzating va tasdiqlanganda eskrouni chiqaring.",
    };
  }
  if (type === "order") {
    return {
      flowTitle: "Eskrou moliyalashtirish",
      flowSteps: ORDER_ESCROW_FLOW,
      flowStep: "checkout" as const,
      reviewTitle: step === "payment" ? "Eskrou to'lovini yakunlang" : "Buyurtmani moliyalashtiring",
      reviewHint:
        step === "payment"
          ? "Qabul qilingan taklif uchun mablag' eskrouga o'tkaziladi."
          : "Frilanser ishni boshlashi uchun eskrouni moliyalashtiring.",
      confirmedBannerTitle: "Eskrou moliyalashtirildi",
      confirmedHint: "Buyurtma faol — yetkazilish bosqichlarini kuzating.",
    };
  }
  return {
    flowTitle: "Xizmat buyurtmasi",
    flowSteps: SERVICE_ORDER_FLOW,
    flowStep: "checkout" as const,
    reviewTitle: step === "payment" ? "Xizmat to'lovini yakunlang" : "Xizmat buyurtmangizni ko'rib chiqing",
    reviewHint:
      step === "payment"
        ? "Xizmat narxi eskrouda saqlanadi — faqat tasdiqlangan ish uchun chiqariladi."
        : "Paket, yetkazish va tuzatishlar to'g'ri ekanini tekshiring, keyin to'lovga o'ting.",
    confirmedBannerTitle: "Xizmat buyurtmasi tasdiqlandi",
    confirmedHint: "Buyurtmalar bo'limida yetkazilish va tasdiqlashni kuzating.",
  };
}

export const Route = createFileRoute("/checkout")({
  beforeLoad: requireRole(["client"]),
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => ({
    type:
      search.type === "hire" ? "hire"
      : search.type === "service" ? "service"
      : search.type === "order" ? "order"
      : undefined,
    service: typeof search.service === "string" ? search.service : undefined,
    freelancer: typeof search.freelancer === "string" ? search.freelancer : undefined,
    project: typeof search.project === "string" ? search.project : undefined,
    order: typeof search.order === "string" ? search.order : undefined,
    package:
      search.package === "essential" || search.package === "premium" || search.package === "enterprise"
        ? search.package
        : undefined,
  }),
  head: () => ({ meta: [{ title: "To'lov — Ishbor" }] }),
  component: () => (
    <ProtectedGate roles={["client"]}>
      <CheckoutPage />
    </ProtectedGate>
  ),
});

function CheckoutPage() {
  const search = Route.useSearch();
  const { user } = useAuth();
  const type = search.type ?? "service";

  const service = type === "service" && search.service
    ? getAllServices().find((s) => s.slug === search.service) ?? services.find((s) => s.slug === search.service) ?? null
    : null;
  const freelancer = search.freelancer
    ? freelancers.find((f) => f.username === search.freelancer)
    : null;
  const project = search.project ? getProjectBySlug(search.project) : null;
  const existingOrder = search.order ? getOrderById(search.order) : null;

  const [step, setStep] = useState<"review" | "payment" | "confirmed">("review");
  const [paymentMethod, setPaymentMethod] = useState<"humo" | "uzcard" | "swift">("humo");
  const [confirmedOrderId, setConfirmedOrderId] = useState("");
  const [confirmedEscrowId, setConfirmedEscrowId] = useState("");
  const [confirmedSellerUsername, setConfirmedSellerUsername] = useState<string | undefined>();
  const [paying, setPaying] = useState(false);

  const presentation = checkoutPresentation(type, step === "payment" ? "payment" : "review");

  const selectedPaket =
    type === "service" && service
      ? enrichService(service).packages.find(
          (p) => p.tier.toLowerCase() === (search.package ?? "premium"),
        ) ?? enrichService(service).packages.find((p) => p.popular) ?? enrichService(service).packages[0]
      : null;

  const total =
    type === "order" && existingOrder ? existingOrder.amount
    : type === "hire" && project && freelancer ? project.budget
    : type === "hire" && freelancer ? freelancer.rate * 20
    : type === "service" && selectedPaket ? selectedPaket.price
    : service?.price ?? 0;
  const platformFee = Math.round(total * 0.05);
  const escrowSumma = total;

  const checkoutError = useMemo(() => {
    if (type === "service") {
      if (!search.service) return "Xizmat tanlanmagan.";
      if (!service) return "Xizmat topilmadi.";
    }
    if (type === "hire") {
      if (!search.freelancer) return "Frilanser tanlanmagan.";
      if (!freelancer) return "Frilanser topilmadi.";
    }
    if (type === "order") {
      if (!search.order) return "Buyurtma tanlanmagan.";
      if (!existingOrder) return "Buyurtma topilmadi.";
      if (existingOrder.escrowFunded) return "Bu buyurtma allaqachon moliyalashtirilgan.";
    }
    if (total <= 0) return "To'lov summasi noto'g'ri.";
    return null;
  }, [type, search.service, search.freelancer, search.order, service, freelancer, existingOrder, total]);

  useEffect(() => {
    recordConversionEvent("checkout_start", search.service ?? search.freelancer ?? search.order);
  }, [search.service, search.freelancer, search.order]);

  const handleConfirmPayment = () => {
    if (paying || checkoutError || !user) return;
    setPaying(true);

    let orderTitle = "";
    let newOrderId = "";
    let newEscrowId = "";
    let sellerUsername: string | undefined;
    const chargeAmount = total + platformFee;

    const finishFail = (message: string) => {
      toast.error(message);
      setPaying(false);
    };

    if (type === "order" && existingOrder) {
      const funded = fundOrderEscrow(existingOrder.id);
      if (!funded) {
        finishFail("Buyurtmani moliyalashtirib bo'lmadi.");
        return;
      }
      const escrow = fundEscrow(existingOrder.id) ?? getEscrowByOrderId(existingOrder.id);
      if (!escrow) {
        finishFail("Eskrou yozuvi yaratilmadi.");
        return;
      }
      const wallet = holdEscrowFunds(user.id, chargeAmount, existingOrder.title);
      if (!wallet) {
        finishFail("Hamyon balansi yetarli emas.");
        return;
      }
      newOrderId = existingOrder.id;
      newEscrowId = escrow.id;
      orderTitle = existingOrder.title;
      sellerUsername = existingOrder.freelancerUsername;
    } else if (type === "hire" && freelancer) {
      const order = createOrder({
        title: project ? project.title : `Yollash ${freelancer.name}`,
        client: user.company ?? user.fullName,
        clientHue: user.avatarHue,
        clientSlug: user.companySlug,
        freelancer: freelancer.name,
        freelancerHue: freelancer.hue,
        freelancerUsername: freelancer.username,
        amount: total,
      });
      const escrow = createEscrowFromOrder(order);
      fundOrderEscrow(order.id);
      fundEscrow(order.id);
      const wallet = holdEscrowFunds(user.id, chargeAmount, order.title);
      if (!wallet) {
        finishFail("Hamyon balansi yetarli emas.");
        return;
      }
      newOrderId = order.id;
      newEscrowId = escrow.id;
      orderTitle = order.title;
      sellerUsername = freelancer.username;
    } else if (type === "service" && service) {
      const pkg = selectedPaket ?? enrichService(service).packages[0]!;
      const order = createOrder({
        title: `${service.title} — ${formatPackageTier(pkg.tier)}`,
        client: user.company ?? user.fullName,
        clientHue: user.avatarHue,
        clientSlug: user.companySlug,
        freelancer: service.seller,
        freelancerHue: service.sellerHue,
        freelancerUsername: service.sellerUsername,
        amount: pkg.price,
        dueDate: pkg.delivery,
      });
      const escrow = createEscrowFromOrder(order);
      fundOrderEscrow(order.id);
      fundEscrow(order.id);
      const wallet = holdEscrowFunds(user.id, pkg.price + platformFee, order.title);
      if (!wallet) {
        finishFail("Hamyon balansi yetarli emas.");
        return;
      }
      newOrderId = order.id;
      newEscrowId = escrow.id;
      orderTitle = order.title;
      sellerUsername = service.sellerUsername;
      recordConversionEvent("order_created", order.id, pkg.price);
      recordAnalyticsEvent({ type: "escrow_funded", entityId: order.id, value: pkg.price });
      recordServiceOrder(service.slug, service.sellerUsername, pkg.price);
    } else {
      finishFail("To'lovni yakunlab bo'lmadi.");
      return;
    }

    setConfirmedOrderId(newOrderId);
    setConfirmedEscrowId(newEscrowId);
    setConfirmedSellerUsername(sellerUsername);

    if (type !== "service") {
      recordConversionEvent("order_created", newOrderId, total);
      recordAnalyticsEvent({ type: "escrow_funded", entityId: newOrderId, value: total });
    }

    addNotification({
      kind: "escrow",
      title: "Eskrou moliyalashtirildi",
      body: `$${escrowSumma.toLocaleString()} eskrouda saqlanmoqda — ${orderTitle}. To'lov: ${paymentMethod.toUpperCase()}.`,
      priority: "high",
      href: `/escrow/${newEscrowId}`,
      userId: user.id,
    });
    addNotification({
      kind: "order",
      title: "Buyurtma tasdiqlandi",
      body: `Buyurtmangiz "${orderTitle}" endi faol.`,
      priority: "high",
      href: `/orders/${newOrderId}`,
      userId: user.id,
    });

    setPaying(false);
    setStep("confirmed");
  };

  if (checkoutError) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <EntityNotFound
          title="To'lovni boshlab bo'lmadi"
          description={checkoutError}
          backTo="/dashboard"
          backLabel="Boshqaruv paneliga qaytish"
        />
        <SiteFooter />
      </div>
    );
  }

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
          <div className="mb-5 grid size-16 place-items-center rounded-2xl border border-success/25 bg-success/10 text-success">
            <CheckCircle2 className="size-8" />
          </div>
          <div className="eyebrow text-success">To'lov tasdiqlandi</div>
          <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight">{presentation.confirmedBannerTitle}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            To'lovingiz ${escrowSumma.toLocaleString()} endi eskrouda saqlanmoqda. Sotuvchiga darhol xabar beriladi.
          </p>
          <div className="mt-5 w-full rounded-2xl border border-success/20 bg-success/5 p-5 text-left">
            <EscrowShield size="md" />
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Mablag'lar faqat bosqich yetkazilishini tasdiqlaganingizdan keyin sotuvchiga chiqariladi. Yetkazish shartlari bajarilmasa to'liq qaytarish.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/orders/$id" params={{ id: confirmedOrderId }} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.2)] transition-default hover:opacity-90 focus-ring">
              Buyurtmani ko'rish <ArrowRight className="size-3.5" />
            </Link>
            <Link to="/escrow/$id" params={{ id: confirmedEscrowId }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
              Eskrouni ko'rish
            </Link>
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
              Boshqaruv paneli
            </Link>
            {confirmedSellerUsername ? (
              <Link
                to="/freelancers/$username"
                params={{ username: confirmedSellerUsername }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-default hover:border-primary/20 focus-ring"
              >
                Sotuvchiga xabar
              </Link>
            ) : (
              <Link to="/messages" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
                Xabarlar
              </Link>
            )}
          </div>
          <ConversionFlowBanner
            title={presentation.confirmedBannerTitle}
            steps={presentation.flowSteps}
            currentStep="order"
            nextHint={presentation.confirmedHint}
            variant="compact"
            className="mt-8 w-full text-left"
          />
        </div>
        <SiteFooter />
      </div>
    );
  }

  const sellerName = service?.seller ?? freelancer?.name ?? existingOrder?.freelancer ?? "";
  const sellerHue = service?.sellerHue ?? freelancer?.hue ?? existingOrder?.freelancerHue ?? 250;
  const orderTitle =
    type === "order" && existingOrder ? existingOrder.title
    : type === "service" ? service?.title
    : project ? `${project.title} uchun yollash`
    : `Yollash ${freelancer?.name}`;

  const statItems =
    service && selectedPaket
      ? [
          { label: "Paket", value: formatPackageTier(selectedPaket.tier) },
          { label: "Yetkazish", value: selectedPaket.delivery },
          { label: "Tuzatishlar", value: String(selectedPaket.revisions) },
        ]
      : type === "order" && existingOrder
        ? [
            { label: "Frilanser", value: existingOrder.freelancer },
            { label: "Summa", value: `$${existingOrder.amount.toLocaleString()}` },
            { label: "Muddat", value: existingOrder.dueDate },
          ]
        : freelancer && type === "hire"
          ? [
              { label: "Stavka", value: `$${freelancer.rate}/soat` },
              { label: project ? "Loyiha byudjeti" : "Taxminiy soatlar", value: project ? `$${project.budget.toLocaleString()}` : "20 soat" },
              { label: "Javob", value: freelancer.responseTime },
            ]
          : [];

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:px-6 lg:pb-8">
        <nav className="font-mono mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <button onClick={() => window.history.back()} className="touch-target flex items-center gap-1 transition-default hover:text-foreground">
            <ChevronLeft className="size-3" /> Orqaga
          </button>
        </nav>

        <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_32px_-16px_oklch(0.546_0.185_257/0.12)]">
          <ConversionFlowBanner
            title={presentation.flowTitle}
            steps={presentation.flowSteps}
            currentStep={presentation.flowStep}
            nextHint={presentation.reviewHint}
            variant="compact"
            className="mb-4"
          />
          <div className="border-t border-border px-3 py-3 sm:px-4">
            <CheckoutStepper step={step} />
          </div>
        </div>

        <header className="mb-6">
          <div className="eyebrow">{step === "payment" ? "Xavfsiz to'lov" : presentation.flowTitle}</div>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {presentation.reviewTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{presentation.reviewHint}</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="space-y-6">
            {step === "review" && (
              <>
                <SellerReviewCard
                  checkoutType={type}
                  orderTitle={orderTitle || "Buyurtma"}
                  sellerName={sellerName || "Frilanser"}
                  sellerHue={sellerHue}
                  service={service}
                  freelancer={freelancer ?? undefined}
                  statItems={statItems}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <TrustGuaranteeCard icon={Lock} label="Eskrou himoyalangan" detail="Tasdiqlanguncha to'lov ushlab turiladi" tone="primary" layout="stacked" />
                  <TrustGuaranteeCard icon={ShieldCheck} label="Shaxs tasdiqlangan" detail="Sotuvchi ma'lumotlari tekshirilgan" tone="success" layout="stacked" />
                  <TrustGuaranteeCard icon={Clock} label="24 soat hal qilish" detail="Nizo yordami kafolatlangan" tone="primary" layout="stacked" />
                </div>
              </>
            )}

            {step === "payment" && (
              <>
                <CheckoutSection title="To'lov usuli">
                  <div className="space-y-2">
                    {[
                      { key: "humo" as const, label: "Humo karta", last4: "4421", icon: CreditCard },
                      { key: "uzcard" as const, label: "Uzcard", last4: "8829", icon: CreditCard },
                      { key: "swift" as const, label: "SWIFT USD o'tkazmasi", last4: null, icon: Building2 },
                    ].map((pm) => {
                      const active = paymentMethod === pm.key;
                      return (
                        <button
                          key={pm.key}
                          onClick={() => setPaymentMethod(pm.key)}
                          className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-default focus-ring ${
                            active
                              ? "border-primary/30 bg-primary/5 shadow-[0_8px_24px_-12px_oklch(0.546_0.185_257/0.15)]"
                              : "border-border bg-surface hover:border-primary/20"
                          }`}
                        >
                          <div className={`grid size-11 shrink-0 place-items-center rounded-xl transition-default ${
                            active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                          }`}>
                            <pm.icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold">
                              {pm.label}{pm.last4 ? ` ···· ${pm.last4}` : ""}
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {active ? "Tanlangan usul" : "Mavjud"}
                            </div>
                          </div>
                          {active && <CheckCircle2 className="size-5 shrink-0 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </CheckoutSection>

                <div className="flex items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-semibold">Bank darajasidagi xavfsizlik</div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      Barcha to'lovlar 256-bit shifrlash bilan Ipoteka-bank orqali amalga oshiriladi. Mablag'lar ajratilgan eskrou hisoblarida saqlanadi.
                    </p>
                  </div>
                </div>
              </>
            )}

            <CheckoutActions
              step={step}
              total={total + platformFee}
              paying={paying}
              onContinue={() => setStep("payment")}
              onPay={handleConfirmPayment}
              onBack={() => (step === "payment" ? setStep("review") : window.history.back())}
            />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <OrderSummary
              type={type}
              total={total}
              platformFee={platformFee}
              escrowSumma={escrowSumma}
            />
            {step === "review" && (
              <button
                type="button"
                onClick={() => setStep("payment")}
                className="touch-target hidden w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.2)] transition-default hover:opacity-90 focus-ring lg:inline-flex"
              >
                To'lovga o'tish <ArrowRight className="size-4" />
              </button>
            )}
            {step === "payment" && (
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={paying}
                className="touch-target hidden w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.2)] transition-default hover:opacity-90 focus-ring disabled:cursor-not-allowed disabled:opacity-50 lg:inline-flex"
              >
                <Lock className="size-4" /> {paying ? "To'lanmoqda…" : `To'lash $${(total + platformFee).toLocaleString()}`}
              </button>
            )}
          </aside>
        </div>
      </div>

      <StickyMobileCta
        label="Jami to'lov"
        amount={`$${(total + platformFee).toLocaleString()}`}
        action={
          step === "review" ? (
            <button type="button" onClick={() => setStep("payment")} className={primaryActionClass}>
              To&apos;lovga o&apos;tish
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={paying}
              className={primaryActionClass}
            >
              {paying ? "…" : "To'lash"}
            </button>
          )
        }
      />

      <SiteFooter />
    </div>
  );
}

function CheckoutStepper({ step, className = "" }: { step: "review" | "payment"; className?: string }) {
  const steps = [
    { key: "review" as const, label: "Ko'rib chiqish" },
    { key: "payment" as const, label: "To'lov" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {steps.map((s, i) => {
        const active = step === s.key;
        const done = i < currentIndex;
        return (
          <div
            key={s.key}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-default ${
              active
                ? "bg-primary text-primary-foreground"
                : done
                  ? "bg-success/10 text-success"
                  : "bg-surface text-muted-foreground"
            }`}
          >
            <span
              className={`inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                active
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : done
                    ? "bg-success text-success-foreground"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function SellerReviewCard({
  checkoutType,
  orderTitle,
  sellerName,
  sellerHue,
  service,
  freelancer,
  statItems,
}: {
  checkoutType: CheckoutKind;
  orderTitle: string;
  sellerName: string;
  sellerHue: number;
  service: Service | null;
  freelancer: Freelancer | undefined;
  statItems: { label: string; value: string }[];
}) {
  const isServiceOrder = checkoutType === "service" && service;
  const cardTitle = isServiceOrder ? orderTitle : sellerName;
  const cardSubtitle = isServiceOrder ? `${sellerName} · xizmat sotuvchisi` : orderTitle;
  const eyebrow = isServiceOrder ? "Xizmat buyurtmasi" : checkoutType === "hire" ? "Mutaxassis yollash" : "Buyurtma";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card transition-default hover:border-primary/20">
      <div className="border-b border-border bg-elevated/40 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <GradientAvatar name={sellerName} hue={sellerHue} size={56} rounded="rounded-2xl" className="shrink-0 ring-2 ring-border/60" />
          <div className="min-w-0 flex-1">
            <div className="eyebrow">{eyebrow}</div>
            <h3 className="font-display break-words text-lg font-bold leading-tight">{cardTitle}</h3>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">{cardSubtitle}</p>
          </div>
        </div>
      </div>
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {service && <LevelBadge level={service.sellerLevel} className="!px-2 !py-0.5 !text-[9px]" />}
          {freelancer && (
            <CompactTrustRow
              level={freelancer.level}
              identityVerified={freelancer.identityVerified}
              businessVerified={freelancer.businessVerified}
              successScore={
                freelancer
                  ? computeSuccessScore(freelancer.username).score
                  : 0
              }
            />
          )}
        </div>
        {statItems.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {statItems.map((item) => (
              <CheckoutStat key={item.label} label={item.label} value={item.value} accent={item.label === "Stavka"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderSummary({
  type,
  total,
  platformFee,
  escrowSumma,
}: {
  type: string;
  total: number;
  platformFee: number;
  escrowSumma: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card transition-default hover:border-primary/20">
      <div className="border-b border-border bg-elevated/40 px-5 py-4">
        <h3 className="font-display text-base font-semibold">Buyurtma xulosasi</h3>
      </div>
      <div className="space-y-3 p-5 text-sm">
        <SummaryRow
          label={
            type === "service"
              ? "Xizmat to'lovi"
              : type === "hire"
                ? "Frilanser depoziti"
                : "Buyurtma summasi"
          }
          value={`$${total.toLocaleString()}`}
        />
        <SummaryRow label="Platforma to'lovi" value={`$${platformFee.toLocaleString()}`} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Eskrou himoyasi</span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
            <CheckCircle2 className="size-3" /> Kiritilgan
          </span>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">Jami</span>
            <span className="font-display text-2xl font-bold">${(total + platformFee).toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-border bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Lock className="size-4 shrink-0" />
          ${escrowSumma.toLocaleString()} eskrouda
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Faqat ish tasdiqlanganda chiqariladi. Shartlar bajarilmasa to'liq qaytarish.
        </p>
      </div>
    </div>
  );
}

function CheckoutActions({
  step,
  total,
  paying = false,
  onContinue,
  onPay,
  onBack,
}: {
  step: "review" | "payment";
  total: number;
  paying?: boolean;
  onContinue: () => void;
  onPay: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center lg:border-0 lg:pt-0">
      {step === "review" ? (
        <button
          type="button"
          onClick={onContinue}
          className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.2)] transition-default hover:opacity-90 focus-ring sm:w-auto lg:hidden"
        >
          To'lovga o'tish <ArrowRight className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onPay}
          disabled={paying}
          className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.2)] transition-default hover:opacity-90 focus-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto lg:hidden"
        >
          <Lock className="size-4" /> {paying ? "To'lanmoqda…" : `To'lash $${total.toLocaleString()}`}
        </button>
      )}
      <button
        type="button"
        onClick={onBack}
        className="touch-target w-full rounded-lg border border-border px-5 py-3 text-sm font-medium transition-default hover:border-primary/20 focus-ring sm:w-auto"
      >
        {step === "payment" ? "Orqaga" : "Bekor qilish"}
      </button>
    </div>
  );
}

function CheckoutSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card transition-default hover:border-primary/20">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h3 className="font-display text-base font-semibold">{title}</h3>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function CheckoutStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 transition-default hover:border-primary/20 ${
        accent ? "border-primary/20 bg-primary/5" : "border-border bg-surface"
      }`}
    >
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

