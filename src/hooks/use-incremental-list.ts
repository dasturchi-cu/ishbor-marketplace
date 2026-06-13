import { useEffect, useMemo, useState } from "react";

export const MARKETPLACE_PAGE_SIZE = 24;
export const WORKSPACE_PAGE_SIZE = 30;

export function useIncrementalList<T>(
  items: T[],
  pageSize: number = MARKETPLACE_PAGE_SIZE,
  resetKey?: string | number,
) {
  const [limit, setLimit] = useState(pageSize);
  const resetDep = resetKey ?? items.length;

  useEffect(() => {
    setLimit(pageSize);
  }, [resetDep, pageSize]);

  const visible = useMemo(() => items.slice(0, limit), [items, limit]);
  const hasMore = items.length > limit;
  const loadMore = () => setLimit((current) => current + pageSize);

  return { visible, hasMore, loadMore, total: items.length, showing: visible.length };
}
