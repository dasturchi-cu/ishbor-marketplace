import { useSyncExternalStore } from "react";

import { getStoreVersion, type StoreVersionKey } from "@/lib/store-version";

/**
 * Subscribe to external store mutations with a stable numeric snapshot.
 * Replaces broken `useSyncExternalStore(subscribe, () => null)` pattern
 * that never triggers re-renders (Object.is(null, null) === true).
 */
export function useStoreVersion(
  key: StoreVersionKey,
  subscribe: (listener: () => void) => () => void,
): number {
  return useSyncExternalStore(
    subscribe,
    () => getStoreVersion(key),
    () => 0,
  );
}
