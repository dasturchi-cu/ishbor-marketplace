import { useEffect, useState } from "react";

/** True after first client paint — avoids SSR/hydration auth false negatives. */
export function useClientHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
