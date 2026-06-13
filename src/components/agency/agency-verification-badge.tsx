import { agencyVerificationLabels } from "@/lib/agency-types";
import type { AgencyVerificationLevel } from "@/lib/agency-types";
import { Shield, Crown, Building2 } from "lucide-react";

const config: Record<
  AgencyVerificationLevel,
  { icon: typeof Shield; className: string } | null
> = {
  none: null,
  verified: { icon: Shield, className: "border-success/30 bg-success/10 text-success" },
  premium: { icon: Crown, className: "border-primary/30 bg-primary/10 text-primary" },
  enterprise: { icon: Building2, className: "border-amber-500/30 bg-amber-500/10 text-amber-700" },
};

export function AgencyVerificationBadge({ level }: { level: AgencyVerificationLevel }) {
  const cfg = config[level];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cfg.className}`}>
      <Icon className="size-3" />
      {agencyVerificationLabels[level]}
    </span>
  );
}
