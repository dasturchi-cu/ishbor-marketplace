import type { ModerationFlag } from "./content-moderation";
import { enqueueModerationItem } from "./admin-data-store";

export function flagContentForReview(
  type: "service" | "project" | "review" | "portfolio" | "message",
  title: string,
  flags: ModerationFlag[],
): void {
  const notable = flags.filter((f) => f.severity !== "low");
  if (notable.length === 0) return;
  enqueueModerationItem({
    type: type === "message" ? "review" : type,
    title,
    reason: notable.map((f) => f.message).join("; "),
    reportedBy: "Avtomatik tizim",
  });
}
