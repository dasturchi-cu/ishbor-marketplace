import { Check, AlertCircle } from "lucide-react";
import type { SaveState } from "@/lib/settings-store";
import { LoadingSpinner } from "@/components/site/feedback";

export function SettingsSaveBar({
  saveState,
  dirty,
  autoSave,
  onAutoSaveChange,
  onSave,
  onDiscard,
  errorMessage,
}: {
  saveState: SaveState;
  dirty: boolean;
  autoSave: boolean;
  onAutoSaveChange: (v: boolean) => void;
  onSave: () => void;
  onDiscard?: () => void;
  errorMessage?: string;
}) {
  if (!dirty && saveState === "idle") return null;

  return (
    <div className="liquid-glass fixed inset-x-0 bottom-[4.5rem] z-[60] border-t border-primary/15 px-4 py-3 shadow-[0_-8px_32px_-12px_rgba(0,0,0,0.35)] lg:sticky lg:bottom-0 lg:z-50 lg:rounded-t-2xl">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          {saveState === "saving" && (
            <>
              <LoadingSpinner size="sm" />
              <span className="text-muted-foreground">Saqlanmoqda…</span>
            </>
          )}
          {saveState === "saved" && (
            <>
              <Check className="size-4 text-success" />
              <span className="text-success">Saqlandi</span>
            </>
          )}
          {saveState === "error" && (
            <>
              <AlertCircle className="size-4 text-destructive" />
              <span className="text-destructive">{errorMessage ?? "Saqlashda xato"}</span>
            </>
          )}
          {saveState === "dirty" && dirty && (
            <span className="text-muted-foreground">Saqlanmagan o'zgarishlar mavjud</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {onDiscard && dirty && saveState !== "saving" && (
            <button
              type="button"
              onClick={onDiscard}
              className="touch-target rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-default hover:border-destructive/30 hover:text-destructive"
            >
              Bekor qilish
            </button>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => onAutoSaveChange(e.target.checked)}
              className="size-4 rounded border-border"
            />
            Avtomatik saqlash
          </label>
          <button
            type="button"
            onClick={onSave}
            disabled={saveState === "saving" || !dirty}
            className="touch-target rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[0_4px_14px_-4px_oklch(0.546_0.185_257/0.4)] transition-default hover:opacity-90 disabled:opacity-50"
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
