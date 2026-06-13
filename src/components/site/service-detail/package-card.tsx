import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ArrowRight, Heart, Share2, MessageSquare } from "lucide-react";
import { EscrowShield } from "@/components/site/trust";
import type { ServicePackage } from "@/lib/mock-data";

export function PackageCard({
  packages,
  serviceSlug,
  queuePosition,
}: {
  packages: ServicePackage[];
  serviceSlug: string;
  queuePosition: number;
}) {
  const popularIndex = packages.findIndex((p) => p.popular);
  const [selected, setSelected] = useState(popularIndex >= 0 ? popularIndex : 0);
  const pkg = packages[selected]!;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_40px_-12px_oklch(0.546_0.185_257/0.12)]">
      <div className="grid grid-cols-3 border-b border-border bg-elevated/40 text-xs">
        {packages.map((p, i) => (
          <button
            key={p.tier}
            type="button"
            onClick={() => setSelected(i)}
            className={`relative py-3 font-mono uppercase tracking-widest transition-default focus-ring ${
              selected === i
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
            }`}
          >
            {p.tier}
            {p.popular && selected !== i && (
              <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4 p-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="eyebrow">{pkg.tier} package</div>
            {pkg.popular && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-primary">
                Most popular
              </span>
            )}
          </div>
          <div className="font-display mt-1 text-4xl font-bold tracking-tight">
            ${pkg.price.toLocaleString()}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{pkg.description}</p>

        <ul className="space-y-2 text-sm">
          {pkg.features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
          <div>
            <div className="font-mono uppercase tracking-widest text-muted-foreground">Delivery</div>
            <div className="mt-0.5 text-sm font-semibold">{pkg.delivery}</div>
          </div>
          <div>
            <div className="font-mono uppercase tracking-widest text-muted-foreground">Revisions</div>
            <div className="mt-0.5 text-sm font-semibold">{pkg.revisions}</div>
          </div>
        </div>

        <Link
          to="/checkout"
          search={{
            type: "service" as const,
            service: serviceSlug,
            package: pkg.tier.toLowerCase() as "essential" | "premium" | "enterprise",
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring"
        >
          Continue (${pkg.price.toLocaleString()}) <ArrowRight className="size-4" />
        </Link>

        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface py-3 text-sm font-semibold transition-default hover:border-primary/20 focus-ring"
        >
          <MessageSquare className="size-4" /> Contact seller
        </button>

        <div className="flex items-center justify-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <button type="button" className="inline-flex items-center gap-1 transition-default hover:text-foreground">
            <Heart className="size-3.5" /> Save
          </button>
          <button type="button" className="inline-flex items-center gap-1 transition-default hover:text-foreground">
            <Share2 className="size-3.5" /> Share
          </button>
        </div>
      </div>

      <div className="border-t border-border bg-primary/5 px-6 py-4">
        <div className="mb-2 flex items-center gap-2">
          <EscrowShield size="sm" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Payment held in escrow until you approve delivery. {queuePosition} orders ahead in queue.
        </p>
      </div>
    </div>
  );
}

export function PackageComparison({ packages }: { packages: ServicePackage[] }) {
  const allFeatures = [...new Set(packages.flatMap((p) => p.features))];

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[540px] text-sm">
        <thead>
          <tr className="border-b border-border bg-elevated/40">
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Compare packages
            </th>
            {packages.map((p) => (
              <th key={p.tier} className="px-4 py-3 text-center">
                <div className="font-display font-bold">{p.tier}</div>
                <div className="font-mono text-xs text-primary">${p.price.toLocaleString()}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="px-4 py-3 text-muted-foreground">Delivery</td>
            {packages.map((p) => (
              <td key={p.tier} className="px-4 py-3 text-center font-medium">{p.delivery}</td>
            ))}
          </tr>
          <tr className="border-b border-border">
            <td className="px-4 py-3 text-muted-foreground">Revisions</td>
            {packages.map((p) => (
              <td key={p.tier} className="px-4 py-3 text-center font-medium">{p.revisions}</td>
            ))}
          </tr>
          {allFeatures.map((feature) => (
            <tr key={feature} className="border-b border-border last:border-0">
              <td className="px-4 py-3 text-muted-foreground">{feature}</td>
              {packages.map((p) => (
                <td key={p.tier} className="px-4 py-3 text-center">
                  {p.features.includes(feature) ? (
                    <Check className="mx-auto size-4 text-primary" />
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
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
