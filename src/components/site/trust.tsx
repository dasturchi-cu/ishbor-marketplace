import { ShieldCheck, BadgeCheck, Building2, TrendingUp, Zap, Star, Clock, CircleCheck as CheckCircle2, Repeat2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Level = "Top Rated" | "Expert" | "Rising" | "Verified";

const levelConfig: Record<Level, { bg: string; text: string; icon: typeof BadgeCheck }> = {
  "Top Rated": { bg: "bg-primary/10", text: "text-primary", icon: BadgeCheck },
  Expert: { bg: "bg-[oklch(0.78_0.14_200)]/10", text: "text-[oklch(0.65_0.14_200)]", icon: TrendingUp },
  Rising: { bg: "bg-[oklch(0.78_0.14_75)]/10", text: "text-[oklch(0.65_0.14_75)]", icon: Zap },
  Verified: { bg: "bg-success/10", text: "text-success", icon: ShieldCheck },
};

export function LevelBadge({ level, className = "" }: { level: Level; className?: string }) {
  const cfg = levelConfig[level];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest", cfg.bg, cfg.text, className)}>
      <Icon className="size-3" />
      {level}
    </span>
  );
}

export function VerifiedIdentityBadge({ className = "" }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-success", className)}>
      <ShieldCheck className="size-3" /> Identity Verified
    </span>
  );
}

export function VerifiedBusinessBadge({ className = "" }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary", className)}>
      <Building2 className="size-3" /> Business Verified
    </span>
  );
}

export function SuccessScoreBadge({ score, className = "" }: { score: number; className?: string }) {
  const color = score >= 95 ? "text-primary" : score >= 85 ? "text-success" : "text-muted-foreground";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative inline-flex size-9 items-center justify-center">
        <svg className="size-9 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" className="stroke-secondary" strokeWidth="2.5" />
          <circle cx="18" cy="18" r="16" fill="none" className={cn(score >= 95 ? "stroke-primary" : "stroke-success")} strokeWidth="2.5" strokeDasharray={`${score * 1.005} 100`} strokeLinecap="round" />
        </svg>
        <span className={cn("absolute font-mono text-[9px] font-bold", color)}>{score}</span>
      </div>
      <div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Success score</div>
        <div className="font-mono text-xs font-semibold text-foreground">{score}/100</div>
      </div>
    </div>
  );
}

export function TrustMetric({ label, value, icon: Icon, trend, className = "" }: { label: string; value: string | number; icon?: typeof CheckCircle2; trend?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {Icon && (
        <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
          <Icon className="size-4" />
        </div>
      )}
      <div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="font-mono text-sm font-semibold text-foreground">{value}</div>
        {trend && <div className="font-mono text-[10px] text-muted-foreground">{trend}</div>}
      </div>
    </div>
  );
}

export function TrustMetricsGrid({ successScore, completionRate, onTimeDelivery, responseTime, repeatClients, className = "" }: { successScore: number; completionRate: number; onTimeDelivery: number; responseTime: string; repeatClients: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      <SuccessScoreBadge score={successScore} />
      <TrustMetric label="Completion" value={`${completionRate}%`} icon={CheckCircle2} />
      <TrustMetric label="On-time" value={`${onTimeDelivery}%`} icon={Clock} />
      <TrustMetric label="Response" value={responseTime} icon={Zap} />
      <TrustMetric label="Repeat clients" value={`${repeatClients}%`} icon={Repeat2} />
    </div>
  );
}

export function EscrowShield({ size = "sm", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "gap-1.5 px-2.5 py-1 text-[10px]", md: "gap-2 px-3 py-1.5 text-xs", lg: "gap-2.5 px-4 py-2 text-sm" };
  const iconSizes = { sm: "size-3", md: "size-3.5", lg: "size-4" };
  return (
    <span className={cn("inline-flex items-center rounded-full bg-primary/8 font-semibold uppercase tracking-widest text-primary ring-1 ring-primary/10", sizes[size], className)}>
      <Lock className={iconSizes[size]} aria-hidden />
      Escrow Protected
    </span>
  );
}

export function EscrowFundedBadge({ className = "" }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-success ring-1 ring-success/15", className)}>
      <CheckCircle2 className="size-2.5" aria-hidden />
      Funded
    </span>
  );
}

type OrderStatus = "in_progress" | "review" | "revision" | "completed" | "disputed" | "cancelled";

const orderStatusConfig: Record<OrderStatus, { label: string; className: string }> = {
  in_progress: { label: "In Progress", className: "bg-primary/10 text-primary ring-primary/15" },
  review: { label: "In Review", className: "bg-warning/10 text-warning ring-warning/15" },
  revision: { label: "Revision", className: "bg-warning/10 text-warning ring-warning/15" },
  completed: { label: "Completed", className: "bg-success/10 text-success ring-success/15" },
  disputed: { label: "Disputed", className: "bg-destructive/10 text-destructive ring-destructive/15" },
  cancelled: { label: "Cancelled", className: "bg-secondary text-muted-foreground ring-border" },
};

export function OrderStatusBadge({ status, className = "" }: { status: OrderStatus; className?: string }) {
  const cfg = orderStatusConfig[status];
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1", cfg.className, className)}>
      {cfg.label}
    </span>
  );
}

type ApplicationStatus = "pending" | "shortlisted" | "rejected" | "accepted";

const applicationStatusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-secondary text-muted-foreground ring-border" },
  shortlisted: { label: "Shortlisted", className: "bg-primary/10 text-primary ring-primary/15" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive ring-destructive/15" },
  accepted: { label: "Accepted", className: "bg-success/10 text-success ring-success/15" },
};

export function ApplicationStatusBadge({ status, className = "" }: { status: ApplicationStatus; className?: string }) {
  const cfg = applicationStatusConfig[status];
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1", cfg.className, className)}>
      {cfg.label}
    </span>
  );
}

export function CompactTrustRow({ level, identityVerified, businessVerified, successScore, className = "" }: { level: Level; identityVerified: boolean; businessVerified: boolean; successScore: number; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <LevelBadge level={level} />
      {identityVerified && <VerifiedIdentityBadge />}
      {businessVerified && <VerifiedBusinessBadge />}
      {successScore >= 90 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
          <Star className="size-2.5 fill-primary" /> {successScore}
        </span>
      )}
    </div>
  );
}

export function SellerTrustBar({ level, identityVerified, successScore, completionRate, onTime, responseTime, repeatClients, totalEarned, className = "" }: { level: Level; identityVerified: boolean; successScore: number; completionRate: number; onTime: number; responseTime: string; repeatClients: number; totalEarned: number; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-primary/15 bg-primary/5 p-3", className)}>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <LevelBadge level={level} />
        {identityVerified && <VerifiedIdentityBadge />}
        <EscrowShield size="sm" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Score</div>
          <div className="font-mono text-xs font-semibold text-primary">{successScore}</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Done</div>
          <div className="font-mono text-xs font-semibold text-foreground">{completionRate}%</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">On-time</div>
          <div className="font-mono text-xs font-semibold text-foreground">{onTime}%</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-primary/10 pt-2 text-[10px]">
        <span className="text-muted-foreground">Responds {responseTime}</span>
        <span className="text-muted-foreground">{repeatClients}% repeat</span>
        <span className="font-mono text-foreground">${(totalEarned / 1000).toFixed(0)}k earned</span>
      </div>
    </div>
  );
}
