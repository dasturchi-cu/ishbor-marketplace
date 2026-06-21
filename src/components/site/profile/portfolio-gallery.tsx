import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Freelancer } from "@/lib/mock-data";

type PortfolioItem = Freelancer["portfolio"][number];

export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((p, i) => (
          <button
            key={`${p.title}-${i}`}
            type="button"
            onClick={() => setActive(i)}
            className="group relative overflow-hidden rounded-xl border border-border text-left transition-default hover:-translate-y-0.5 hover:border-primary/20 focus-ring"
          >
            <div
              className="grain aspect-[4/5] w-full"
              style={{
                background: `linear-gradient(${130 + i * 20}deg, oklch(0.72 0.15 ${p.hue}) 0%, oklch(0.32 0.14 ${(p.hue + 40) % 360}) 100%)`,
              }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3">
              <div className="text-xs font-semibold text-white">{p.title}</div>
              <div className="font-mono text-[10px] text-white/60">
                {p.category} · {p.year}
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-default group-hover:bg-black/20 group-hover:opacity-100">
              <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground">
                View
              </span>
            </div>
          </button>
        ))}
      </div>

      {active !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
            onClick={() => setActive(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActive(null)}
                className="absolute right-4 top-4 z-10 inline-flex size-9 items-center justify-center rounded-lg bg-black/50 text-white transition-default hover:bg-black/70 focus-ring"
                aria-label="Galereyani yopish"
              >
                <X className="size-4" />
              </button>
              <div
                className="grain aspect-[16/10] w-full max-h-[calc(100dvh-8rem)]"
                style={{
                  background: `linear-gradient(135deg, oklch(0.72 0.15 ${items[active]!.hue}) 0%, oklch(0.32 0.14 ${(items[active]!.hue + 40) % 360}) 100%)`,
                }}
              />
              <div className="flex items-center justify-between p-5">
                <div>
                  <h3 className="font-display text-lg font-bold">{items[active]!.title}</h3>
                  <div className="font-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {items[active]!.category} · {items[active]!.year}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActive((active - 1 + items.length) % items.length)}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-border transition-default hover:border-primary/20 focus-ring"
                    aria-label="Oldingi"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="font-mono text-xs text-muted-foreground">
                    {active + 1} / {items.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActive((active + 1) % items.length)}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-border transition-default hover:border-primary/20 focus-ring"
                    aria-label="Keyingi"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
