import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Sparkles, TrendingUp, Eye, Zap } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireRole } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import {
  getFeaturedCost,
  getFeaturedDurationDays,
  purchaseFeaturedListing,
  isFeaturedActive,
  isProfileFeatured,
} from "@/lib/featured-store";
import { getCreditBalance, subscribeCredits, purchaseCredits } from "@/lib/credits-store";
import { getFeaturedPerformance } from "@/lib/featured-listings-store";
import { getStoredServices } from "@/lib/services-store";
import { getMyPortfolios } from "@/lib/portfolio-store";
import { getStoredProjects } from "@/lib/projects-store";
import { getVisibilityFunnel } from "@/lib/visibility-store";
import { getFeaturedDiscount, getPlan } from "@/lib/subscription-store";
import { UpsellBanner } from "@/components/monetization/upsell-banner";

export const Route = createFileRoute("/promotions")({
  beforeLoad: requireRole(["freelancer"]),
  head: () => ({ meta: [{ title: "Promotsiya markazi — Ishbor" }] }),
  component: () => (
    <ProtectedGate roles={["freelancer"]}>
      <PromotionsPage />
    </ProtectedGate>
  ),
});

const CREDIT_PACKS = [
  { credits: 100000, price: 100000, label: "100K kredit" },
  { credits: 250000, price: 225000, label: "250K kredit" },
  { credits: 500000, price: 400000, label: "500K kredit" },
];

function PromotionsPage() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);

  useSyncExternalStore(subscribeCredits, () => (user ? getCreditBalance(user.id) : 0) + refresh, () => 0);

  if (!user) return null;

  const balance = getCreditBalance(user.id);
  const baseCost = getFeaturedCost(user.id);
  const days = getFeaturedDurationDays();
  const discount = getFeaturedDiscount(user.id);
  const performance = getFeaturedPerformance(user.id, 30);
  const plan = getPlan(user.id);

  const services = getStoredServices().filter((s) => s.ownerUserId === user.id && s.status === "published");
  const portfolios = getMyPortfolios(user.id).filter((p) => p.status === "published");
  const projects = getStoredProjects().filter((p) => p.ownerUserId === user.id && p.status === "published");
  const profileFeatured = isProfileFeatured(user.id);

  const handleBoost = (target: Parameters<typeof purchaseFeaturedListing>[0]) => {
    const result = purchaseFeaturedListing(target);
    if (result.ok) {
      toast.success(`Ajratilgan ro'yxat faollashdi — ${days} kun`);
      setRefresh((r) => r + 1);
    } else {
      toast.error(result.error);
    }
  };

  const handleBuyCredits = (credits: number, price: number) => {
    const result = purchaseCredits(user.id, credits, price);
    if (result.ok) {
      toast.success(`${credits.toLocaleString()} UZS kredit qo'shildi`);
      setRefresh((r) => r + 1);
    } else {
      toast.error(result.error);
    }
  };

  const estimatedViews = (type: string) => {
    const base = type === "profile" ? 45 : type === "service" ? 30 : 25;
    const boost = plan.priorityRanking ? 15 : plan.featuredProfile ? 8 : 0;
    return base + boost;
  };

  return (
    <WorkspaceShell
      eyebrow="O'sish"
      title="Promotsiya markazi"
      actions={
        <Link to="/subscription" search={{ plan: undefined }} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/20">
          Obuna · {balance.toLocaleString()} UZS
        </Link>
      }
    >
      <UpsellBanner context="promotions" />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Sparkles} label="Ajratilgan xaridlar" value={String(performance.totalListings)} sub={`${performance.activeListings} faol`} />
        <StatCard icon={TrendingUp} label="Kredit sarflangan" value={`${performance.creditsSpent.toLocaleString()} UZS`} sub="30 kun" />
        <StatCard icon={Eye} label="Balans" value={`${balance.toLocaleString()} UZS`} sub={discount > 0 ? `${Math.round(discount * 100)}% chegirma` : "Ajratilgan ro'yxat uchun"} />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Kredit sotib olish</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.credits}
              type="button"
              onClick={() => handleBuyCredits(pack.credits, pack.price)}
              className="rounded-xl border border-border bg-card p-4 text-left transition-default hover:border-primary/30"
            >
              <div className="font-semibold">{pack.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{pack.price.toLocaleString()} UZS</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Boost va ajratilgan ro'yxat</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Narxi: {baseCost.toLocaleString()} UZS · {days} kun · taxminiy +{estimatedViews("service")}% ko'rinish
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <BoostCard
            title="Profil boost"
            description="Profil qidiruvda ustun turadi"
            active={profileFeatured}
            cost={baseCost}
            days={days}
            visibility={`+${estimatedViews("profile")}%`}
            onBoost={() => handleBoost({ type: "profile", slug: user.username ?? user.id, title: user.fullName })}
          />

          {services.map((s) => {
            const funnel = getVisibilityFunnel("service", s.slug, 30);
            return (
              <BoostCard
                key={s.slug}
                title={s.title}
                description="Xizmat"
                active={isFeaturedActive(s.featured, s.featuredUntil)}
                cost={baseCost}
                days={days}
                visibility={`${funnel.views} ko'rish · +${estimatedViews("service")}%`}
                onBoost={() => handleBoost({ type: "service", slug: s.slug, title: s.title })}
              />
            );
          })}

          {portfolios.map((p) => {
            const funnel = getVisibilityFunnel("portfolio", p.slug, 30);
            return (
              <BoostCard
                key={p.slug}
                title={p.title}
                description="Portfolio"
                active={isFeaturedActive(p.featured, p.featuredUntil)}
                cost={baseCost}
                days={days}
                visibility={`${funnel.views} ko'rish · +${estimatedViews("portfolio")}%`}
                onBoost={() => handleBoost({ type: "portfolio", slug: p.slug, title: p.title })}
              />
            );
          })}

          {projects.map((p) => (
            <BoostCard
              key={p.slug}
              title={p.title}
              description="Loyiha"
              active={isFeaturedActive(p.featured, p.featuredUntil)}
              cost={baseCost}
              days={days}
              visibility={`+${estimatedViews("project")}%`}
              onBoost={() => handleBoost({ type: "project", slug: p.slug, title: p.title })}
            />
          ))}
        </div>

        {services.length === 0 && portfolios.length === 0 && projects.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Boost qilish uchun avval xizmat, portfolio yoki loyiha yarating.
          </p>
        )}
      </section>
    </WorkspaceShell>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Sparkles; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="size-4 text-primary" />
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display mt-1 text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function BoostCard({
  title,
  description,
  active,
  cost,
  days,
  visibility,
  onBoost,
}: {
  title: string;
  description: string;
  active: boolean;
  cost: number;
  days: number;
  visibility: string;
  onBoost: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{description}</div>
          <div className="mt-1 truncate font-semibold">{title}</div>
        </div>
        {active && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            Ajratilgan
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Zap className="size-3" /> {cost.toLocaleString()} UZS</span>
        <span className="inline-flex items-center gap-1"><Eye className="size-3" /> {visibility}</span>
        <span>{days} kun</span>
      </div>
      {!active && (
        <button
          type="button"
          onClick={onBoost}
          className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Ajratilgan ro'yxat sotib olish
        </button>
      )}
    </div>
  );
}
