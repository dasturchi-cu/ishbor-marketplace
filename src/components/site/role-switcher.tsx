import { Briefcase, Building2, CheckCircle2, LayoutDashboard } from "lucide-react";
import type { UserType } from "@/lib/auth-constants";
import { useActiveRole } from "@/hooks/use-active-role";

const options: {
  key: UserType;
  label: string;
  description: string;
  icon: typeof Briefcase;
}[] = [
  {
    key: "freelancer",
    label: "Frilanser",
    description: "Portfolio, ko'nikmalar, xizmatlar va daromad",
    icon: Briefcase,
  },
  {
    key: "client",
    label: "Mijoz",
    description: "Loyihalar, buyurtmalar, eskrou va xarajatlar",
    icon: Building2,
  },
];

export function RoleSwitcher({
  variant = "card",
  className = "",
}: {
  variant?: "card" | "compact";
  className?: string;
}) {
  const { activeRole, switchRole } = useActiveRole();

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-1 rounded-xl border border-border bg-surface p-1 ${className}`}
        role="group"
        aria-label="Rol tanlash"
      >
        {options.map((opt) => {
          const active = activeRole === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => switchRole(opt.key)}
              className={`touch-target inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-default focus-ring ${
                active
                  ? "bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.2)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              aria-pressed={active}
            >
              <opt.icon className="size-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-border bg-card transition-default hover:border-primary/20 ${className}`}
      aria-label="Rol tanlash"
    >
      <div className="border-b border-border bg-elevated/40 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="eyebrow">Ish rejimi</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Frilanser yoki mijoz sifatida profil, panel va navigatsiyani ko'ring
            </p>
          </div>
          <div className="hidden items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 sm:flex">
            <LayoutDashboard className="size-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Faol: <span className="font-semibold text-foreground">{activeRole === "freelancer" ? "Frilanser" : "Mijoz"}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5" role="group">
        {options.map((opt) => {
          const active = activeRole === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => switchRole(opt.key)}
              aria-pressed={active}
              className={`group relative flex items-start gap-3 rounded-xl border p-4 text-left transition-default focus-ring sm:p-5 ${
                active
                  ? "border-primary/30 bg-primary/5 shadow-[0_12px_40px_-16px_oklch(0.546_0.185_257/0.18)]"
                  : "border-border bg-surface hover:border-primary/20 hover:bg-secondary/30"
              }`}
            >
              <div
                className={`grid size-11 shrink-0 place-items-center rounded-xl transition-default ${
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.25)]"
                    : "bg-primary/10 text-primary group-hover:bg-primary/15"
                }`}
              >
                <opt.icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold">{opt.label}</span>
                  {active && <CheckCircle2 className="size-4 shrink-0 text-primary" />}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{opt.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
