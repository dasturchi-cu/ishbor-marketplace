import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const settingsInputClass =
  "w-full rounded-lg border border-border bg-secondary/25 px-3 py-2.5 text-sm text-foreground transition-default placeholder:text-muted-foreground/50 focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60";

function FieldLabel({ htmlFor, label, hint }: { htmlFor: string; label: string; hint?: string }) {
  return (
    <div className="space-y-0.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-foreground/85">
        {label}
      </label>
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

type SettingsFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
};

export const SettingsField = forwardRef<HTMLInputElement, SettingsFieldProps>(
  ({ label, error, hint, icon, className, id, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        <FieldLabel htmlFor={fieldId} label={label} hint={!error ? hint : undefined} />
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={fieldId}
            className={cn(
              settingsInputClass,
              icon && "pl-10",
              error && "border-destructive/50 focus:border-destructive/50 focus:ring-destructive/15",
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
SettingsField.displayName = "SettingsField";

export function SettingsTextarea({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string }) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={fieldId} label={label} hint={!error ? hint : undefined} />
      <textarea
        id={fieldId}
        className={cn(
          settingsInputClass,
          "min-h-[100px] resize-y",
          error && "border-destructive/50 focus:border-destructive/50 focus:ring-destructive/15",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function SettingsSelect({
  label,
  hint,
  children,
  className,
  id,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={fieldId} label={label} hint={hint} />
      <select id={fieldId} className={cn(settingsInputClass, className)} {...props}>
        {children}
      </select>
    </div>
  );
}
