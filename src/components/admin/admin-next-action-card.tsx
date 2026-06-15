import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { resolveAdminNextAction } from "@/lib/next-action-resolver";

export function AdminNextActionCard() {
  const action = resolveAdminNextAction();

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
          Keyingi nima qilish kerak?
        </div>
        <div className="mt-1 font-semibold">{action.title}</div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{action.description}</p>
      </div>
      <Link
        to={action.href}
        className="touch-target inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        {action.cta} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
