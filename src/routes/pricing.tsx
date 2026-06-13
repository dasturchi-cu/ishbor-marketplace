import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { PLANS, type PlanId } from "@/lib/subscription-store";

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

function PricingPage() {
  const paidPlans: PlanId[] = ["free", "pro", "elite"];

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Monetizatsiya</div>
          <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Rejalar va narxlar</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Ishbor frilanserlari uchun mos rejani tanlang. Barcha to'lovlar demo rejimida — haqiqiy to'lov yo'q.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paidPlans.map((id) => {
            const plan = PLANS[id];
            const highlighted = id === "pro";
            return (
              <div
                key={id}
                className={`relative flex flex-col rounded-2xl border p-5 sm:p-6 ${
                  highlighted ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-card"
                }`}
              >
                {highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Mashhur
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
                <Link
                  to="/subscription"
                  search={{ plan: id === "free" ? undefined : id }}
                  className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-default ${
                    highlighted
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border border-border hover:border-primary/30"
                  }`}
                >
                  {id === "free" ? "Joriy reja" : `${plan.name} tanlash`}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-xl border border-border bg-card p-5 sm:p-6">
          <h3 className="font-display font-semibold">Kredit tizimi</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajratilgan ro'yxatlar, profil boost va portfolio ajratib ko'rsatish uchun kreditlar ishlatiladi.
            Referral orqali kredit yig'ing yoki to'g'ridan-to'g'ri sotib oling.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/promotions" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary/30">
              Promotsiya markazi
            </Link>
            <Link to="/subscription" search={{ plan: undefined }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Obunani boshqarish
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-semibold">Agentlik rejasi</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Jamoa, CRM va agentlik portfolioni boshqaring. Agentlik yarating yoki mavjud agentlikka qo'shiling.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/agencies" className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:border-primary/30">
                Agentliklar bozori
              </Link>
              <Link to="/agencies/create" className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Agentlik yaratish
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <h3 className="font-display font-semibold">AI yordamchi</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Loyiha generatori, taklif yordamchisi, portfolio optimizatsiyasi va ishonch murabbiyi — barcha rejalar uchun.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/ai" className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                AI markaz
              </Link>
              <Link to="/ai/onboarding" className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:border-primary/30">
                Boshlash
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
