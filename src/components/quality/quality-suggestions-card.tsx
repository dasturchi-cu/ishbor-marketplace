import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import type { QualityIssue } from "@/lib/quality-engine";

export function QualitySuggestionsCard({ issues }: { issues: QualityIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <AlertCircle className="size-4 text-primary" />
        <h3 className="font-display font-semibold">Yaxshilash tavsiyalari</h3>
      </div>
      <div className="mt-4 space-y-3">
        {issues.slice(0, 4).map((issue) => (
          <div
            key={issue.id}
            className={`rounded-xl border p-4 ${
              issue.severity === "high"
                ? "border-destructive/20 bg-destructive/5"
                : issue.severity === "medium"
                  ? "border-warning/20 bg-warning/5"
                  : "border-border bg-secondary/20"
            }`}
          >
            <div className="font-medium text-sm">{issue.title}</div>
            <p className="mt-1 text-xs text-muted-foreground">{issue.description}</p>
            <Link to={issue.href} className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
              {issue.action} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
