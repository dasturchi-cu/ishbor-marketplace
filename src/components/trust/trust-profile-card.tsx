import type { AuthUser } from "@/lib/auth";
import type { Freelancer } from "@/lib/mock-data";
import { computeClientTrust, computeFreelancerTrust, type TrustProfile } from "@/lib/trust-utils";

export function TrustProfileCard({ profile, trust }: { profile: AuthUser | Freelancer; trust?: TrustProfile }) {
  const t = trust ?? ("skills" in profile && Array.isArray((profile as Freelancer).skills)
    ? computeFreelancerTrust(profile as Freelancer)
    : computeClientTrust(profile as AuthUser));

  const bars = [
    { label: "Profil to'ldirilishi", value: t.profileCompletion, color: "bg-primary" },
    { label: "Tasdiqlash", value: t.verificationProgress, color: "bg-success" },
    ...(t.portfolioStrength > 0 ? [{ label: "Portfolio kuchliligi", value: t.portfolioStrength, color: "bg-[oklch(0.78_0.15_75)]" }] : []),
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Ishonch balli</div>
          <div className="font-display mt-1 text-3xl font-bold">{t.trustScore}</div>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          {t.label}
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">{b.label}</span>
              <span className="font-mono font-medium">{b.value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary">
              <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrustScoreBadge({ score, label }: { score: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
      {score} ishonch{label ? ` · ${label}` : ""}
    </span>
  );
}
