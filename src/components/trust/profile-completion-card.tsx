import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import type { ProfileCompletionItem } from "@/lib/profile-store";

export function ProfileCompletionCard({
  percent,
  items,
}: {
  percent: number;
  items: ProfileCompletionItem[];
}) {
  const incomplete = items.filter((i) => !i.done);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-primary/5 px-4 py-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground">Profil holati</div>
            <div className="font-display mt-1 text-3xl font-bold">{percent}%</div>
          </div>
          {percent < 100 && (
            <span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[11px] font-semibold text-warning">
              {incomplete.length} qadam
            </span>
          )}
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <ul className="max-h-56 space-y-0.5 overflow-y-auto p-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={item.href}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-default hover:bg-secondary/60"
            >
              {item.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground/50" />
              )}
              <span className={item.done ? "text-muted-foreground line-through" : "font-medium"}>
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {percent < 100 && incomplete[0] && (
        <div className="border-t border-border p-3">
          <Link
            to={incomplete[0].href}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90"
          >
            Keyingi: {incomplete[0].label}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
