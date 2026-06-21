import { beforeEach, describe, expect, it } from "vitest";

import { loginWithCredentials } from "./auth";

describe("auth security", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("rejects unknown email without auto-creating account", () => {
    const result = loginWithCredentials("random@example.com", "password123", true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Ro'yxatdan");
    }
  });

  it("allows demo account login locally", () => {
    const result = loginWithCredentials("sardor@asaka.uz", "demo1234", true);
    expect(result.ok).toBe(true);
  });
});
