import { cn } from "@/lib/utils";
import { useEffectiveDark } from "@/lib/use-effective-theme";
import type { AppearancePrefs } from "@/lib/settings-store";

export function AppearancePreview({ appearance }: { appearance: AppearancePrefs }) {
  const isDark = useEffectiveDark(appearance.theme);
  const fontPx = appearance.fontSize === "sm" ? 14 : appearance.fontSize === "lg" ? 18 : 16;
  const compact = appearance.compactMode;
  const animate = appearance.animations;

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Ko&apos;rinish namunasi</div>
      <div
        className={cn("overflow-hidden rounded-xl border border-border shadow-sm", isDark && "dark")}
        style={{ fontSize: `${fontPx}px` }}
        aria-hidden
      >
        <div
          className={cn(
            "flex items-center justify-between border-b border-border bg-background",
            compact ? "px-2.5 py-2" : "px-3 py-2.5",
          )}
        >
          <span className="font-display text-[0.8em] font-bold tracking-tight text-primary">Ishbor</span>
          <div className={cn("flex items-center", compact ? "gap-1" : "gap-1.5")}>
            <span className="size-[0.45em] rounded-full bg-muted" />
            <span className="size-[0.45em] rounded-full bg-muted" />
            <span
              className={cn(
                "size-[0.45em] rounded-full bg-primary",
                animate && "motion-safe:animate-pulse",
              )}
            />
          </div>
        </div>

        <div className={cn("space-y-2 bg-background", compact ? "p-2.5" : "p-3")}>
          <div className={cn("rounded-lg border border-border bg-card", compact ? "p-2" : "p-2.5")}>
            <div className="font-mono text-[0.65em] uppercase tracking-wider text-muted-foreground">Buyurtma</div>
            <div className="mt-0.5 font-semibold leading-snug text-foreground">Veb-sayt dizayni</div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-[0.8em] text-muted-foreground">2.4M UZS</span>
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[0.7em] font-medium text-primary">
                Faol
              </span>
            </div>
          </div>

          <div className={cn("grid grid-cols-2", compact ? "gap-1.5" : "gap-2")}>
            {[
              { value: "12", label: "Ariza" },
              { value: "4.9", label: "Reyting" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-lg border border-border bg-secondary/30 text-center",
                  compact ? "py-1.5" : "py-2",
                )}
              >
                <div className="font-semibold text-foreground">{stat.value}</div>
                <div className="text-[0.7em] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div
            className={cn(
              "rounded-lg bg-primary text-center font-medium text-primary-foreground",
              compact ? "py-1.5 text-[0.8em]" : "py-2 text-[0.85em]",
              animate && "motion-safe:transition-opacity motion-safe:hover:opacity-90",
            )}
          >
            Ko&apos;rish
          </div>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Mavzu, shrift, ixcham rejim va animatsiya o&apos;zgarishlari shu yerda darhol ko&apos;rinadi.
      </p>
    </div>
  );
}
