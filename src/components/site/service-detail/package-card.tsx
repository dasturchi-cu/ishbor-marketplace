import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ArrowRight, Heart, Share2, MessageSquare } from "lucide-react";
import { EscrowShield } from "@/components/site/trust";
import { ClientCheckoutLink } from "@/components/checkout/client-checkout-link";
import type { ServicePackage } from "@/lib/mock-data";
import { formatPackageTier } from "@/lib/project-validation";
import { useSaved } from "@/hooks/use-saved";

export function PackageCard({
  packages,
  serviceSlug,
  queuePosition,
}: {
  packages: ServicePackage[];
  serviceSlug: string;
  sellerUsername?: string;
  queuePosition: number;
}) {
  const navigate = useNavigate();
  const popularIndex = packages.findIndex((p) => p.popular);
  const [selected, setSelected] = useState(popularIndex >= 0 ? popularIndex : 0);
  const { saved, toggle } = useSaved("service", serviceSlug);
  const pkg = packages[selected]!;

  const handleShare = async () => {
    const url = `${window.location.origin}/services/${serviceSlug}`;
    if (navigator.share) {
      await navigator.share({ title: formatPackageTier(pkg.tier), url });
      return;
    }
    await navigator.clipboard.writeText(url);
    const { toast } = await import("sonner");
    toast.success("Havola nusxalandi");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-[0_20px_60px_-24px_oklch(0.546_0.185_257/0.22)]">
      <div className="grid grid-cols-3 border-b border-border bg-secondary/40">
        {packages.map((p, i) => (
          <button
            key={p.tier}
            type="button"
            onClick={() => setSelected(i)}
            className={`relative py-3.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-default focus-ring sm:text-[11px] ${
              selected === i
                ? "bg-primary text-primary-foreground shadow-[inset_0_-2px_0_oklch(0.48_0.17_257)]"
                : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
            }`}
          >
            {formatPackageTier(p.tier)}
            {p.popular && selected !== i && (
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="border-b border-primary/10 bg-gradient-to-b from-primary/[0.07] to-transparent px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">
          {pkg.popular && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-primary-foreground">
              Eng mashhur
            </span>
          )}
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {formatPackageTier(pkg.tier)} paketi
          </span>
        </div>
        <div className="font-display mt-2 text-4xl font-bold tracking-tight">
          ${pkg.price.toLocaleString()}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pkg.description}</p>
      </div>

      <div className="space-y-4 p-6">
        <ul className="space-y-2.5 text-sm">
          {pkg.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="size-3 text-primary" strokeWidth={2.5} />
              </span>
              <span className="text-foreground/90">{f}</span>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-secondary/25 p-4 text-xs">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Yetkazish</div>
            <div className="mt-1 text-sm font-semibold">{pkg.delivery}</div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Tuzatishlar</div>
            <div className="mt-1 text-sm font-semibold">{pkg.revisions}</div>
          </div>
        </div>

        <ClientCheckoutLink
          search={{
            type: "service" as const,
            service: serviceSlug,
            package: pkg.tier.toLowerCase() as "essential" | "premium" | "enterprise",
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_28px_-10px_oklch(0.546_0.185_257/0.45)] transition-default hover:opacity-95 active:scale-[0.98] focus-ring"
        >
          Davom etish (${pkg.price.toLocaleString()}) <ArrowRight className="size-4" />
        </ClientCheckoutLink>

        <button
          type="button"
          onClick={() => navigate({ to: "/messages" })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-semibold transition-default hover:border-primary/25 focus-ring"
        >
          <MessageSquare className="size-4" /> Sotuvchi bilan bog'lanish
        </button>

        <div className="flex items-center justify-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={toggle}
            className={`inline-flex items-center gap-1 transition-default hover:text-foreground ${saved ? "text-primary" : ""}`}
          >
            <Heart className={`size-3.5 ${saved ? "fill-primary" : ""}`} /> Saqlash
          </button>
          <button type="button" onClick={handleShare} className="inline-flex items-center gap-1 transition-default hover:text-foreground">
            <Share2 className="size-3.5" /> Ulashish
          </button>
        </div>
      </div>

      <div className="border-t border-primary/10 bg-gradient-to-br from-primary/[0.06] to-transparent px-6 py-4">
        <EscrowShield size="sm" />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          To'lov topshirishni tasdiqlaguningizcha eskrouda saqlanadi. Navbatda oldinda {queuePosition} ta buyurtma.
        </p>
      </div>
    </div>
  );
}

export function PackageComparison({
  packages,
  serviceSlug,
}: {
  packages: ServicePackage[];
  serviceSlug: string;
}) {
  const allFeatures = [...new Set(packages.flatMap((p) => p.features))];

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[0_8px_32px_-20px_oklch(0.546_0.185_257/0.1)]">
      <table className="w-full min-w-[620px] text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/30">
            <th className="px-5 py-5 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Paketlarni solishtirish
            </th>
            {packages.map((p) => (
              <th
                key={p.tier}
                className={`px-4 py-5 text-center ${p.popular ? "bg-primary/[0.04]" : ""}`}
              >
                <div className="font-display text-base font-bold">{formatPackageTier(p.tier)}</div>
                <div className="font-display mt-1 text-xl font-bold text-primary">
                  ${p.price.toLocaleString()}
                </div>
                {p.popular && (
                  <span className="mt-2 inline-block rounded-full bg-primary px-2.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-widest text-primary-foreground">
                    Mashhur
                  </span>
                )}
                <ClientCheckoutLink
                  search={{
                    type: "service" as const,
                    service: serviceSlug,
                    package: p.tier.toLowerCase() as "essential" | "premium" | "enterprise",
                  }}
                  className={`mt-3 inline-flex w-full max-w-[140px] items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition-default focus-ring ${
                    p.popular
                      ? "bg-primary text-primary-foreground hover:opacity-95"
                      : "border border-border bg-background hover:border-primary/25"
                  }`}
                >
                  Tanlash
                </ClientCheckoutLink>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="px-5 py-3.5 text-muted-foreground">Yetkazish</td>
            {packages.map((p) => (
              <td key={p.tier} className="px-5 py-3.5 text-center font-medium">{p.delivery}</td>
            ))}
          </tr>
          <tr className="border-b border-border">
            <td className="px-5 py-3.5 text-muted-foreground">Tuzatishlar</td>
            {packages.map((p) => (
              <td key={p.tier} className="px-5 py-3.5 text-center font-medium">{p.revisions}</td>
            ))}
          </tr>
          {allFeatures.map((feature) => (
            <tr key={feature} className="border-b border-border last:border-0 even:bg-secondary/15">
              <td className="px-5 py-3.5 text-muted-foreground">{feature}</td>
              {packages.map((p) => (
                <td key={p.tier} className="px-5 py-3.5 text-center">
                  {p.features.includes(feature) ? (
                    <Check className="mx-auto size-4 text-primary" />
                  ) : (
                    <span className="text-muted-foreground/35">-</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
