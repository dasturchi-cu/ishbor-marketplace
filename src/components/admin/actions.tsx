import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { performAdminAction, type AuditCategory } from "@/lib/admin-store";
import { useAdmin } from "./admin-context";
import { cn } from "@/lib/utils";

export function AdminStatCard({
  label,
  value,
  trend,
  trendUp,
  icon: Icon,
}: {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{value}</div>
      {trend && (
        <div className={cn("font-mono mt-1 inline-flex items-center gap-1 text-[11px]", trendUp ? "text-success" : "text-muted-foreground")}>
          {trendUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />} {trend}
        </div>
      )}
    </div>
  );
}

export function AdminActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "default",
  action,
  target,
  category,
  successMessage,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  action: string;
  target: string;
  category: AuditCategory;
  successMessage?: string;
  onConfirm?: () => void;
}) {
  const { adminName } = useAdmin();
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    setLoading(true);
    performAdminAction({
      action,
      target,
      who: adminName,
      category,
      successMessage,
      onExecute: () => {
        onConfirm?.();
        onOpenChange(false);
      },
    });
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant={variant === "destructive" ? "destructive" : "default"} onClick={handleConfirm} disabled={loading}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useAdminActionDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: "default" | "destructive";
    action: string;
    target: string;
    category: AuditCategory;
    successMessage?: string;
    onConfirm?: () => void;
  } | null>(null);

  const dialog = state ? (
    <AdminActionDialog
      {...state}
      open={state.open}
      onOpenChange={(open) => !open && setState(null)}
    />
  ) : null;

  const confirm = (opts: Omit<NonNullable<typeof state>, "open">) => setState({ ...opts, open: true });

  return { dialog, confirm };
}
