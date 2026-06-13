import { Check, ShieldCheck } from "lucide-react";
import type { VerificationItem } from "@/lib/mock-data";

export function VerificationCenter({ items }: { items: VerificationItem[] }) {
  const verifiedCount = items.filter((v) => v.done).length;

  return (
    <div className="rounded-2xl border border-success/20 bg-success/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-success" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-success">
            Verification center
          </span>
        </div>
        <span className="font-mono text-xs font-semibold text-success">
          {verifiedCount}/{items.length} verified
        </span>
      </div>
      <ul className="space-y-3">
        {items.map((v) => (
          <li key={v.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`inline-flex size-6 items-center justify-center rounded-full ${v.done ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground"}`}
              >
                <Check className="size-3.5" />
              </div>
              <span className={`text-sm ${v.done ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {v.label}
              </span>
            </div>
            {v.verifiedAt && (
              <span className="font-mono text-[10px] text-muted-foreground">{v.verifiedAt}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
