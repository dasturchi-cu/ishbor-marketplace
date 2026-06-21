import { expect, test } from "@playwright/test";

test.describe("Smoke", () => {
  test("landing loads with primary CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Ishbor/i);
    await expect(page.getByRole("link", { name: /Ish topish|Loyiha joylash/i }).first()).toBeVisible();
  });

  test("help page reachable from footer", async ({ page }) => {
    await page.goto("/");
    const helpLink = page.getByRole("link", { name: "Yordam markazi" });
    await helpLink.scrollIntoViewIfNeeded();
    await helpLink.click();
    await expect(page).toHaveURL(/\/help/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("unified search page", async ({ page }) => {
    await page.goto("/search?q=figma");
    await expect(page.getByRole("heading", { name: /Qidirish/i })).toBeVisible();
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/Email|elektron/i)).toBeVisible();
  });
});
