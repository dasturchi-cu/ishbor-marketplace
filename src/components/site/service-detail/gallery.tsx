import { useState } from "react";
import { Maximize2 } from "lucide-react";
import type { ServiceGalleryImage } from "@/lib/mock-data";

export function ServiceGallery({ images, hue }: { images: ServiceGalleryImage[]; hue: number }) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-3">
      <div className="group relative overflow-hidden rounded-2xl border border-border">
        <div
          className="grain aspect-[16/9] w-full transition-default"
          style={{
            background: `linear-gradient(135deg, oklch(0.72 0.15 ${images[active]!.hue}) 0%, oklch(0.42 0.12 ${images[active]!.hue + 30}) 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_20%,rgba(255,255,255,0.18),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="text-sm font-medium text-white">{images[active]!.caption}</div>
        </div>
        <button
          type="button"
          className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-lg bg-black/40 text-white opacity-0 transition-default group-hover:opacity-100 focus-ring"
          aria-label="Expand gallery"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`overflow-hidden rounded-lg border transition-default focus-ring ${active === i ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/30"}`}
            aria-label={`View ${img.caption}`}
          >
            <div
              className="aspect-square w-full"
              style={{
                background: `linear-gradient(135deg, oklch(0.65 0.12 ${img.hue}) 0%, oklch(0.38 0.10 ${img.hue + 20}) 100%)`,
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
