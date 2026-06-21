import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  to?: string;
  params?: Record<string, string>;
};

export function PageBreadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "font-mono mb-4 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground",
        className,
      )}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3 opacity-50" aria-hidden />}
            {item.to && !isLast ? (
              <Link to={item.to} params={item.params} className="transition-default hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground" : undefined}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
