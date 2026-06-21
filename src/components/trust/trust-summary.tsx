import { CheckCircle2, Clock, Repeat2, ShieldCheck, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LevelBadge,
  VerifiedIdentityBadge,
  EscrowShield,
} from "@/components/site/trust";
import { computeFreelancerReputation, computeClientReputation } from "@/lib/reputation-store";
import {
  computeSuccessScore,
  computeResponseRate,
  formatResponseTime,
  getFreelancerLevel,
} from "@/lib/growth-metrics";
import { ReputationBadge } from "@/components/reputation/reputation-badge";

type Level = "Top Rated" | "Expert" | "Rising" | "Verified";

function TrustMetricPill({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[10px]",
        highlight
          ? "border-primary/20 bg-primary/5 text-primary"
          : "border-border bg-surface text-muted-foreground",
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      <span className="text-foreground/70">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}

/** Compact trust row for marketplace cards — single source from growth-metrics + reputation-store */
export function CardTrustStrip({
  username,
  level,
  identityVerified,
  className,
}: {
  username: string;
  level?: Level;
  identityVerified?: boolean;
  className?: string;
}) {
  const liveLevel = level ?? getFreelancerLevel(username);
  const success = computeSuccessScore(username);
  const response = computeResponseRate(username);
  const responseLabel = formatResponseTime(response.medianMinutes);
  const rep = computeFreelancerReputation(username);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <LevelBadge level={liveLevel} className="!px-2 !py-0.5 !text-[9px]" />
        {identityVerified && <VerifiedIdentityBadge className="!px-2 !py-0.5 !text-[9px]" />}
        {rep.reviewCount >= 3 && liveLevel === "Top Rated" && (
          <ReputationBadge tier={rep.tier} size="sm" showLabel={false} />
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <TrustMetricPill icon={Star} label="Ball" value={`${success.score}`} highlight={success.score >= 85} />
        <TrustMetricPill icon={CheckCircle2} label="Bajarilgan" value={`${success.completionRate}%`} />
        <TrustMetricPill icon={Clock} label="Javob" value={responseLabel} />
        {success.repeatClientRate > 0 && (
          <TrustMetricPill icon={Repeat2} label="Takror" value={`${success.repeatClientRate}%`} />
        )}
      </div>
    </div>
  );
}

/** Profile hero trust banner — answers "Can I trust this freelancer?" */
export function ProfileTrustBanner({
  username,
  identityVerified,
  rating,
  reviewCount,
  className,
}: {
  username: string;
  identityVerified: boolean;
  rating: number;
  reviewCount: number;
  className?: string;
}) {
  const level = getFreelancerLevel(username);
  const success = computeSuccessScore(username);
  const response = computeResponseRate(username);
  const rep = computeFreelancerReputation(username);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-gradient-to-r from-surface via-card to-surface p-4 sm:p-5",
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">
            Ishonch ko&apos;rsatkichlari
          </span>
        </div>
        <EscrowShield size="sm" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LevelBadge level={level} />
        {identityVerified && <VerifiedIdentityBadge />}
        <ReputationBadge tier={rep.tier} size="sm" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Ishonch balli", value: `${rep.trustScore}`, icon: ShieldCheck },
          { label: "Muvaffaqiyat", value: `${success.score}/100`, icon: Zap },
          { label: "Bajarilish", value: `${success.completionRate}%`, icon: CheckCircle2 },
          { label: "Javob vaqti", value: formatResponseTime(response.medianMinutes), icon: Clock },
          { label: "Takroriy mijoz", value: `${success.repeatClientRate}%`, icon: Repeat2 },
          {
            label: "Reyting",
            value: reviewCount > 0 ? `${rating.toFixed(1)}★ (${reviewCount})` : "—",
            icon: Star,
          },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-border bg-card px-3 py-2.5">
            <div className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              <m.icon className="size-3" aria-hidden />
              {m.label}
            </div>
            <div className="mt-0.5 font-mono text-sm font-semibold">{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mijoz profili uchun ishonch banner */
export function ClientTrustBanner({
  slug,
  name,
  verified,
  className,
}: {
  slug: string;
  name: string;
  verified: boolean;
  className?: string;
}) {
  const rep = computeClientReputation(slug, name);

  return (
    <div className={cn("rounded-xl border border-border bg-gradient-to-r from-surface via-card to-surface p-4 sm:p-5", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">
            Mijoz ishonchi
          </span>
        </div>
        <EscrowShield size="sm" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {verified && <VerifiedIdentityBadge />}
        <ReputationBadge tier={rep.tier} size="sm" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Ishonch", value: `${rep.trustScore}` },
          { label: "Bajarilish", value: `${rep.completionRate}%` },
          { label: "Takroriy yollash", value: `${rep.repeatClientRate}%` },
          { label: "Sharhlar", value: rep.reviewCount > 0 ? `${rep.avgRating}★ (${rep.reviewCount})` : "—" },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-border bg-card px-3 py-2.5">
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
            <div className="mt-0.5 font-mono text-sm font-semibold">{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Xabarlar header uchun qisqa trust chip */
export function MessageTrustChip({ username }: { username?: string }) {
  if (!username) return null;
  const success = computeSuccessScore(username);
  const level = getFreelancerLevel(username);
  const freelancer = computeFreelancerReputation(username);

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <LevelBadge level={level} className="!px-1.5 !py-0 !text-[8px]" />
      <span className="font-mono rounded-md border border-border bg-surface px-1.5 py-0.5 text-[9px] text-muted-foreground">
        {success.score} ball · {freelancer.avgRating > 0 ? `${freelancer.avgRating.toFixed(1)}★` : "—"}
      </span>
      <EscrowShield size="sm" className="!px-1.5 !py-0 !text-[8px]" />
    </div>
  );
}
