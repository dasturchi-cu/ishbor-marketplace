export function IncrementalListFooter({
  hasMore,
  showing,
  total,
  onLoadMore,
  className = "",
}: {
  hasMore: boolean;
  showing: number;
  total: number;
  onLoadMore: () => void;
  className?: string;
}) {
  if (total === 0) return null;

  return (
    <div className={`mt-8 flex flex-col items-center gap-3 ${className}`}>
      <p className="text-xs text-muted-foreground">
        {showing} / {total} ko&apos;rsatilmoqda
      </p>
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          className="touch-target rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-default hover:border-primary/30 hover:text-primary focus-ring"
        >
          Ko&apos;proq ko&apos;rsatish
        </button>
      )}
    </div>
  );
}
