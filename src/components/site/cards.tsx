import { Link } from "@tanstack/react-router";
import { Star, Clock, Users, ShieldCheck, BadgeCheck } from "lucide-react";
import { GradientAvatar } from "./avatar";
import type { Freelancer, Service, Project } from "@/lib/mock-data";

export function FreelancerCard({ f }: { f: Freelancer }) {
  return (
    <Link
      to="/freelancers/$username"
      params={{ username: f.username }}
      className="group block rounded-2xl border border-border bg-card p-5 transition-default hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_16px_48px_-12px_oklch(0.546_0.185_257/0.12)]"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <GradientAvatar name={f.name} hue={f.hue} size={48} rounded="rounded-xl" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-display text-sm font-semibold leading-tight">
                {f.name}
              </h3>
              {f.level === "Top Rated" && (
                <BadgeCheck className="size-3.5 shrink-0 text-primary" />
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{f.title}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm font-medium">
            ${f.rate}
            <span className="text-muted-foreground">/h</span>
          </div>
          <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            <Star className="size-3 fill-gold text-gold" />
            <span className="font-mono">{f.rating.toFixed(2)}</span>
            <span>({f.reviews})</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {f.skills.slice(0, 3).map((s) => (
          <span
            key={s}
            className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
          >
            {s}
          </span>
        ))}
        {f.skills.length > 3 && (
          <span className="rounded-md px-2 py-0.5 text-[10px] text-muted-foreground">
            +{f.skills.length - 3}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <span
          className={`font-mono text-[10px] font-semibold uppercase tracking-[0.16em] ${
            f.level === "Top Rated"
              ? "text-primary"
              : f.level === "Expert"
                ? "text-foreground"
                : "text-muted-foreground"
          }`}
        >
          {f.level}
        </span>
        <div className="flex items-center gap-1.5">
          {f.available && (
            <span className="inline-flex items-center gap-1 text-[10px] text-success">
              <span className="size-1.5 rounded-full bg-success animate-pulse-subtle" />
              Available
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">{f.city}</span>
        </div>
      </div>
    </Link>
  );
}

export function ServiceCard({ s }: { s: Service }) {
  return (
    <Link
      to="/services/$slug"
      params={{ slug: s.slug }}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-default hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_16px_48px_-12px_oklch(0.546_0.185_257/0.12)]"
    >
      <div
        className="relative aspect-[5/3] w-full"
        style={{
          background: `linear-gradient(135deg, oklch(0.62 0.14 ${s.hue}) 0%, oklch(0.36 0.10 ${
            s.hue + 30
          }) 100%)`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="absolute left-3 top-3">
          <span className="font-mono rounded-full bg-black/25 px-2.5 py-1 text-[10px] uppercase tracking-widest text-white/90 backdrop-blur-sm">
            {s.category}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-xs shadow-sm">
          <span className="text-muted-foreground">From </span>
          <span className="font-display font-semibold text-foreground">${s.price}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <GradientAvatar name={s.seller} hue={s.sellerHue} size={20} />
          <span className="text-xs text-muted-foreground">{s.seller}</span>
        </div>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors">
          {s.title}
        </h3>
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3 fill-gold text-gold" />
            <span className="font-mono text-foreground">{s.rating.toFixed(1)}</span>
            <span>({s.reviews})</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {s.delivery}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProjectCard({ p }: { p: Project }) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 transition-default hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_16px_48px_-12px_oklch(0.546_0.185_257/0.12)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              {p.category}
            </span>
            {p.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary">
                <ShieldCheck className="size-2.5" /> Escrow funded
              </span>
            )}
          </div>
          <h3 className="font-display text-base font-semibold leading-tight tracking-tight">
            {p.title}
          </h3>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <GradientAvatar name={p.client} hue={p.clientHue} size={16} />
            <span>{p.client}</span>
            <span className="text-border">·</span>
            <span>{p.postedAgo}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-lg font-semibold">
            ${p.budget.toLocaleString()}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {p.budgetType} · {p.duration}
          </div>
        </div>
      </div>

      <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {p.description}
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {p.skills.map((s) => (
          <span
            key={s}
            className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          <span className="font-mono text-foreground">{p.proposals}</span> proposals
        </span>
        <button className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring">
          Send proposal
        </button>
      </div>
    </div>
  );
}