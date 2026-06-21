import { useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
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

function formatLimit(used: number, limit: number | null, unit: string) {
  if (limit === null) return `Cheksiz · ${used} ${unit}`;
  const remaining = Math.max(0, limit - used);
  return `${remaining} qoldi · ${used}/${limit}`;
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

  const rows = (
    <ul className="space-y-2 text-sm">
      <li className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Takliflar (oy)</span>
        <span className={cn("font-medium tabular-nums", proposalAtLimit && "text-destructive")}>
          {formatLimit(proposals.used, proposals.limit, "yuborildi")}
        </span>
      </li>
      <li className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Xizmatlar (nashr)</span>
        <span className={cn("font-medium tabular-nums", serviceAtLimit && "text-destructive")}>
          {formatLimit(servicesUsed, servicesLimit, "faol")}
        </span>
      </li>
    </ul>
  );

  if (variant === "inline") {
    return <div className={cn("border-t border-border pt-4", className)}>{rows}</div>;
  }

  return (
    <section className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Limitlar — {plan.name}</h2>
        <Link
          to="/subscription"
          search={{ plan: undefined }}
          className="text-xs font-medium text-primary hover:underline"
        >
          Obuna →
        </Link>
      </div>

      {rows}

      {showHint && (
        <Link
          to="/subscription"
          search={{ plan: "pro" }}
          className="mt-3 block text-xs font-medium text-primary hover:underline"
        >
          Limit tugadi — Pro rejaga o&apos;ting
        </Link>
      )}
    </section>
  );
}
