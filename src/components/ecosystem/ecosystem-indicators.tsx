import { Link } from "@tanstack/react-router";
import { Repeat2, TrendingUp, Heart, Star } from "lucide-react";
import type { EcosystemMetrics } from "@/lib/ecosystem-progress";

export function RepeatClientBadge({ count, rate }: { count: number; rate?: number }) {
  if (count <= 0 && !rate) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success/5 px-2.5 py-1 text-[11px] font-semibold text-success">
      <Repeat2 className="size-3" />
      {count > 0 ? `${count} takror mijoz` : `Takror ${rate}%`}
    </span>
  );
}

export function EcosystemMetricPills({
  metrics,
  role,
}: {
  metrics: EcosystemMetrics;
  role: "client" | "freelancer";
}) {
  const pills =
    role === "freelancer"
      ? [
          { icon: TrendingUp, label: `Muvaffaqiyat ${metrics.successScore}` },
          { icon: Repeat2, label: `Takror ${metrics.repeatClientRate}%` },
          metrics.rankingScore > 0
            ? { icon: Star, label: `Qidiruv ${metrics.rankingScore}` }
            : null,
        ]
      : [
          metrics.repeatHireCount > 0
            ? { icon: Repeat2, label: `${metrics.repeatHireCount} takror yollash` }
            : null,
          metrics.savedFreelancers > 0
            ? { icon: Heart, label: `${metrics.savedFreelancers} sevimli` }
            : null,
        ];

  const visible = pills.filter(Boolean) as { icon: typeof TrendingUp; label: string }[];
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((p) => (
        <span
          key={p.label}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          <p.icon className="size-3 text-primary" />
          {p.label}
        </span>
      ))}
    </div>
  );
}

export function PendingReviewsBanner({
  count,
  href = "/orders",
}: {
  count: number;
  href?: string;
}) {
  if (count <= 0) return null;
  return (
    <Link
      to={href}
      className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm transition-default hover:border-primary/35"
    >
      <span>
        <span className="font-semibold text-foreground">{count} ta sharh kutilmoqda</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          Sharh qoldiring — ishonch va reyting oshadi
        </span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-primary">Ko&apos;rish →</span>
    </Link>
  );
}

export function ReviewPromptCard({
  orderTitle,
  orderId,
}: {
  orderTitle: string;
  orderId: string;
}) {
  return (
    <div
      id="review-prompt"
      className="rounded-2xl border border-success/25 bg-success/5 p-5"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
          <Star className="size-5 fill-current" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-success">Ish yakunlandi — sharh qoldiring</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            &quot;{orderTitle}&quot; bo&apos;yicha tajribangizni baholang. Sharh ishonch balli va qidiruv
            reytingiga ta&apos;sir qiladi.
          </p>
          <a
            href="#review-form"
            className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
          >
            Sharh formasiga o&apos;tish ↓
          </a>
        </div>
      </div>
      <Link
        to="/orders/$id"
        params={{ id: orderId }}
        className="sr-only"
        aria-hidden
      >
        {orderTitle}
      </Link>
    </div>
  );
}