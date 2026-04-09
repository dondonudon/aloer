
import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for end-to-end tests.
 *
 * Tests are split into two projects:
 *  - "unauthenticated" — public routes that don't require a session.
 *  - "authenticated"   — protected routes that need a real session. These are
 *    skipped unless the TEST_USER_EMAIL / TEST_USER_PASSWORD env variables are
 *    set or a stored auth state file exists at `e2e/.auth/user.json`.
 *
 * @see https://playwright.dev/docs/configuration
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    /** Public / unauthenticated tests — always run */
    {
      name: "unauthenticated",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: "**/unauthenticated/**/*.spec.ts",
    },

    /**
     * Authenticated tests — require a valid session stored in
     * `e2e/.auth/user.json`. Run `npx ts-node e2e/setup/auth.ts` (or your
     * own script) to populate that file before running these tests.
     */
    {
      name: "authenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      testMatch: "**/authenticated/**/*.spec.ts",
    },
  ],

  /**
   * Start the Next.js dev server before any test runs.
   * This is commented out by default so CI can start it separately.
   * Uncomment when running locally without a running server.
   */
  // webServer: {
  //   command: "npm run dev",
  //   url: "http://localhost:3000",
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120_000,
  // },
});
