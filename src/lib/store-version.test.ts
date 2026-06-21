import { beforeEach, describe, expect, it, vi } from "vitest";

import { bumpStoreVersion, getStoreVersion, STORE_KEYS } from "./store-version";

describe("store-version", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("increments monotonically", () => {
    const start = getStoreVersion(STORE_KEYS.revenue);
    bumpStoreVersion(STORE_KEYS.revenue);
    bumpStoreVersion(STORE_KEYS.revenue);
    expect(getStoreVersion(STORE_KEYS.revenue)).toBe(start + 2);
  });

  it("isolates keys", () => {
    const revenueBefore = getStoreVersion(STORE_KEYS.revenue);
    const creditsBefore = getStoreVersion(STORE_KEYS.credits);
    bumpStoreVersion(STORE_KEYS.credits);
    expect(getStoreVersion(STORE_KEYS.credits)).toBe(creditsBefore + 1);
    expect(getStoreVersion(STORE_KEYS.revenue)).toBe(revenueBefore);
  });
});
