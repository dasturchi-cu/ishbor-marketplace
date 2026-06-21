import { recordAnalyticsEvent } from "./analytics-events-store";

export type ShareEntity = "profile" | "service" | "portfolio" | "project";
export type ShareMethod = "web_share" | "clipboard";

const EVENT_MAP: Record<ShareEntity, "profile_share" | "service_share" | "portfolio_share" | "project_share"> = {
  profile: "profile_share",
  service: "service_share",
  portfolio: "portfolio_share",
  project: "project_share",
};

export function buildShareUrl(
  path: string,
  entity: ShareEntity,
  entityId: string,
  source = "share",
): string {
  if (typeof window === "undefined") return path;
  const url = new URL(path, window.location.origin);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", `${entity}_share`);
  url.searchParams.set("utm_content", entityId);
  return url.toString();
}

export function recordShareEvent(
  entity: ShareEntity,
  entityId: string,
  method: ShareMethod,
  meta?: Record<string, string>,
): void {
  recordAnalyticsEvent({
    type: EVENT_MAP[entity],
    entityId,
    meta: {
      method,
      channel: method === "web_share" ? "native_share" : "clipboard",
      ...meta,
    },
  });
}

export async function shareEntity(options: {
  entity: ShareEntity;
  entityId: string;
  title: string;
  url: string;
  onCopied?: () => void;
}): Promise<void> {
  const { entity, entityId, title, onCopied } = options;
  const shareUrl = buildShareUrl(options.url, entity, entityId);

  if (typeof navigator !== "undefined" && navigator.share) {
    await navigator.share({ title, url: shareUrl });
    recordShareEvent(entity, entityId, "web_share", { utm: "1" });
    return;
  }
  await navigator.clipboard.writeText(shareUrl);
  recordShareEvent(entity, entityId, "clipboard", { utm: "1" });
  onCopied?.();
}
