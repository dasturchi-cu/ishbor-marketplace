import type { AuthUser } from "@/lib/auth";
import { NextActionCard } from "@/components/ftue/next-action-card";
import { ProgressStrip } from "@/components/ux/progress-strip";
import { SmartWarningStack } from "@/components/ux/smart-warnings";

type WorkspaceGuidanceProps = {
  user: AuthUser;
  /** List sahifalarda header CTA bor bo'lsa, takroriy next action yashiriladi */
  hideNextAction?: boolean;
};

/** Standard workspace header block: next action + progress + gentle warnings. */
export function WorkspaceGuidance({ user, hideNextAction }: WorkspaceGuidanceProps) {
  return (
    <div className="mb-6 space-y-4">
      {!hideNextAction && <NextActionCard user={user} />}
      <ProgressStrip user={user} />
      <SmartWarningStack user={user} />
    </div>
  );
}
