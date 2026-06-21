import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Database, Server } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { LoadingSpinner } from "@/components/site/feedback";
import { getHealth } from "@/lib/api/health.functions";
import { getApiMode } from "@/lib/api-mode";
import { ApiError, callServerFn, isOffline } from "@/lib/api-client";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Tizim holati — Ishbor" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatusPage,
});

function StatusPage() {
  const { data, isLoading, error, refetch, dataUpdatedAt, isFetching } = useQuery({
    queryKey: ["health"],
    queryFn: () => callServerFn(() => getHealth(), { label: "getHealth" }),
    refetchInterval: 30_000,
    retry: 2,
  });

  const offline = isOffline();
  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error
        ? "Health check yuklanmadi."
        : null;

  const apiMode = getApiMode();

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Tizim holati</h1>
            <p className="text-sm text-muted-foreground">Ishbor platformasi monitoring</p>
          </div>
        </div>

        {offline && (
          <div className="mt-6 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            Internet aloqasi yo&apos;q. Ma&apos;lumotlar yangilanmaydi.
          </div>
        )}

        {isLoading && !data ? (
          <div className="mt-10 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : errorMessage ? (
          <div className="mt-8 space-y-3">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {errorMessage}
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching || offline}
              className="touch-target rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/30 disabled:opacity-50"
            >
              {isFetching ? "Yuklanmoqda…" : "Qayta urinish"}
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <StatusRow
              icon={Server}
              label="API"
              value={data?.status === "ok" ? "Ishlayapti" : "Cheklangan"}
              detail={`Versiya ${data?.version ?? "—"} · ${data?.environment ?? "—"}`}
              ok={data?.status === "ok"}
            />
            <StatusRow
              icon={Database}
              label="Ma'lumotlar bazasi"
              value={
                data?.database === "connected"
                  ? "Ulangan"
                  : data?.database === "unconfigured"
                    ? "Demo rejim (localStorage)"
                    : "Xatolik"
              }
              detail={apiMode === "remote" ? "Remote API rejimi" : "Local demo rejimi"}
              ok={data?.database !== "error"}
            />
            <p className="font-mono text-xs text-muted-foreground">
              Oxirgi tekshiruv: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleString("uz-UZ") : "—"}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => refetch()}
          className="mt-6 touch-target rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/30"
        >
          Yangilash
        </button>
      </div>
      <SiteFooter />
    </div>
  );
}

function StatusRow({
  icon: Icon,
  label,
  value,
  detail,
  ok,
}: {
  icon: typeof Server;
  label: string;
  value: string;
  detail: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
      <div className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${ok ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-lg font-semibold">{value}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
