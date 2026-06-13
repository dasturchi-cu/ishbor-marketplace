import { ShieldCheck, BadgeCheck, Building2, TrendingUp, Zap, Star, Clock, CircleCheck as CheckCircle2, Repeat2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Level = "Top Rated" | "Expert" | "Rising" | "Verified";

const levelLabels: Record<Level, string> = {
  "Top Rated": "Eng yuqori baholangan",
  Expert: "Mutaxassis",
  Rising: "Rivojlanayotgan",
  Verified: "Tasdiqlangan",
};

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
      {levelLabels[level]}
    </span>
  );
}

export function VerifiedIdentityBadge({ className = "" }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-success", className)}>
      <ShieldCheck className="size-3" /> Shaxs tasdiqlangan
    </span>
  );
}

export function VerifiedBusinessBadge({ className = "" }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary", className)}>
      <Building2 className="size-3" /> Biznes tasdiqlangan
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
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Muvaffaqiyat balli</div>
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
      <TrustMetric label="Bajarilish" value={`${completionRate}%`} icon={CheckCircle2} />
      <TrustMetric label="O'z vaqtida" value={`${onTimeDelivery}%`} icon={Clock} />
      <TrustMetric label="Javob" value={responseTime} icon={Zap} />
      <TrustMetric label="Takroriy mijozlar" value={`${repeatClients}%`} icon={Repeat2} />
    </div>
  );
}

export function EscrowShield({ size = "sm", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "gap-1.5 px-2.5 py-1 text-[10px]", md: "gap-2 px-3 py-1.5 text-xs", lg: "gap-2.5 px-4 py-2 text-sm" };
  const iconSizes = { sm: "size-3", md: "size-3.5", lg: "size-4" };
  return (
    <span className={cn("inline-flex items-center rounded-full bg-primary/8 font-semibold uppercase tracking-widest text-primary ring-1 ring-primary/10", sizes[size], className)}>
      <Lock className={iconSizes[size]} aria-hidden />
      Eskrou himoyasi
    </span>
  );
}

type TrustGuaranteeTone = "primary" | "success" | "neutral";

const trustGuaranteeTone: Record<
  TrustGuaranteeTone,
  { card: string; icon: string; iconRing: string; label: string }
> = {
  primary: {
    card: "border-primary/12 bg-gradient-to-b from-primary/[0.06] to-primary/[0.02]",
    icon: "bg-primary/10 text-primary",
    iconRing: "ring-primary/15",
    label: "text-primary",
  },
  success: {
    card: "border-success/12 bg-gradient-to-b from-success/[0.06] to-success/[0.02]",
    icon: "bg-success/10 text-success",
    iconRing: "ring-success/15",
    label: "text-success",
  },
  neutral: {
    card: "border-border bg-gradient-to-b from-card to-elevated/30",
    icon: "bg-secondary text-muted-foreground",
    iconRing: "ring-border",
    label: "text-foreground",
  },
};

export function TrustGuaranteeCard({
  icon: Icon,
  label,
  detail,
  tone = "primary",
  layout = "stacked",
  className = "",
}: {
  icon: typeof Lock;
  label: string;
  detail?: string;
  tone?: TrustGuaranteeTone;
  layout?: "inline" | "stacked";
  className?: string;
}) {
  const t = trustGuaranteeTone[tone];

  const iconEl = (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
        layout === "stacked" ? "size-10" : "size-9",
        t.icon,
        t.iconRing,
      )}
    >
      <Icon className={layout === "stacked" ? "size-[18px]" : "size-4"} strokeWidth={2} aria-hidden />
    </div>
  );

  const textEl = (
    <div className="min-w-0">
      <p className={cn("font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.14em]", t.label)}>
        {label}
      </p>
      {detail && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</p>
      )}
    </div>
  );

  if (layout === "inline") {
    return (
      <div className={cn("flex items-start gap-3.5 rounded-xl border p-4", t.card, className)}>
        {iconEl}
        <div className="min-w-0 flex-1 pt-0.5">{textEl}</div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col rounded-xl border p-4", t.card, className)}>
      {iconEl}
      <div className="mt-3.5">{textEl}</div>
    </div>
  );
}

export function EscrowFundedBadge({ className = "" }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-success ring-1 ring-success/15", className)}>
      <CheckCircle2 className="size-2.5" aria-hidden />
      Moliyalashtirilgan
    </span>
  );
}

type OrderStatus = "in_progress" | "review" | "revision" | "completed" | "disputed" | "cancelled";

const orderStatusConfig: Record<OrderStatus, { label: string; className: string }> = {
  in_progress: { label: "Jarayonda", className: "bg-primary/10 text-primary ring-primary/15" },
  review: { label: "Ko'rib chiqilmoqda", className: "bg-warning/10 text-warning ring-warning/15" },
  revision: { label: "Qayta ishlash", className: "bg-warning/10 text-warning ring-warning/15" },
  completed: { label: "Bajarildi", className: "bg-success/10 text-success ring-success/15" },
  disputed: { label: "Nizoli", className: "bg-destructive/10 text-destructive ring-destructive/15" },
  cancelled: { label: "Bekor qilindi", className: "bg-secondary text-muted-foreground ring-border" },
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
  pending: { label: "Kutilmoqda", className: "bg-secondary text-muted-foreground ring-border" },
  shortlisted: { label: "Tanlov ro'yxatida", className: "bg-primary/10 text-primary ring-primary/15" },
  rejected: { label: "Rad etildi", className: "bg-destructive/10 text-destructive ring-destructive/15" },
  accepted: { label: "Qabul qilindi", className: "bg-success/10 text-success ring-success/15" },
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
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Ball</div>
          <div className="font-mono text-xs font-semibold text-primary">{successScore}</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Bajarilgan</div>
          <div className="font-mono text-xs font-semibold text-foreground">{completionRate}%</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">O'z vaqtida</div>
          <div className="font-mono text-xs font-semibold text-foreground">{onTime}%</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-primary/10 pt-2 text-[10px]">
        <span className="text-muted-foreground">{responseTime} da javob beradi</span>
        <span className="text-muted-foreground">{repeatClients}% takror</span>
        <span className="font-mono text-foreground">${(totalEarned / 1000).toFixed(0)}k topilgan</span>
      </div>
    </div>
  );
}
