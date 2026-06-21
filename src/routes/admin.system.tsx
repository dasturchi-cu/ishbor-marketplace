import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Database, Server } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { HealthIndicator } from "@/components/admin/activity-feed";
import { useAdminSearchOpen } from "@/components/admin/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getHealth } from "@/lib/api/health.functions";
import { getEmailOutbox } from "@/lib/email-lifecycle";
import { getFraudSummary } from "@/lib/fraud-prevention";
import { getApiMode } from "@/lib/api-mode";
import { ApiError, callServerFn, isOffline } from "@/lib/api-client";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import { computeMarketplaceHealth } from "@/lib/marketplace-health";

export const Route = createFileRoute("/admin/system")({
  head: () => ({ meta: [{ title: "Tizim holati — Ishbor Admin" }] }),
  component: AdminSystemPage,
});

const STATUS_LABELS = {
  healthy: { label: "Sog'lom", color: "text-success" },
  degraded: { label: "Pasaygan", color: "text-warning" },
  down: { label: "Ishlamayapti", color: "text-destructive" },
};

function AdminSystemPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const hydrated = useClientHydrated();
  const marketplaceHealth = hydrated ? computeMarketplaceHealth() : null;

  const { data: health, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-health"],
    queryFn: () => callServerFn(() => getHealth(), { label: "getHealth" }),
    refetchInterval: 30_000,
    enabled: hydrated,
  });

  const apiMode = getApiMode();
  const emailOutbox = hydrated ? getEmailOutbox() : [];
  const queuedEmails = emailOutbox.filter((e) => e.status === "queued").length;
  const fraudSummary = hydrated ? getFraudSummary() : null;
  const dbStatus =
    health?.database === "connected"
      ? "healthy"
      : health?.database === "error"
        ? "down"
        : "degraded";

  const systems = [
    {
      name: "API server",
      status: health?.status === "ok" ? ("healthy" as const) : ("degraded" as const),
      detail: health ? `v${health.version} · ${health.environment}` : "Yuklanmoqda…",
    },
    {
      name: "Ma'lumotlar bazasi",
      status: dbStatus as "healthy" | "degraded" | "down",
      detail:
        health?.database === "connected"
          ? "PostgreSQL ulangan"
          : health?.database === "unconfigured"
            ? "Demo rejim (localStorage)"
            : "Ulanish xatosi",
    },
    {
      name: "Bozor holati",
      status:
        marketplaceHealth && marketplaceHealth.liquidity >= 60
          ? ("healthy" as const)
          : marketplaceHealth && marketplaceHealth.liquidity >= 30
            ? ("degraded" as const)
            : ("degraded" as const),
      detail: marketplaceHealth
        ? `Likvidlik: ${marketplaceHealth.liquidity}/100 · ${marketplaceHealth.activeListings} faol e'lon`
        : "Hisoblanmoqda…",
    },
    {
      name: "Analitika",
      status: "healthy" as const,
      detail: "localStorage · brauzer ichida",
    },
    {
      name: "To'lov integratsiyasi",
      status: "degraded" as const,
      detail: "Demo rejim — Click/Payme/Stripe faol emas",
    },
    {
      name: "Email outbox",
      status: (health?.email === "configured" ? "healthy" : "degraded") as "healthy" | "degraded",
      detail:
        health?.email === "configured"
          ? `Resend ulangan · navbatda ${queuedEmails}`
          : `Demo outbox · navbatda ${queuedEmails}`,
    },
    {
      name: "Monitoring",
      status: (health?.observability === "configured" ? "healthy" : "degraded") as "healthy" | "degraded",
      detail:
        health?.observability === "configured"
          ? "Sentry + Prometheus metrics endpoint faol"
          : "Demo rejim — SENTRY_DSN va /metrics tayyor",
    },
    {
      name: "Fraud himoya",
      status: "healthy" as const,
      detail: fraudSummary
        ? `Referral ${fraudSummary.referralAppliesToday}/kun · shubhali sharh ${fraudSummary.suspiciousReviewFlags}`
        : "Hisoblanmoqda…",
    },
  ];

  return (
    <AdminShell eyebrow="Tizim holati" title="Tizim holati" onSearchOpen={onSearchOpen}>
      {error instanceof ApiError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {systems.map((s) => (
          <Card key={s.name}>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{s.name}</CardTitle>
              <HealthIndicator status={s.status} />
            </CardHeader>
            <CardContent>
              <div className={cn("font-display text-lg font-bold", STATUS_LABELS[s.status].color)}>
                {STATUS_LABELS[s.status].label}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{s.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader><CardTitle className="text-base">Umumiy platforma holati</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <HealthIndicator status={health?.status === "ok" ? "healthy" : "degraded"} />
            <div>
              <div className="font-display text-xl font-bold text-success">
                {isLoading ? "Tekshirilmoqda…" : health?.status === "ok" ? "Asosiy tizimlar ishlamoqda" : "Cheklangan rejim"}
              </div>
              <p className="text-sm text-muted-foreground">
                Rejim: {apiMode === "remote" ? "Remote API" : "Local demo (localStorage)"}.{" "}
                <Link to="/status" className="font-medium text-primary hover:underline">
                  Umumiy status sahifasi
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <button
        type="button"
        onClick={() => refetch()}
        disabled={isOffline()}
        className="mt-4 touch-target rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/30 disabled:opacity-50"
      >
        Yangilash
      </button>
    </AdminShell>
  );
}
