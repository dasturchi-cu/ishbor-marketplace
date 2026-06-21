import { createFileRoute, Link } from "@tanstack/react-router";

import { useSyncExternalStore, useEffect } from "react";

import { toast } from "sonner";

import { CreditCard, RefreshCw, XCircle, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

import { WorkspaceShell } from "@/components/site/workspace-shell";

import { requireAuth } from "@/lib/guards";

import { ProtectedGate } from "@/components/auth/protected-gate";

import { useAuth } from "@/hooks/use-auth";

import {

  PLANS,

  getSubscription,

  getPlan,

  subscribeSubscriptions,

  upgradePlan,

  downgradePlan,

  cancelSubscription,

  renewSubscription,

  type PlanId,

} from "@/lib/subscription-store";

import { getCreditBalance, getCreditTransactions, subscribeCredits } from "@/lib/credits-store";

import { ProBadge, EliteBadge } from "@/components/monetization/upsell-banner";
import { PlanUsageSummary } from "@/components/monetization/plan-usage-summary";



export const Route = createFileRoute("/subscription")({

  beforeLoad: requireAuth,

  validateSearch: (s: Record<string, unknown>) => ({

    plan: typeof s.plan === "string" ? (s.plan as PlanId) : undefined,

  }),

  head: () => ({ meta: [{ title: "Obuna — Ishbor" }] }),

  component: () => (
    <ProtectedGate>
      <SubscriptionPage />
    </ProtectedGate>
  ),

});



const GUEST_SUBSCRIPTION = getSubscription("guest");



function SubscriptionPage() {

  const { user } = useAuth();

  const { plan: planParam } = Route.useSearch();

  const userId = user?.id;



  useSyncExternalStore(

    subscribeSubscriptions,

    () => (userId ? getSubscription(userId) : GUEST_SUBSCRIPTION),

    () => GUEST_SUBSCRIPTION,

  );

  useSyncExternalStore(

    subscribeCredits,

    () => (userId ? getCreditBalance(userId) : 0),

    () => 0,

  );



  useEffect(() => {

    if (!userId || !planParam || planParam === "free") return;

    const sub = getSubscription(userId);

    if (planParam === sub.plan) return;

    const result = upgradePlan(planParam, userId);

    if (result.ok) toast.success(`${PLANS[planParam].name} rejasi faollashdi`);

    else toast.error(result.error);

  }, [planParam, userId]);



  if (!user) return null;



  const sub = getSubscription(user.id);
  const plan = getPlan(user.id);
  const balance = getCreditBalance(user.id);

  const txs = getCreditTransactions(user.id, 10);



  const handleUpgrade = (target: PlanId) => {

    const result = upgradePlan(target, user.id);

    if (result.ok) toast.success(`${PLANS[target].name} rejasi faollashdi`);

    else toast.error(result.error);

  };



  const handleDowngrade = (target: PlanId) => {

    const result = downgradePlan(target, user.id);

    if (result.ok) toast.success(`${PLANS[target].name} rejasi faollashdi`);

    else toast.error(result.error);

  };



  const handleCancel = () => {

    cancelSubscription(user.id);

    toast.success("Obuna bekor qilindi");

  };



  const handleRenew = () => {

    renewSubscription(user.id);

    toast.success("Obuna yangilandi");

  };



  return (

    <WorkspaceShell

      eyebrow="Monetizatsiya"

      title="Obuna boshqaruvi"

      actions={

        <Link to="/pricing" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/20">

          Rejalarni solishtirish

        </Link>

      }

    >

      <div className="grid gap-4 lg:grid-cols-2">

        <div className="rounded-xl border border-border bg-card p-5">

          <div className="flex items-center gap-2">

            <CreditCard className="size-5 text-primary" />

            <h2 className="font-display font-semibold">Joriy reja</h2>

            {plan.id === "elite" && <EliteBadge />}

            {plan.id === "pro" && <ProBadge />}

          </div>

          <div className="mt-4">

            <div className="font-display text-2xl font-bold">{plan.name}</div>

            <div className="mt-1 text-sm text-muted-foreground">

              {plan.priceMonthly === 0

                ? "Bepul reja"

                : `${plan.priceMonthly.toLocaleString()} UZS / oy`}

            </div>

            <div className="mt-3 text-xs text-muted-foreground">

              Holat: {sub.status === "active" ? "Faol" : sub.status === "cancelled" ? "Bekor qilingan" : "Muddati o'tgan"}

              {sub.renewsAt && sub.plan !== "free" && (

                <> · Yangilanish: {new Date(sub.renewsAt).toLocaleDateString("uz-UZ")}</>

              )}

            </div>

          </div>

          <div className="mt-5 border-t border-border pt-5">
            <p className="mb-3 text-xs font-semibold text-muted-foreground">Oylik limitlar</p>
            <PlanUsageSummary userId={user.id} variant="inline" className="border-0 pt-0" showUpgradeHint={plan.id === "free"} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">

            {sub.plan !== "pro" && sub.plan !== "elite" && (

              <button type="button" onClick={() => handleUpgrade("pro")} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">

                <ArrowUpCircle className="size-3.5" /> Pro ga o'tish

              </button>

            )}

            {sub.plan !== "elite" && (

              <button type="button" onClick={() => handleUpgrade("elite")} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700">

                <ArrowUpCircle className="size-3.5" /> Elite ga o'tish

              </button>

            )}

            {sub.plan !== "free" && (

              <>

                <button type="button" onClick={() => handleDowngrade("free")} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium">

                  <ArrowDownCircle className="size-3.5" /> Bepulga tushirish

                </button>

                <button type="button" onClick={handleRenew} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium">

                  <RefreshCw className="size-3.5" /> Yangilash

                </button>

                {sub.status === "active" && (

                  <button type="button" onClick={handleCancel} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive">

                    <XCircle className="size-3.5" /> Bekor qilish

                  </button>

                )}

              </>

            )}

          </div>

        </div>



        <div className="rounded-xl border border-border bg-card p-5">

          <h2 className="font-display font-semibold">Kredit hamyoni</h2>

          <div className="mt-3 font-display text-2xl font-bold">{balance.toLocaleString()} UZS</div>

          <p className="mt-1 text-xs text-muted-foreground">Ajratilgan ro'yxat va boost uchun ishlatiladi</p>

          <Link to="/promotions" search={{ plan: undefined }} className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">

            Promotsiya markazi

          </Link>



          {txs.length > 0 && (

            <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-xs">

              {txs.map((t) => (

                <li key={t.id} className="flex justify-between border-b border-border pb-2">

                  <span className="text-muted-foreground">{t.reason}</span>

                  <span className={`font-mono font-medium ${t.type === "spend" ? "text-destructive" : "text-success"}`}>

                    {t.type === "spend" ? "-" : "+"}{t.amount.toLocaleString()}

                  </span>

                </li>

              ))}

            </ul>

          )}

        </div>

      </div>

    </WorkspaceShell>

  );

}


