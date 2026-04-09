import { expect, test } from "@playwright/test";

/**
 * Unauthenticated E2E tests.
 * These run without any stored session state (no e2e/.auth/user.json required).
 *
 * Covers:
 * - Login page UI
 * - Auth redirect: every protected route must redirect to /login
 */

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the sign-in heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("shows the Google sign-in button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /continue with google/i }),
    ).toBeVisible();
  });

  test("Google sign-in button is enabled on load", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /continue with google/i }),
    ).toBeEnabled();
  });

  test("page title identifies the application", async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
  });

  test("does not redirect away from /login", async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
  });
});

/**
 * Every protected route must redirect an unauthenticated visitor to /login.
 * Add new routes here as they are created.
 */
const PROTECTED_ROUTES = [
  "/dashboard",
  "/sales",
  "/pos",
  "/purchases",
  "/inventory",
  "/products",
  "/catalog",
  "/credit",
  "/reports",
  "/settings",
];

test.describe("Auth redirect", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`visiting ${route} while unauthenticated redirects to /login`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.waitForURL(/\/login/, { timeout: 5000 });
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
