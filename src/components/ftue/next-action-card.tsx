import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { resolvePrimaryNextAction } from "@/lib/journey-guidance";
import { useActiveRole } from "@/hooks/use-active-role";
import { recordConversionEvent } from "@/lib/conversion-store";
import { cn } from "@/lib/utils";

/** Primary next-action card — urgent work beats onboarding steps. */
export function NextActionCard({ user }: { user: AuthUser }) {
  const { activeRole } = useActiveRole();
  const action = resolvePrimaryNextAction(user, activeRole);

  if (!action) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        action.urgent ? "border-primary/30 bg-primary/5" : "border-border bg-card",
      )}
    >
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
          Keyingi nima qilish kerak?
        </div>
        <div className="mt-1 font-semibold">{action.title}</div>
        {action.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{action.description}</p>
        )}
      </div>
      <Link
        to={action.href}
        onClick={() => recordConversionEvent("checkout_start", `next_action_${activeRole}`)}
        className="touch-target inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        {action.cta ?? "Boshlash"} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
