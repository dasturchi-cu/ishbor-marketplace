import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { sortLabels, type SortOption } from "@/lib/marketplace";

type Chip = { key: string; label: string; count?: number };

type Props = {
  placeholder: string;
  q: string;
  sort: SortOption;
  activeFilter?: string;
  activeCategory?: string;
  chips?: Chip[];
  categories?: Chip[];
  resultCount: number;
  resultLabel: string;
  onSearchChange: (patch: { q?: string; sort?: SortOption; filter?: string; category?: string }) => void;
};

export function MarketplaceToolbar({
  placeholder,
  q,
  sort,
  activeFilter = "",
  activeCategory = "",
  chips = [],
  categories = [],
  resultCount,
  resultLabel,
  onSearchChange,
}: Props) {
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const hasFilters = !!(q || activeFilter || activeCategory);

  const clearAll = () => {
    onSearchChange({ q: "", filter: "", category: "", sort: "newest" });
    setShowSort(false);
    setShowFilters(false);
  };

  return (
    <>
      <div className="mt-6 flex flex-col gap-2 sm:mt-8 sm:gap-3">
        <div className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 focus-ring">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => onSearchChange({ q: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            placeholder={placeholder}
            className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          {q && (
            <button
              onClick={() => onSearchChange({ q: "" })}
              className="touch-target text-muted-foreground hover:text-foreground"
              aria-label="Qidiruvni tozalash"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`touch-target inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-default focus-ring ${
              activeFilter ? "border-primary bg-primary/8 text-primary" : "border-border bg-surface hover:border-primary/20"
            }`}
          >
            <SlidersHorizontal className="size-4" /> Filtrlar
          </button>
          <div className="relative flex-1">
            <button
              onClick={() => setShowSort(!showSort)}
              className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium transition-default hover:border-primary/20 focus-ring"
            >
              {sortLabels[sort]} <ChevronDown className="size-4" />
            </button>
            {showSort && (
              <div className="absolute right-0 z-20 mt-1 w-full min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-lg">
                {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      onSearchChange({ sort: key });
                      setShowSort(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm transition-default hover:bg-secondary/50 ${
                      sort === key ? "font-semibold text-primary" : "text-foreground"
                    }`}
                  >
                    {sortLabels[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFilters && chips.length > 0 && (
        <div className="mt-3 rounded-lg border border-border bg-surface p-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tez filtrlar</div>
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c.key}
                onClick={() => onSearchChange({ filter: activeFilter === c.key ? "" : c.key })}
                className={`touch-target rounded-lg border px-3 text-xs font-medium transition-default ${
                  activeFilter === c.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground/80 hover:border-primary/20"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="mobile-scroll-x -mx-1 mt-4 flex gap-2 px-1 sm:flex-wrap sm:px-0">
          <button
            onClick={() => onSearchChange({ category: "" })}
            className={`touch-target shrink-0 rounded-lg border px-3 text-xs font-medium transition-default ${
              !activeCategory
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground/80 hover:border-primary/20"
            }`}
          >
            Barchasi
          </button>
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => onSearchChange({ category: activeCategory === c.key ? "" : c.key })}
              className={`touch-target shrink-0 rounded-lg border px-3 text-xs font-medium transition-default ${
                activeCategory === c.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground/80 hover:border-primary/20"
              }`}
            >
              {c.label}
              {c.count != null && <span className="ml-1.5 opacity-70">{c.count}</span>}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-mono text-foreground">{resultCount}</span> {resultLabel}
        </p>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-medium text-primary hover:underline"
          >
            Filtrlarni tozalash
          </button>
        )}
      </div>
    </>
  );
}

export function useMarketplaceSearch<T extends Record<string, string | undefined>>(
  search: T,
  basePath: "/services" | "/freelancers" | "/projects",
) {
  const navigate = useNavigate();
  return (patch: Partial<T>) => {
    navigate({
      to: basePath,
      search: { ...search, ...patch },
      replace: true,
    });
  };
}
