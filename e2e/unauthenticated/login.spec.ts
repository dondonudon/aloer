
import { expect, test } from "@playwright/test";

/**
 * Unauthenticated E2E tests for the login page.
 * These run without any stored session state.
 */

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the sign-in heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /sign in/i }),
    ).toBeVisible();
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
    // The <title> is set by the root layout; allow any non-empty title.
    await expect(page).toHaveTitle(/.+/);
  });
});

test.describe("Auth redirect", () => {
  test("visiting /dashboard while unauthenticated redirects to /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting /sales while unauthenticated redirects to /login", async ({
    page,
  }) => {
    await page.goto("/sales");
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting /pos while unauthenticated redirects to /login", async ({
    page,
  }) => {
    await page.goto("/pos");
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });
});
