import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import { getPlan, getProposalUsage } from "@/lib/subscription-store";
import { useAuth } from "@/hooks/use-auth";

type UpsellBannerProps = {
  context?: "dashboard" | "analytics" | "promotions";
};

export function UpsellBanner({ context = "dashboard" }: UpsellBannerProps) {
  const { user } = useAuth();
  if (!user) return null;

  const plan = getPlan(user.id);
  if (plan.id !== "free") return null;

  const { used, limit } = getProposalUsage(user.id);
  const proposalsLeft = limit !== null ? Math.max(0, limit - used) : null;

  const messages: Record<typeof context, string> = {
    dashboard: "Pro rejasi bilan cheksiz takliflar, 20 ta xizmat va kengaytirilgan analitika.",
    analytics: "Kengaytirilgan analitika faqat Pro va Elite rejasida mavjud.",
    promotions: "Elite rejasi bilan featured chegirmalar va ustuvor reyting.",
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Pro ga o'ting</div>
            <p className="mt-1 text-sm font-medium">{messages[context]}</p>
            {proposalsLeft !== null && (
              <p className="mt-1 text-xs text-muted-foreground">
                Bu oy {proposalsLeft} ta taklif qoldi ({used}/{limit})
              </p>
            )}
          </div>
        </div>
        <Link
          to="/pricing"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Rejalarni ko'rish <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

export function EliteBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
      Elite
    </span>
  );
}

export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
      Pro
    </span>
  );
}
