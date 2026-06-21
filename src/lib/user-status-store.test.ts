import { beforeEach, describe, expect, it } from "vitest";

import { syncAccountStatusFromAdmin } from "./auth";
import { getUserAccountStatus, isLoginBlocked } from "./user-status-store";

describe("user-status-store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("blocks suspended accounts", () => {
    syncAccountStatusFromAdmin("blocked@ishbor.uz", "suspended");
    expect(getUserAccountStatus("blocked@ishbor.uz")).toBe("suspended");
    expect(isLoginBlocked("blocked@ishbor.uz")).toBe(true);
  });

  it("allows active accounts", () => {
    syncAccountStatusFromAdmin("active@ishbor.uz", "active");
    expect(isLoginBlocked("active@ishbor.uz")).toBe(false);
  });
});
