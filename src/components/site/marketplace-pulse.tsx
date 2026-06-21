import { useMemo, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { Star, Sparkles, Users, ArrowUpRight } from "lucide-react";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import { readStoredReviews } from "@/lib/reviews-store";
import { getStoredServices } from "@/lib/services-store";
import { freelancers } from "@/lib/mock-data";
import { GradientAvatar } from "./avatar";

function subscribeReviews() {
  return () => {};
}

function getReviewCount() {
  return readStoredReviews().length;
}

export function MarketplacePulse() {
  const hydrated = useClientHydrated();
  const reviewCount = useSyncExternalStore(subscribeReviews, getReviewCount, () => 0);

  const recentReviews = useMemo(() => {
    if (!hydrated) return [];
    return readStoredReviews()
      .filter((r) => r.direction !== "freelancer_to_client")
      .slice(0, 4);
  }, [hydrated, reviewCount]);

  const newServices = useMemo(() => {
    if (!hydrated) return [];
    return getStoredServices()
      .filter((s) => s.status === "published")
      .slice(0, 3);
  }, [hydrated]);

  const activeFreelancers = useMemo(
    () => freelancers.filter((f) => f.available).slice(0, 4),
    [],
  );

  return (
    <section className="border-b border-border bg-surface/30 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="eyebrow mb-2">Bozor pulsatsiyasi</div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Hozir faol bozorda nima bo&apos;lyapti
            </h2>
          </div>
          <Link
            to="/freelancers"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Barcha mutaxassislar <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Star className="size-4 text-gold" />
              <h3 className="font-display text-sm font-semibold">So&apos;nggi sharhlar</h3>
            </div>
            {recentReviews.length > 0 ? (
              <ul className="space-y-3">
                {recentReviews.map((r) => (
                  <li key={r.id} className="rounded-lg border border-border bg-surface/50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-gold">{r.rating}★</span>
                      <span className="truncate text-xs text-muted-foreground">{r.from ?? "Mijoz"}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground/80">{r.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-3">
                {[
                  { rating: 5, name: "Sardor M.", text: "Tez va sifatli ishladi — eskrou jarayoni aniq edi." },
                  { rating: 5, name: "Elena P.", text: "Portfolio va javob tezligi ajoyib. Qayta yolladik." },
                ].map((r, i) => (
                  <li key={i} className="rounded-lg border border-border bg-surface/50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-gold">{r.rating}★</span>
                      <span className="text-xs text-muted-foreground">{r.name}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/80">{r.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="font-display text-sm font-semibold">Yangi xizmatlar</h3>
            </div>
            {newServices.length > 0 ? (
              <ul className="space-y-2">
                {newServices.map((s) => (
                  <li key={s.slug}>
                    <Link
                      to="/services/$slug"
                      params={{ slug: s.slug }}
                      className="block rounded-lg border border-border px-3 py-2.5 transition-default hover:border-primary/25 hover:bg-secondary/30"
                    >
                      <p className="truncate text-sm font-medium">{s.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.seller} · ${s.price}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Frilanserlar yangi xizmat paketlarini joylamoqda.{" "}
                <Link to="/services" className="font-medium text-primary hover:underline">
                  Katalogni ko&apos;ring
                </Link>
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-4 text-success" />
              <h3 className="font-display text-sm font-semibold">Hozir mavjud mutaxassislar</h3>
            </div>
            <ul className="space-y-2">
              {activeFreelancers.map((f) => (
                <li key={f.username}>
                  <Link
                    to="/freelancers/$username"
                    params={{ username: f.username }}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-default hover:border-primary/25 hover:bg-secondary/30"
                  >
                    <GradientAvatar name={f.name} hue={f.hue} size={32} rounded="rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{f.title}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success">
                      <span className="size-1.5 rounded-full bg-success animate-pulse-subtle" />
                      Mavjud
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
