import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/site/feedback";

/** UX standart: sarlavha + tushuntirish + 1 ta primary CTA (benefit/secondary yo'q). */
export function StandardEmptyState({
  icon,
  title,
  description,
  action,
  compact,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={action}
      compact={compact}
      className={className}
    />
  );
}
