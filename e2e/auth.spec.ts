import { test, expect } from "@playwright/test";

test.describe("Auth smoke", () => {
  test("demo client login reaches dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "mijoz" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/Elektron pochta/i).fill("unknown@example.com");
    await page.getByLabel(/^Parol$/i).fill("wrongpassword");
    await page.getByRole("button", { name: /^Kirish$/i }).click();
    await expect(page.getByText(/noto'g'ri|Ro'yxatdan/i)).toBeVisible({ timeout: 10_000 });
  });
});
