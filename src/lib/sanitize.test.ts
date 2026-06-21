import { describe, expect, it } from "vitest";

import { normalizeEmail, normalizeUsername, sanitizeText } from "./sanitize";

describe("sanitize", () => {
  it("normalizes email", () => {
    expect(normalizeEmail("  Sardor@Asaka.UZ ")).toBe("sardor@asaka.uz");
  });

  it("normalizes username", () => {
    expect(normalizeUsername("Nargiza Akh")).toBe("nargiza-akh");
  });

  it("truncates long text", () => {
    expect(sanitizeText("a".repeat(20), 10)).toHaveLength(10);
  });
});
