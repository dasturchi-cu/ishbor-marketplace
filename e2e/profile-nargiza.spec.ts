import { test, expect } from "@playwright/test";

test("freelancer profile nargiza loads without error boundary", async ({ page }) => {
  const errors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  await page.goto("/freelancers/nargiza", { waitUntil: "networkidle" });
  if (await page.getByText("Nimadir buzildi").count()) {
    console.log("PAGE ERRORS:", errors);
    console.log("CONSOLE ERRORS:", consoleErrors);
  }
  await expect(page.getByText("Nimadir buzildi")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Nargiza Akhmedova/i })).toBeVisible();
  expect(errors, errors.join("\n")).toEqual([]);
});

test("logged-in nargiza own profile loads", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/login", { waitUntil: "load" });
  await page.getByRole("button", { name: "frilanser" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 });
  await page.goto("/freelancers/nargiza", { waitUntil: "networkidle" });
  await expect(page.getByText("Nimadir buzildi")).toHaveCount(0);
  expect(errors, errors.join("\n")).toEqual([]);
});
