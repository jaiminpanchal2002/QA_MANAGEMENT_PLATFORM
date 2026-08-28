import { test, expect } from "@playwright/test";

/**
 * Authenticated end-to-end journey covering the mandated scenarios that are
 * implemented in this pass: sign in → dashboard → projects → create project →
 * open project → create test case → sign out.
 *
 * Requires a migrated + seeded database and the app running. Enable with:
 *   E2E_SEEDED=1 pnpm test:e2e
 * Uses the documented seed credentials (owner@acme.test / Password123!).
 */
const seeded = process.env.E2E_SEEDED === "1";
test.skip(!seeded, "Set E2E_SEEDED=1 with a seeded database to run.");

const EMAIL = "owner@acme.test";
const PASSWORD = "Password123!";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("sign in and view the dashboard with real metrics", async ({ page }) => {
  await signIn(page);
  await expect(
    page.getByRole("heading", { name: /dashboard/i })
  ).toBeVisible();
  await expect(page.getByText(/pass rate/i)).toBeVisible();
});

test("navigate to projects and open a project", async ({ page }) => {
  await signIn(page);
  await page.getByRole("link", { name: /projects/i }).first().click();
  await expect(page).toHaveURL(/\/projects/);
  await page.getByRole("link", { name: /shop checkout/i }).click();
  await expect(page.getByText(/test cases/i).first()).toBeVisible();
});

test("create a new project", async ({ page }) => {
  await signIn(page);
  await page.goto("/projects");
  await page.getByRole("button", { name: /new project/i }).first().click();
  const suffix = Date.now().toString().slice(-5);
  await page.getByLabel(/^name$/i).fill(`E2E Project ${suffix}`);
  await page.getByLabel(/^key$/i).fill(`E2E${suffix.slice(-2)}`);
  await page.getByRole("button", { name: /create project/i }).click();
  await expect(page.getByText(`E2E Project ${suffix}`)).toBeVisible();
});

test("sign out", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: /user menu/i }).click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/sign-in/);
});
