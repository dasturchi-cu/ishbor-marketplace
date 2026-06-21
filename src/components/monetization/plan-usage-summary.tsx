import { useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  getPlan,
  getProposalUsage,
  subscribeSubscriptions,
  type PlanId,
} from "@/lib/subscription-store";
import { getMyPublishedServices, subscribeServices } from "@/lib/services-store";
import { cn } from "@/lib/utils";

type PlanUsageSummaryProps = {
  userId: string;
  planId?: PlanId;
  className?: string;
  variant?: "panel" | "inline";
  showUpgradeHint?: boolean;
};

type StatProps = {
  title: string;
  used: number;
  limit: number | null;
  usedLabel: string;
};

function UsageStat({ title, used, limit, usedLabel }: StatProps) {
  const unlimited = limit === null;
  const remaining = unlimited ? null : Math.max(0, limit - used);
  const atLimit = !unlimited && remaining === 0;
  const pct = unlimited || limit === 0 ? 0 : Math.min(100, (used / limit) * 100);

  return (
    <div className="min-w-0 flex-1">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 flex items-baseline gap-2">
        {unlimited ? (
          <span className="font-display text-2xl font-bold tracking-tight">Cheksiz</span>
        ) : (
          <>
            <span className={cn("font-display text-2xl font-bold tracking-tight", atLimit && "text-destructive")}>
              {remaining}
            </span>
            <span className="text-sm text-muted-foreground">ta qoldi</span>
          </>
        )}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {unlimited
          ? `Bu oy ${used} ta ${usedLabel}`
          : `${used} / ${limit} ishlatilgan`}
      </div>
      {!unlimited && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className={cn("h-full rounded-full transition-all", atLimit ? "bg-destructive" : "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function PlanUsageSummary({
  userId,
  planId,
  className,
  variant = "panel",
  showUpgradeHint = true,
}: PlanUsageSummaryProps) {
  useSyncExternalStore(subscribeSubscriptions, () => getProposalUsage(userId).used, () => 0);
  useSyncExternalStore(
    subscribeServices,
    () => getMyPublishedServices(userId).length,
    () => 0,
  );

  const plan = getPlan(userId);
  const activePlanId = planId ?? plan.id;
  const proposals = getProposalUsage(userId);
  const servicesUsed = getMyPublishedServices(userId).length;
  const servicesLimit = plan.maxServices;

  const proposalAtLimit = proposals.limit !== null && proposals.used >= proposals.limit;
  const serviceAtLimit = servicesLimit !== null && servicesUsed >= servicesLimit;
  const showHint = showUpgradeHint && activePlanId === "free" && (proposalAtLimit || serviceAtLimit);

  const stats = (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
      <UsageStat title="Takliflar (oylik)" used={proposals.used} limit={proposals.limit} usedLabel="yuborildi" />
      <div className="hidden w-px shrink-0 bg-border sm:block" aria-hidden />
      <UsageStat title="Xizmatlar (nashr)" used={servicesUsed} limit={servicesLimit} usedLabel="faol" />
    </div>
  );

  if (variant === "inline") {
    return <div className={cn("border-t border-border pt-4", className)}>{stats}</div>;
  }

  return (
    <section className={cn("rounded-xl border border-border bg-card p-4 sm:p-5", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Limitlar — {plan.name}</h2>
          <p className="text-xs text-muted-foreground">Takliflar har oy yangilanadi</p>
        </div>
        <Link
          to="/subscription"
          search={{ plan: undefined }}
          className="text-xs font-medium text-primary hover:underline"
        >
          Obunani boshqarish
        </Link>
      </div>

      {stats}

      {showHint && (
        <Link
          to="/subscription"
          search={{ plan: "pro" }}
          className="mt-4 flex items-center justify-between gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-default hover:bg-primary/15"
        >
          Limit tugadi — Pro rejaga o&apos;ting
          <ArrowRight className="size-4 shrink-0" />
        </Link>
      )}
    </section>
  );
}

/** Joriy reja kartasi ichida — faqat 2 qatorli qisqa ko'rinish */
export function PlanUsageInline({ userId }: { userId: string }) {
  useSyncExternalStore(subscribeSubscriptions, () => getProposalUsage(userId).used, () => 0);
  useSyncExternalStore(
    subscribeServices,
    () => getMyPublishedServices(userId).length,
    () => 0,
  );

  const proposals = getProposalUsage(userId);
  const services = getMyPublishedServices(userId).length;
  const plan = getPlan(userId);

  const proposalText =
    proposals.limit === null
      ? `${proposals.used} ta taklif yuborildi`
      : `${Math.max(0, proposals.limit - proposals.used)} ta taklif qoldi (${proposals.used}/${proposals.limit})`;

  const serviceText =
    plan.maxServices === null
      ? `${services} ta xizmat faol`
      : `${Math.max(0, plan.maxServices - services)} ta joy qoldi (${services}/${plan.maxServices})`;

  return (
    <div className="mt-4 space-y-1.5 rounded-lg bg-secondary/40 px-3 py-2.5 text-xs">
      <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">Takliflar</span>
        <span className="font-medium tabular-nums">{proposalText}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">Xizmatlar</span>
        <span className="font-medium tabular-nums">{serviceText}</span>
      </div>
    </div>
  );
}
