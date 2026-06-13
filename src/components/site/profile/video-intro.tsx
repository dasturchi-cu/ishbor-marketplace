import { Play } from "lucide-react";
import { toast } from "sonner";

export function VideoIntro({ name, hue, duration }: { name: string; hue: number; duration: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => toast.success(`Playing ${name.split(" ")[0]}'s video introduction`)}
        className="group relative block w-full text-left focus-ring"
        aria-label={`Play video introduction from ${name}`}
      >
        <div
          className="grain relative aspect-video w-full"
          style={{
            background: `linear-gradient(135deg, oklch(0.55 0.14 ${hue}) 0%, oklch(0.28 0.10 ${hue + 40}) 100%)`,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="inline-flex size-16 items-center justify-center rounded-full bg-white/95 shadow-lg transition-default group-hover:scale-105">
              <Play className="ml-1 size-7 fill-primary text-primary" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/70">
              Video introduction
            </div>
            <div className="text-sm font-semibold text-white">{name} introduces their work</div>
          </div>
          <span className="absolute right-4 top-4 rounded-md bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white">
            {duration}
          </span>
        </div>
      </button>
      <p className="px-4 py-3 text-xs text-muted-foreground">
        Hear directly from {name.split(" ")[0]} about their process, recent projects, and what to expect when working together.
      </p>
    </div>
  );
}
