import { Link } from "@tanstack/react-router";
import { MapPin, Users, Star, TrendingUp, Shield } from "lucide-react";
import { GradientAvatar } from "@/components/site/avatar";
import { EscrowShield } from "@/components/site/trust";
import { AgencyVerificationBadge } from "./agency-verification-badge";
import type { Agency } from "@/lib/agency-types";
import type { AgencyMetrics } from "@/lib/agency-metrics-store";

type AgencyCardProps = {
  agency: Agency;
  metrics: AgencyMetrics;
  rankingScore?: number;
};

export function AgencyCard({ agency, metrics, rankingScore }: AgencyCardProps) {
  const activeMembers = agency.members.filter((m) => m.status === "active").length;
  const initials = agency.name.slice(0, 2).toUpperCase();

  return (
    <Link
      to="/agencies/$slug"
      params={{ slug: agency.slug }}
      className="group premium-card-interactive flex flex-col rounded-2xl border border-border bg-card p-5 hover:border-primary/25 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {agency.logo ? (
          <img src={agency.logo} alt="" className="size-12 rounded-xl object-cover" />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 font-display text-lg font-bold text-primary">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold group-hover:text-primary">{agency.name}</h3>
            <AgencyVerificationBadge level={agency.verificationLevel} />
            <EscrowShield size="sm" className="!px-1.5 !py-0 !text-[8px]" />
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{agency.description}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {agency.specializations.slice(0, 3).map((s) => (
          <span key={s} className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium">{s}</span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Metric icon={Star} label="Baho" value={metrics.rating > 0 ? metrics.rating.toFixed(1) : "—"} />
        <Metric icon={Shield} label="Ishonch" value={`${metrics.trustScore}`} />
        <Metric icon={TrendingUp} label="Muvaffaqiyat" value={`${metrics.successScore}`} />
        <Metric icon={Users} label="Jamoa" value={`${activeMembers}`} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {agency.location}</span>
        {rankingScore !== undefined && (
          <span className="font-mono text-primary">{rankingScore} ball</span>
        )}
      </div>
    </Link>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 px-2 py-1.5">
      <div className="flex items-center gap-1 text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  );
}

export function AgencyMemberRow({
  name,
  role,
  hue,
  username,
}: {
  name: string;
  role: string;
  hue: number;
  username?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <GradientAvatar name={name} hue={hue} size={36} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{name}</div>
        {username && <div className="text-xs text-muted-foreground">@{username}</div>}
      </div>
      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">{role}</span>
    </div>
  );
}
