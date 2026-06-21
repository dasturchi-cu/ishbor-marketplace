import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Star,
  Clock,
  Users,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  Eye,
  Send,
  ShoppingCart,
} from "lucide-react";
import { GradientAvatar } from "./avatar";
import { LevelBadge, VerifiedIdentityBadge, EscrowShield } from "./trust";
import { SaveButton, SaveButtonInline } from "./save-button";
import type { Freelancer, Service, Project } from "@/lib/mock-data";
import {
  budgetTypeLabels,
  experienceLevelLabels,
  formatPostedAgo,
  formatProjectBudget,
} from "@/lib/project-validation";
import { ClientCheckoutLink } from "@/components/checkout/client-checkout-link";
import { CardTrustStrip } from "@/components/trust/trust-summary";
import { computeSuccessScore, computeResponseRate, formatResponseTime } from "@/lib/growth-metrics";

const actionBase =
  "touch-target relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2.5 text-[11px] font-semibold transition-default focus-ring";
const actionSecondary =
  "border border-border bg-card text-foreground hover:border-primary/25 hover:bg-secondary/40";
const actionPrimary =
  "bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_oklch(0.546_0.185_257/0.35)] hover:opacity-90 active:scale-[0.98]";

export function FreelancerCard({ f }: { f: Freelancer }) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-default hover-lift hover:border-primary/20 hover:shadow-[0_20px_56px_-16px_oklch(0.546_0.185_257/0.14)] active:scale-[0.995]">
      <SaveButton
        type="freelancer"
        id={f.username}
        className="absolute right-4 top-4 z-20 !bg-secondary !text-muted-foreground hover:!bg-primary/10 hover:!text-primary"
      />
      <Link to="/freelancers/$username" params={{ username: f.username }} className="block flex-1 p-5 pb-4 pr-14">
        <div className="mb-4 flex items-start gap-3">
          <GradientAvatar name={f.name} hue={f.hue} size={52} rounded="rounded-xl" className="shrink-0 ring-2 ring-border/60 transition-default group-hover:ring-primary/20" />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-display text-sm font-semibold leading-tight transition-default group-hover:text-primary">
                {f.name}
              </h3>
              {f.identityVerified && <CheckCircle2 className="size-3.5 shrink-0 text-success" />}
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{f.title}</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-surface/80 px-3.5 py-2.5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Stavka</div>
            <div className="font-display text-lg font-bold tracking-tight">
              ${f.rate}
              <span className="text-sm font-medium text-muted-foreground">/soat</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Reyting</div>
            <div className="flex items-center justify-end gap-1">
              <Star className="size-3.5 fill-gold text-gold" />
              <span className="font-display text-sm font-bold">{f.rating.toFixed(2)}</span>
              <span className="font-mono text-[10px] text-muted-foreground">({f.reviews})</span>
            </div>
          </div>
        </div>

        <CardTrustStrip
          username={f.username}
          level={f.level}
          identityVerified={f.identityVerified}
          className="mb-3"
        />

        <div className="flex flex-wrap gap-1.5">
          {f.skills.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-md bg-secondary px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-default group-hover:bg-secondary/80"
            >
              {s}
            </span>
          ))}
          {f.skills.length > 3 && (
            <span className="rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground">
              +{f.skills.length - 3}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
          <div className="flex shrink-0 flex-col items-start gap-0.5">
            {f.available && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-success">
                <span className="size-1.5 rounded-full bg-success animate-pulse-subtle" />
                Mavjud
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">{f.city}</span>
          </div>
        </div>
      </Link>

      <div className="relative z-10 mt-auto flex gap-2 border-t border-border bg-elevated/50 p-3">
        <Link to="/freelancers/$username" params={{ username: f.username }} className={`${actionBase} ${actionSecondary}`}>
          <Eye className="size-3.5" /> Profil
        </Link>
        <Link to="/messages" className={`${actionBase} ${actionSecondary}`}>
          <MessageSquare className="size-3.5" /> Xabar
        </Link>
        <ClientCheckoutLink
          search={{ type: "hire" as const, freelancer: f.username }}
          className={`${actionBase} ${actionPrimary}`}
        >
          <ArrowRight className="size-3.5" /> Yollash
        </ClientCheckoutLink>
      </div>
    </div>
  );
}

export function ServiceCard({ s, compact = false }: { s: Service; compact?: boolean }) {
  const sellerSuccess = computeSuccessScore(s.sellerUsername);
  const sellerResponse = formatResponseTime(computeResponseRate(s.sellerUsername).medianMinutes);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-default hover-lift hover:border-primary/20 hover:shadow-[0_20px_56px_-16px_oklch(0.546_0.185_257/0.14)] active:scale-[0.995]">
      <Link to="/services/$slug" params={{ slug: s.slug }} className="block flex-1">
        <div
          className="relative aspect-[5/3] w-full overflow-hidden"
          style={{
            background: `linear-gradient(135deg, oklch(0.62 0.14 ${s.hue}) 0%, oklch(0.36 0.10 ${s.hue + 30}) 100%)`,
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="absolute left-3 top-3 flex max-w-[calc(100%-3.5rem)] flex-wrap items-center gap-1.5">
            <span className="font-mono rounded-full bg-black/55 px-2.5 py-1 text-[10px] uppercase tracking-widest text-white/90">
              {s.category}
            </span>
            {s.sellerIdentityVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5">
                <CheckCircle2 className="size-2.5 text-white/90" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/80">Tasdiqlangan</span>
              </span>
            )}
          </div>
          <SaveButton type="service" id={s.slug} className="absolute right-3 top-3 z-10" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end p-3">
            <div className="rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Dan </span>
              <span className="font-display text-sm font-bold text-foreground">${s.price}</span>
            </div>
          </div>
        </div>

        <div className="p-4 pb-3">
          <div className="mb-3 flex items-center gap-2.5">
            <GradientAvatar
              name={s.seller}
              hue={s.sellerHue}
              size={28}
              rounded="rounded-lg"
              className="shrink-0 ring-2 ring-border/60 transition-default group-hover:ring-primary/20"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-semibold text-foreground">{s.seller}</span>
                <LevelBadge level={s.sellerLevel} className="!shrink-0 !px-1.5 !py-0 !text-[8px]" />
              </div>
            </div>
          </div>

          <h3 className="font-display line-clamp-2 text-sm font-semibold leading-snug tracking-tight transition-default group-hover:text-primary">
            {s.title}
          </h3>

          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-border bg-surface/80 px-3 py-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="size-3 fill-gold text-gold" />
              <span className="font-mono font-semibold text-foreground">{s.rating.toFixed(1)}</span>
              <span>({s.reviews})</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="size-3" />
              <span className="font-medium text-foreground">{s.delivery}</span>
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <EscrowShield size="sm" className="!bg-primary/8" />
            <span className="font-mono rounded-md border border-border bg-surface px-2 py-0.5 text-[10px] text-muted-foreground">
              Javob <span className="font-semibold text-foreground">{sellerResponse}</span>
            </span>
            <span className="font-mono rounded-md border border-border bg-surface px-2 py-0.5 text-[10px] text-muted-foreground">
              Ball <span className="font-semibold text-foreground">{sellerSuccess.score}</span>
            </span>
          </div>
        </div>
      </Link>

      <div
        className={
          compact
            ? "relative z-10 mt-auto grid grid-cols-2 gap-2 border-t border-border bg-elevated/50 p-3"
            : "relative z-10 mt-auto flex gap-2 border-t border-border bg-elevated/50 p-3"
        }
      >
        <Link
          to="/services/$slug"
          params={{ slug: s.slug }}
          className={`${actionBase} ${actionSecondary}`}
        >
          <Eye className="size-3.5 shrink-0" />
          <span className="truncate">Ko'rish</span>
        </Link>
        {!compact && (
          <Link to="/messages" className={`${actionBase} ${actionSecondary}`}>
            <MessageSquare className="size-3.5 shrink-0" />
            <span className="truncate">Bog'lanish</span>
          </Link>
        )}
        <ClientCheckoutLink
          search={{
            type: "service" as const,
            service: s.slug,
            package: "premium" as const,
          }}
          className={`${actionBase} ${actionPrimary}`}
        >
          <ShoppingCart className="size-3.5 shrink-0" />
          <span className="truncate">Buyurtma</span>
        </ClientCheckoutLink>
      </div>
    </div>
  );
}

export function ProjectCard({ p }: { p: Project }) {
  const budgetLabel = formatProjectBudget(p);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-default hover-lift hover:border-primary/20 hover:shadow-[0_20px_56px_-16px_oklch(0.546_0.185_257/0.14)] active:scale-[0.995]">
      <SaveButton
        type="project"
        id={p.slug}
        className="absolute right-4 top-4 z-20 !bg-secondary !text-muted-foreground hover:!bg-primary/10 hover:!text-primary"
      />

      <Link to="/projects/$slug" params={{ slug: p.slug }} className="block flex-1 p-5 pb-4 pr-14">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            {p.category}
          </span>
          {p.escrowProtected ? (
            <EscrowShield size="sm" className="!bg-primary/8 !px-2 !py-0.5" />
          ) : (
            <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              Ochiq loyiha
            </span>
          )}
          <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            {experienceLevelLabels[p.experienceLevel]}
          </span>
        </div>

        <h3 className="font-display line-clamp-2 text-base font-semibold leading-snug tracking-tight transition-default group-hover:text-primary">
          {p.title}
        </h3>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <GradientAvatar name={p.client} hue={p.clientHue} size={24} rounded="rounded-md" />
          <span className="font-medium text-foreground">{p.client}</span>
          {p.clientVerified && (
            <span className="inline-flex items-center gap-0.5 text-success">
              <CheckCircle2 className="size-3" /> Tasdiqlangan
            </span>
          )}
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {formatPostedAgo(p.postedAgo)}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Byudjet</div>
            <div className="font-display text-lg font-bold tracking-tight">{budgetLabel}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Muddat</div>
            <div className="text-sm font-semibold">{p.duration}</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              {budgetTypeLabels[p.budgetType]}
            </div>
          </div>
        </div>

        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="rounded-md bg-secondary px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
              {skill}
            </span>
          ))}
          {p.skills.length > 4 && (
            <span className="rounded-md px-2 py-1 text-[10px] text-muted-foreground">+{p.skills.length - 4}</span>
          )}
        </div>

        {p.clientSpent > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="font-mono rounded-md border border-border bg-surface px-2 py-1 text-[10px] text-muted-foreground">
              ${(p.clientSpent / 1000).toFixed(0)}k sarflangan
            </span>
            <span className="font-mono rounded-md border border-border bg-surface px-2 py-1 text-[10px] text-muted-foreground">
              {p.clientHires} yollash
            </span>
            {p.clientVerified && (
              <span className="inline-flex items-center gap-0.5 rounded-md border border-success/20 bg-success/5 px-2 py-1 text-[10px] font-medium text-success">
                <CheckCircle2 className="size-3" /> Tasdiqlangan mijoz
              </span>
            )}
          </div>
        )}
      </Link>

      <div className="relative z-10 mt-auto flex items-center justify-between gap-3 border-t border-border bg-elevated/50 px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          <span className="font-mono font-semibold text-foreground">{p.proposals}</span>
          taklif
        </span>
        <div className="flex gap-2">
          <Link
            to="/projects/$slug"
            params={{ slug: p.slug }}
            className="touch-target inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-semibold transition-default hover:border-primary/25 hover:bg-secondary/40 focus-ring"
          >
            <Eye className="size-3.5" /> Ko'rish
          </Link>
          <Link
            to="/projects/$slug"
            params={{ slug: p.slug }}
            search={{ proposal: true }}
            className="touch-target inline-flex items-center gap-1 rounded-lg bg-primary px-3.5 py-2 text-[11px] font-semibold text-primary-foreground shadow-[0_8px_20px_-8px_oklch(0.546_0.185_257/0.35)] transition-default hover:opacity-90 focus-ring"
          >
            <Send className="size-3.5" /> Taklif
          </Link>
        </div>
      </div>
    </div>
  );
}
