import { test, expect } from "@playwright/test";

/**
 * Smoke tests that do not require a seeded database — they verify the public
 * surface renders and unauthenticated route protection works. The full
 * authenticated E2E journeys (see auth-journey.spec.ts) require a migrated +
 * seeded database and are gated on E2E_SEEDED=1.
 */
test("landing page renders with primary CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /quality assurance management/i,
    })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: /get started|create your workspace/i }).first()
  ).toBeVisible();
});

test("sign-in page renders the form", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("unauthenticated access to /dashboard redirects to sign-in", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
});
