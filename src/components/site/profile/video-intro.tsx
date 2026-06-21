import { useState } from "react";
import { Play } from "lucide-react";
import { Modal } from "@/components/site/modals";
import { GradientAvatar } from "@/components/site/avatar";

export function VideoIntro({ name, hue, duration }: { name: string; hue: number; duration: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex h-full flex-col">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative block w-full flex-1 text-left"
          aria-label={`${name} video tanishtiruvi`}
        >
          <div
            className="grain relative aspect-video w-full lg:min-h-[220px] lg:aspect-auto lg:h-full"
            style={{
              background: `linear-gradient(145deg, oklch(0.58 0.15 ${hue}) 0%, oklch(0.32 0.11 ${hue + 40}) 55%, oklch(0.22 0.08 ${hue + 60}) 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="inline-flex size-14 items-center justify-center rounded-full bg-white/95 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)] transition-transform group-hover:scale-105 sm:size-16">
                <Play className="ml-1 size-6 fill-primary text-primary sm:size-7" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 sm:p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/70">
                Video tanishtiruv
              </div>
              <div className="mt-0.5 text-sm font-semibold text-white sm:text-base">{name} o'z ishini tanishtirmoqda</div>
            </div>
            <span className="absolute right-4 top-4 rounded-full bg-black/50 px-2.5 py-1 font-mono text-[10px] text-white backdrop-blur-sm">
              {duration}
            </span>
            <span className="absolute left-4 top-4 rounded-full bg-warning/90 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-warning-foreground">
              Demo
            </span>
          </div>
        </button>
        <p className="px-5 py-4 text-xs leading-relaxed text-muted-foreground sm:px-6">
          {name.split(" ")[0]} bilan bevosita bog'laning — jarayoni, so'nggi loyihalari va hamkorlikda nimalarni kutish mumkinligi haqida.
        </p>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Video tanishtiruv"
        description={`${name} — ${duration}`}
      >
        <div
          className="relative aspect-video w-full overflow-hidden rounded-xl"
          style={{
            background: `linear-gradient(145deg, oklch(0.58 0.15 ${hue}) 0%, oklch(0.32 0.11 ${hue + 40}) 100%)`,
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <GradientAvatar name={name} hue={hue} size={64} rounded="rounded-2xl" />
            <p className="text-sm leading-relaxed opacity-90">
              {name} dizayn jarayoni, ishonch ko'rsatkichlari va hamkorlik uslubi haqida qisqa tanishtiruv.
            </p>
            <div className="font-mono text-xs uppercase tracking-widest opacity-70">Demo tanishtiruv · {duration}</div>
          </div>
        </div>
      </Modal>
    </>
  );
}
