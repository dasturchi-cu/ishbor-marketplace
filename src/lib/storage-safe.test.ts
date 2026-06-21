import { beforeEach, describe, expect, it, vi } from "vitest";

import { safeReadJson, safeWriteJson, StorageError } from "./storage-safe";

describe("storage-safe", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads fallback on missing key", () => {
    expect(safeReadJson("missing", [])).toEqual([]);
  });

  it("round-trips JSON", () => {
    safeWriteJson("test-key", { a: 1 });
    expect(safeReadJson("test-key", {})).toEqual({ a: 1 });
  });

  it("returns fallback on corrupt JSON", () => {
    localStorage.setItem("bad", "{not-json");
    expect(safeReadJson("bad", "fallback")).toBe("fallback");
  });
});

describe("storage-safe quota", () => {
  it("throws StorageError on quota exceeded", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      const err = new DOMException("quota", "QuotaExceededError");
      throw err;
    });
    expect(() => safeWriteJson("k", { big: true })).toThrow(StorageError);
    spy.mockRestore();
  });
});
