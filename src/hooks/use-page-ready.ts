import { useEffect, useState } from "react";

/** Brief skeleton phase for premium perceived loading on list pages. */
export function usePageReady(delayMs = 320) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);

  return ready;
}
