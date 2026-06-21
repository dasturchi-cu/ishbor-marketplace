import { beforeEach, describe, expect, it } from "vitest";

import {
  checkClientLoginRateLimit,
  clearLoginAttempts,
  isRateLimited,
  recordFailedLogin,
  recordLoginAttempt,
} from "./rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("allows login initially", () => {
    expect(checkClientLoginRateLimit().allowed).toBe(true);
  });

  it("blocks after max client attempts", () => {
    for (let i = 0; i < 5; i++) recordLoginAttempt();
    expect(checkClientLoginRateLimit().allowed).toBe(false);
  });

  it("tracks per-email failures", () => {
    recordFailedLogin("test@ishbor.uz");
    expect(isRateLimited("test@ishbor.uz")).toBe(false);
    for (let i = 0; i < 4; i++) recordFailedLogin("test@ishbor.uz");
    expect(isRateLimited("test@ishbor.uz")).toBe(true);
    clearLoginAttempts("test@ishbor.uz");
    expect(isRateLimited("test@ishbor.uz")).toBe(false);
  });
});
