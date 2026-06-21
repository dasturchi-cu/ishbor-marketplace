import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import type { ServiceGalleryImage } from "@/lib/mock-data";

export function ServiceGallery({ images, hue }: { images: ServiceGalleryImage[]; hue: number }) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const current = images[active]!;

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  return (
    <div className="space-y-3">
      <div className="group relative overflow-hidden rounded-2xl border border-border shadow-[0_16px_48px_-24px_oklch(0.546_0.185_257/0.18)]">
        <div
          className="grain aspect-[16/10] w-full transition-default duration-500 sm:aspect-[16/9]"
          style={{
            background: `linear-gradient(145deg, oklch(0.68 0.16 ${current.hue}) 0%, oklch(0.52 0.15 ${hue}) 42%, oklch(0.28 0.1 ${current.hue + 35}) 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_25%_15%,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_70%_at_100%_100%,rgba(0,0,0,0.15),transparent_55%)]" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent p-5 sm:p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/65">Hero deliverable preview</div>
          <div className="mt-1 text-base font-semibold text-white sm:text-lg">{current.caption}</div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-xl border border-white/20 bg-black/55 text-white opacity-0 transition-default group-hover:opacity-100 focus-ring"
          aria-label="Galereyani kengaytirish"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2.5">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`group/thumb overflow-hidden rounded-xl border transition-default focus-ring ${
              active === i
                ? "border-primary ring-2 ring-primary/25 shadow-[0_4px_16px_-6px_oklch(0.546_0.185_257/0.35)]"
                : "border-border hover:border-primary/30 hover:-translate-y-0.5"
            }`}
            aria-label={`View ${img.caption}`}
          >
            <div
              className="aspect-square w-full transition-default group-hover/thumb:scale-105"
              style={{
                background: `linear-gradient(135deg, oklch(0.62 0.13 ${img.hue}) 0%, oklch(0.34 0.1 ${img.hue + 25}) 100%)`,
              }}
            />
          </button>
        ))}
      </div>

      {expanded &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label="Galereya"
            onClick={() => setExpanded(false)}
          >
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute right-4 top-4 z-10 inline-flex size-10 items-center justify-center rounded-xl bg-white/10 text-white focus-ring"
              aria-label="Galereyani yopish"
            >
              <X className="size-5" />
            </button>
            <div
              className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="grain aspect-[16/9] w-full max-h-[calc(100dvh-6rem)]"
                style={{
                  background: `linear-gradient(135deg, oklch(0.72 0.15 ${current.hue}) 0%, oklch(0.42 0.12 ${current.hue + 30}) 100%)`,
                }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <div className="text-lg font-medium text-white">{current.caption}</div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
