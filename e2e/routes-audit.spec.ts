import { test, expect, type Page } from "@playwright/test";

const ERROR_BOUNDARY = "Nimadir buzildi";
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:8080";

type AuditFailure = {
  route: string;
  auth: string;
  errorBoundary: boolean;
  detail: string;
  consoleErrors: string[];
};

const failures: AuditFailure[] = [];

const PUBLIC_ROUTES: string[] = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/verify-otp",
  "/terms",
  "/privacy",
  "/help",
  "/status",
  "/search?q=figma",
  "/pricing",
  "/services",
  "/services/mobile-app-design-fintech",
  "/services/brand-identity-system",
  "/services/category/design",
  "/projects",
  "/projects/fintech-app-redesign",
  "/projects/b2b-saas-webflow",
  "/freelancers",
  "/freelancers/nargiza",
  "/freelancers/azamat",
  "/agencies",
  "/agencies/ishbor-studio",
  "/clients/asaka-capital",
  "/clients/hunar-bazaar",
  "/portfolio/asaka-neo-bank-rebrand-nargiza",
  "/portfolio/tezda-rider-app-nargiza",
];

const CLIENT_ROUTES: string[] = [
  "/welcome",
  "/dashboard",
  "/dashboard/agency",
  "/my-projects",
  "/projects/create",
  "/projects/preview",
  "/clients/manage",
  "/agency/clients",
  "/analytics/client",
  "/checkout",
  "/agencies/create",
  "/profile",
  "/settings",
  "/saved",
  "/notifications",
  "/messages",
  "/orders",
  "/orders/o1",
  "/orders/o2",
  "/escrow",
  "/escrow/ew1",
  "/escrow/ew2",
  "/wallet",
  "/subscription",
  "/analytics",
  "/ai",
  "/ai/onboarding",
  "/ai/proposal-assistant",
  "/ai/project-generator",
  "/ai/portfolio-optimizer",
  "/ai/trust-coach",
  "/onboarding",
  "/onboarding/company",
  "/onboarding/industry",
  "/onboarding/team-size",
  "/onboarding/hiring-goals",
];

const FREELANCER_ROUTES: string[] = [
  "/dashboard/freelancer",
  "/my-services",
  "/services/create",
  "/applications",
  "/applications/a5",
  "/applications/a1",
  "/promotions",
  "/freelancers/manage",
  "/portfolio",
  "/portfolio/create",
  "/portfolio/edit/asaka-neo-bank-rebrand-nargiza",
  "/onboarding/skills",
  "/onboarding/categories",
  "/onboarding/portfolio",
  "/onboarding/languages",
  "/onboarding/availability",
  "/analytics/freelancer",
];

const ADMIN_ROUTES: string[] = [
  "/revenue",
  "/admin",
  "/admin/users",
  "/admin/users/f1",
  "/admin/verifications",
  "/admin/projects",
  "/admin/services",
  "/admin/portfolios",
  "/admin/orders",
  "/admin/escrow",
  "/admin/escrow/ew1",
  "/admin/disputes",
  "/admin/payments",
  "/admin/applications",
  "/admin/moderation",
  "/admin/support",
  "/admin/analytics",
  "/admin/audit",
  "/admin/system",
  "/admin/founder",
  "/admin/ai",
];

function filterConsoleNoise(text: string): boolean {
  const ignore = [
    "favicon",
    "DevTools",
    "Failed to load resource",
    "404 (Not Found)",
    "[login] demo server session failed",
  ];
  return !ignore.some((part) => text.includes(part));
}

async function auditRoute(page: Page, route: string, auth: string): Promise<void> {
  const consoleErrors: string[] = [];
  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (filterConsoleNoise(text)) consoleErrors.push(text);
    }
  };
  const onPageError = (err: Error) => {
    consoleErrors.push(err.message);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  let errorBoundary = false;
  let detail = "";

  try {
    let response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
    if (!response && route.includes("/admin/")) {
      response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
    }
    await page.locator("body").waitFor({ state: "visible", timeout: 10_000 });
    await page.waitForTimeout(150);

    errorBoundary = await page.getByText(ERROR_BOUNDARY, { exact: false }).first().isVisible().catch(() => false);

    if (response && response.status() >= 500) {
      detail = `HTTP ${response.status()}`;
    }

    if (errorBoundary) {
      detail = detail ? `${detail}; error boundary visible` : "error boundary visible";
    }
  } catch (err) {
    detail = err instanceof Error ? err.message : String(err);
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }

  if (errorBoundary || detail || consoleErrors.length > 0) {
    failures.push({
      route,
      auth,
      errorBoundary,
      detail: detail || (consoleErrors.length ? "console errors" : ""),
      consoleErrors: [...consoleErrors],
    });
  }
}

async function demoLogin(page: Page, role: "client" | "freelancer" | "admin"): Promise<void> {
  await page.goto("/login", { waitUntil: "load" });
  const label = role === "client" ? "mijoz" : role === "freelancer" ? "frilanser" : "admin";
  await page.getByRole("button", { name: label }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 });
}

function printFailureReport(): void {
  if (failures.length === 0) {
    console.log("\n## Routes audit\n\nAll routes passed (no error boundary, no tracked console errors).\n");
    return;
  }

  console.log("\n## Failing routes\n");
  for (const f of failures) {
    const parts: string[] = [];
    if (f.errorBoundary) parts.push("**Nimadir buzildi** visible");
    if (f.detail) parts.push(f.detail);
    console.log(`- \`${f.route}\` (${f.auth}): ${parts.join("; ") || "see console"}`);
    for (const ce of f.consoleErrors) {
      const oneLine = ce.replace(/\s+/g, " ").trim();
      console.log(`  - console: ${oneLine.slice(0, 500)}${oneLine.length > 500 ? "…" : ""}`);
    }
  }
  console.log("");
}

test.describe.configure({ mode: "serial", timeout: 600_000 });

test.describe("Routes audit", () => {
  test.afterAll(() => {
    printFailureReport();
  });

  test("public routes", async ({ page }) => {
    expect(BASE).toContain("8080");
    for (const route of PUBLIC_ROUTES) {
      await auditRoute(page, route, "public");
    }
  });

  test("client protected routes", async ({ page }) => {
    await demoLogin(page, "client");
    for (const route of CLIENT_ROUTES) {
      await auditRoute(page, route, "client");
    }
  });

  test("freelancer protected routes", async ({ page }) => {
    await demoLogin(page, "freelancer");
    for (const route of FREELANCER_ROUTES) {
      await auditRoute(page, route, "freelancer");
    }
  });

  test("admin protected routes", async ({ page }) => {
    await demoLogin(page, "admin");
    for (const route of ADMIN_ROUTES) {
      await auditRoute(page, route, "admin");
    }
  });

  test("summary", async () => {
    if (failures.length > 0) {
      const md = failures
        .map((f) => {
          const lines = [`- \`${f.route}\` (${f.auth})`];
          if (f.errorBoundary) lines.push("  - Error boundary: Nimadir buzildi");
          if (f.detail) lines.push(`  - ${f.detail}`);
          for (const ce of f.consoleErrors) {
            const oneLine = ce.replace(/\s+/g, " ").trim();
            lines.push(`  - console: ${oneLine.slice(0, 500)}${oneLine.length > 500 ? "…" : ""}`);
          }
          return lines.join("\n");
        })
        .join("\n");
      expect.soft(failures.length, `Failing routes:\n${md}`).toBe(0);
    }
  });
});
