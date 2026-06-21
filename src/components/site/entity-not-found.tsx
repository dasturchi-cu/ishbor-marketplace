import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";

type EntityNotFoundProps = {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
  compact?: boolean;
};

export function EntityNotFound({
  title,
  description = "Bu havola noto'g'ri yoki kontent o'chirilgan bo'lishi mumkin.",
  backTo = "/",
  backLabel = "Bosh sahifaga qaytish",
  compact = false,
}: EntityNotFoundProps) {
  const body = (
    <div className={`${compact ? "premium-empty-state p-8" : "premium-empty-state mx-auto max-w-md px-4 py-20"} text-center`}>
      {!compact && (
        <div className="premium-empty-icon mx-auto mb-5 inline-flex size-14 items-center justify-center rounded-2xl border border-border bg-primary/8 text-primary">
          <SearchX className="size-6" aria-hidden />
        </div>
      )}
      <h1 className="font-display text-xl font-bold sm:text-2xl">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <Link
        to={backTo}
        className="send-btn-ready mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        {backLabel}
      </Link>
    </div>
  );

  if (compact) return body;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      {body}
      <SiteFooter />
    </div>
  );
}
