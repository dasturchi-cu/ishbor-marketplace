import type { AuthUser } from "@/lib/auth";
import { NextActionCard } from "@/components/ftue/next-action-card";
import { ProgressStrip } from "@/components/ux/progress-strip";
import { SmartWarningStack } from "@/components/ux/smart-warnings";

type WorkspaceGuidanceProps = {
  user: AuthUser;
  /** List sahifalarda header CTA bor bo'lsa, takroriy next action yashiriladi */
  hideNextAction?: boolean;
  /** Dashboard: faqat keyingi qadam + bitta ogohlantirish */
  variant?: "default" | "compact";
};

/** Standard workspace header block: next action + progress + gentle warnings. */
export function WorkspaceGuidance({ user, hideNextAction, variant = "compact" }: WorkspaceGuidanceProps) {
  if (variant === "compact") {
    return (
      <div className="mb-6 space-y-3">
        {!hideNextAction && <NextActionCard user={user} />}
        <SmartWarningStack user={user} limit={1} />
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-4">
      {!hideNextAction && <NextActionCard user={user} />}
      <ProgressStrip user={user} />
      <SmartWarningStack user={user} />
    </div>
  );
}
