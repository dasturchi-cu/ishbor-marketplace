import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, ShieldCheck, CircleCheck as CheckCircle2, ArrowRight, ChevronLeft, CreditCard, Building2, Clock, Star } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { GradientAvatar } from "@/components/site/avatar";
import { EscrowShield, LevelBadge, VerifiedIdentityBadge, CompactTrustRow } from "@/components/site/trust";
import { freelancers, services } from "@/lib/mock-data";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Ishbor" }] }),
  component: CheckoutPage,
});

type CheckoutType = "service" | "hire";

function CheckoutPage() {
  const search = Route.useSearch() as { type?: CheckoutType; service?: string; freelancer?: string; package?: string };
  const type = search.type ?? "service";

  const service = type === "service" && search.service
    ? services.find((s) => s.slug === search.service) ?? services[0]
    : null;
  const freelancer = search.freelancer
    ? freelancers.find((f) => f.username === search.freelancer)
    : null;

  const [step, setStep] = useState<"review" | "payment" | "confirmed">("review");
  const [paymentMethod, setPaymentMethod] = useState<"humo" | "uzcard" | "swift">("humo");

  const total = type === "hire" && freelancer ? freelancer.rate * 20 : service?.price ?? 0;
  const platformFee = Math.round(total * 0.05);
  const escrowAmount = total;

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
          <div className="mb-5 inline-flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-8" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Order confirmed</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your payment of ${escrowAmount.toLocaleString()} is now held in escrow. The seller will be notified immediately.
          </p>
          <div className="mt-5 rounded-xl border border-success/20 bg-success/5 px-5 py-3 text-sm">
            <div className="flex items-center gap-2 text-success">
              <EscrowShield size="md" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Funds will be released to the seller only after you approve the milestone delivery. Full refund if delivery terms are not met.
            </p>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring">
              Go to dashboard <ArrowRight className="size-3.5" />
            </Link>
            <Link to="/messages" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
              Message seller
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <nav className="font-mono mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <button onClick={() => window.history.back()} className="flex items-center gap-1 transition-default hover:text-foreground">
            <ChevronLeft className="size-3" /> Back
          </button>
        </nav>

        {/* Progress */}
        <div className="mb-8 flex items-center gap-3">
          {["review", "payment"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                step === s ? "bg-primary text-primary-foreground" : i < ["review", "payment"].indexOf(step) ? "bg-success text-success-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              <span className={`text-sm font-medium ${step === s ? "text-foreground" : "text-muted-foreground"}`}>
                {s === "review" ? "Review order" : "Payment"}
              </span>
              {i === 0 && <div className="h-px w-8 bg-border" />}
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            {step === "review" && (
              <>
                <h1 className="font-display text-2xl font-bold tracking-tight">Review your order</h1>
                <p className="mt-1 text-sm text-muted-foreground">Confirm the details before proceeding to payment.</p>

                {/* Order summary */}
                <div className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
                  <div
                    className="h-24"
                    style={{
                      background: `linear-gradient(135deg, oklch(0.62 0.14 ${service?.hue ?? freelancer?.hue ?? 250}) 0%, oklch(0.36 0.10 ${(service?.hue ?? freelancer?.hue ?? 250) + 30}) 100%)`,
                    }}
                  />
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <GradientAvatar name={service?.seller ?? freelancer?.name ?? ""} hue={service?.sellerHue ?? freelancer?.hue ?? 250} size={40} rounded="rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-sm font-bold">{type === "service" ? service?.title : `Hire ${freelancer?.name}`}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{service?.seller ?? freelancer?.name}</span>
                          {service && <LevelBadge level={service.sellerLevel} className="!px-1.5 !py-0 !text-[8px]" />}
                          {freelancer && <CompactTrustRow level={freelancer.level} identityVerified={freelancer.identityVerified} businessVerified={freelancer.businessVerified} successScore={freelancer.successScore} className="!gap-1" />}
                        </div>
                      </div>
                    </div>
                    {service && (
                      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Package</div>
                          <div className="font-semibold">Premium</div>
                        </div>
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Delivery</div>
                          <div className="font-semibold">{service.delivery}</div>
                        </div>
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Revisions</div>
                          <div className="font-semibold">4</div>
                        </div>
                      </div>
                    )}
                    {freelancer && (
                      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Rate</div>
                          <div className="font-semibold">${freelancer.rate}/h</div>
                        </div>
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Est. hours</div>
                          <div className="font-semibold">20h</div>
                        </div>
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Response</div>
                          <div className="font-semibold">{freelancer.responseTime}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trust guarantees */}
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                    <EscrowShield size="sm" />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-success/15 bg-success/5 px-4 py-3">
                    <VerifiedIdentityBadge />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-primary/8 px-4 py-3 text-xs text-primary">
                    <Clock className="size-4" /> 24h dispute resolution
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-3">
                  <button
                    onClick={() => setStep("payment")}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring"
                  >
                    Continue to payment <ArrowRight className="size-4" />
                  </button>
                  <button onClick={() => window.history.back()} className="rounded-lg border border-border px-5 py-3 text-sm font-medium transition-default hover:border-primary/20 focus-ring">
                    Cancel
                  </button>
                </div>
              </>
            )}

            {step === "payment" && (
              <>
                <h1 className="font-display text-2xl font-bold tracking-tight">Secure payment</h1>
                <p className="mt-1 text-sm text-muted-foreground">Your payment will be held in escrow until milestone approval.</p>

                {/* Payment method */}
                <div className="mt-6 space-y-2">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Payment method</h3>
                  {[
                    { key: "humo" as const, label: "Humo card", last4: "4421", icon: CreditCard },
                    { key: "uzcard" as const, label: "Uzcard", last4: "8829", icon: CreditCard },
                    { key: "swift" as const, label: "SWIFT USD transfer", last4: null, icon: Building2 },
                  ].map((pm) => (
                    <button
                      key={pm.key}
                      onClick={() => setPaymentMethod(pm.key)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-4 transition-default focus-ring ${
                        paymentMethod === pm.key
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-card hover:border-primary/20"
                      }`}
                    >
                      <div className={`inline-flex size-10 items-center justify-center rounded-lg ${
                        paymentMethod === pm.key ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                      }`}>
                        <pm.icon className="size-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold">{pm.label}{pm.last4 ? ` ···· ${pm.last4}` : ""}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {paymentMethod === pm.key ? "Selected" : "Available"}
                        </div>
                      </div>
                      {paymentMethod === pm.key && <CheckCircle2 className="size-5 text-primary" />}
                    </button>
                  ))}
                </div>

                {/* Security notice */}
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <div className="text-sm font-semibold">Bank-grade security</div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      All payments are processed through Ipoteka-bank with 256-bit encryption. Funds are held in segregated escrow accounts and released only upon your approval.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-3">
                  <button
                    onClick={() => setStep("confirmed")}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring"
                  >
                    <Lock className="size-4" /> Pay ${escrowAmount.toLocaleString()}
                  </button>
                  <button
                    onClick={() => setStep("review")}
                    className="rounded-lg border border-border px-5 py-3 text-sm font-medium transition-default hover:border-primary/20 focus-ring"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Order summary sidebar */}
          <aside className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
            <h3 className="font-display mb-4 text-sm font-bold">Order summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{type === "service" ? "Service fee" : "Freelancer deposit"}</span>
                <span className="font-semibold">${total.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Platform fee</span>
                <span className="font-semibold">${platformFee.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Escrow protection</span>
                <span className="text-xs text-success">Included</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-display text-xl font-bold">${(total + platformFee).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs text-primary">
                <Lock className="size-3.5" />
                <span className="font-semibold">${escrowAmount.toLocaleString()} held in escrow</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">
                Released only when you approve the delivered work. Full refund if terms aren't met.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
