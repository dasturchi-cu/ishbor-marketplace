/** Monotonic version counters for useSyncExternalStore re-render triggers. */
const versions = new Map<string, number>();

export const STORE_KEYS = {
  revenue: "revenue",
  subscriptions: "subscriptions",
  credits: "credits",
  analyticsEvents: "analytics-events",
  agencies: "agencies",
} as const;

export type StoreVersionKey = (typeof STORE_KEYS)[keyof typeof STORE_KEYS];

export function bumpStoreVersion(key: StoreVersionKey): void {
  versions.set(key, (versions.get(key) ?? 0) + 1);
}

export function getStoreVersion(key: StoreVersionKey): number {
  return versions.get(key) ?? 0;
}
