import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { getFeaturedCost, getFeaturedDurationDays, purchaseFeaturedListing, isFeaturedActive, type FeaturedTarget } from "@/lib/featured-store";
import { getCreditBalance } from "@/lib/credits-store";
import { getFeaturedDiscount, getPlan } from "@/lib/subscription-store";
import { useAuth } from "@/hooks/use-auth";

type FeaturedPurchaseCardProps = {
  target: FeaturedTarget | { type: "profile"; slug: string; title: string };
  featured?: boolean;
  featuredUntil?: string;
  onSuccess?: () => void;
};

export function FeaturedPurchaseCard({ target, featured, featuredUntil, onSuccess }: FeaturedPurchaseCardProps) {
  const { user } = useAuth();
  const cost = getFeaturedCost(user?.id);
  const days = getFeaturedDurationDays();
  const balance = user ? getCreditBalance(user.id) : 0;
  const discount = user ? getFeaturedDiscount(user.id) : 0;
  const plan = user ? getPlan(user.id) : null;
  const active = isFeaturedActive(featured, featuredUntil);

  const handlePurchase = () => {
    if (!user) {
      toast.error("Tizimga kiring");
      return;
    }
    if (target.type === "profile") {
      const result = purchaseFeaturedListing({ type: "profile", slug: user.username ?? user.id, title: user.fullName });
      if (result.ok) { toast.success(`Profil ajratilgan — ${days} kun`); onSuccess?.(); }
      else toast.error(result.error);
      return;
    }
    const result = purchaseFeaturedListing(target);
    if (result.ok) {
      toast.success(`Ajratilgan ro'yxat faollashdi — ${days} kun`);
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Ajratilgan</div>
          <div className="mt-1 text-sm font-semibold">
            {active ? `Ajratilgan faol — ${days} kun` : "Ajratib ko'rsatish"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Narxi: {cost.toLocaleString()} UZS kredit
            {discount > 0 && ` (${Math.round(discount * 100)}% ${plan?.name} chegirma)`}
            {" · "}Qolgan: {balance.toLocaleString()} UZS
          </p>
        </div>
      </div>
      {!active && (
        <button
          type="button"
          onClick={handlePurchase}
          className="mt-3 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Ajratilgan ro'yxat sotib olish ({days} kun)
        </button>
      )}
    </div>
  );
}
