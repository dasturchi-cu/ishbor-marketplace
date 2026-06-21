import { type ReactNode, useSyncExternalStore } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { isOffline } from "@/lib/api-client";
import { InlineBanner, LoadingSpinner } from "@/components/site/feedback";
import { Button } from "@/components/ui/button";

type AsyncBoundaryProps = {
  loading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  children: ReactNode;
  loadingFallback?: ReactNode;
  showOfflineBanner?: boolean;
};

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

function useOnlineStatus() {
  return useSyncExternalStore(
    subscribeOnline,
    () => !isOffline(),
    () => true,
  );
}

export function AsyncBoundary({
  loading = false,
  error = null,
  onRetry,
  children,
  loadingFallback,
  showOfflineBanner = true,
}: AsyncBoundaryProps) {
  const online = useOnlineStatus();
  const message = error instanceof Error ? error.message : error;

  if (loading) {
    return (
      loadingFallback ?? (
        <div className="flex min-h-[200px] items-center justify-center gap-2 text-muted-foreground">
          <LoadingSpinner />
          <span>Yuklanmoqda…</span>
        </div>
      )
    );
  }

  if (message) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <InlineBanner variant="error" className="max-w-md">
          {message}
        </InlineBanner>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 size-4" />
            Qayta urinish
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {showOfflineBanner && !online && (
        <InlineBanner variant="warning" icon={WifiOff} className="mb-4">
          Internet aloqasi yo&apos;q. Ba&apos;zi amallar ishlamasligi mumkin.
        </InlineBanner>
      )}
      {children}
    </>
  );
}
