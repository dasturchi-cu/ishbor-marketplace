import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";
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
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Profil to'ldirilishi
          </div>
          <div className="font-display mt-1 text-3xl font-bold">{percent}%</div>
        </div>
        {percent < 100 && (
          <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
            {incomplete.length} ta qadam qoldi
          </span>
        )}
      </div>
      <div className="mt-4 h-2 rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      <ul className="mt-5 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={item.href}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-default hover:bg-secondary"
            >
              {item.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className={item.done ? "text-muted-foreground line-through" : "font-medium"}>
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {percent < 100 && incomplete[0] && (
        <Link
          to={incomplete[0].href}
          className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Keyingi qadam: {incomplete[0].label}
        </Link>
      )}
    </div>
  );
}
