import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { ApiError, withRetry, withTimeout } from "./api-client";

describe("api-client", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("times out slow requests", async () => {
    const slow = new Promise<string>(() => {});
    const promise = withTimeout(slow, 1000);
    vi.advanceTimersByTime(1001);
    await expect(promise).rejects.toMatchObject({ code: "TIMEOUT" });
  });

  it("retries then succeeds", async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls++;
      if (calls < 2) throw new Error("fail");
      return "ok";
    });
    const resultPromise = withRetry(fn, { retries: 2, delayMs: 10 });
    await vi.runAllTimersAsync();
    await expect(resultPromise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws ApiError on exhaustion", async () => {
    const fn = vi.fn(async () => {
      throw new Error("fail");
    });
    const resultPromise = withRetry(fn, { retries: 1, delayMs: 10 });
    await vi.runAllTimersAsync();
    await expect(resultPromise).rejects.toBeInstanceOf(ApiError);
  });
});
