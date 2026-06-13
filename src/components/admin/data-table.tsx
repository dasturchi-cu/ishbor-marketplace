import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/site/feedback";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function AdminDataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = "Search…",
  searchFilter,
  filters,
  bulkActions,
  emptyTitle = "No results",
  emptyDescription = "Try adjusting your filters or search query.",
  onRowClick,
}: {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  filters?: ReactNode;
  bulkActions?: (selected: T[]) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!query || !searchFilter) return data;
    return data.filter((row) => searchFilter(row, query.toLowerCase()));
  }, [data, query, searchFilter]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectedRows = filtered.filter((r) => selected.has(r.id));

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filters}
          {selected.size > 0 && bulkActions?.(selectedRows)}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} compact />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {bulkActions && (
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                </TableHead>
              )}
              {columns.map((c) => (
                <TableHead key={c.key} className={c.className}>{c.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow
                key={row.id}
                data-state={selected.has(row.id) ? "selected" : undefined}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={() => onRowClick?.(row)}
              >
                {bulkActions && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggle(row.id)} aria-label={`Select ${row.id}`} />
                  </TableCell>
                )}
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.className}>{c.cell(row)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        {filtered.length} of {data.length} records
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
    active: "success",
    approved: "success",
    completed: "success",
    released: "success",
    resolved: "success",
    closed: "secondary",
    healthy: "success",
    pending: "warning",
    in_progress: "default",
    review: "warning",
    suspended: "warning",
    degraded: "warning",
    disputed: "destructive",
    open: "destructive",
    banned: "destructive",
    rejected: "destructive",
    failed: "destructive",
    down: "destructive",
    cancelled: "secondary",
  };
  const variant = variants[status] ?? "outline";
  return (
    <span className={`font-mono inline-flex rounded-lg px-2 py-1 text-[10px] uppercase tracking-widest ${
      variant === "success" ? "bg-success/10 text-success" :
      variant === "warning" ? "bg-warning/10 text-warning" :
      variant === "destructive" ? "bg-destructive/10 text-destructive" :
      variant === "secondary" ? "bg-secondary text-muted-foreground" :
      "bg-primary/15 text-primary"
    }`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
