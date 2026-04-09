import { readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/**
 * Load key=value pairs from .env.local into process.env so that
 * NEXT_PUBLIC_SITE_URL is available without having to export it manually.
 * Variables already in the environment take precedence.
 */
function loadEnvLocal() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      const key = t.slice(0, i).trim();
      const value = t.slice(i + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env.local is optional (e.g. in CI)
  }
}

loadEnvLocal();

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
    baseURL: BASE_URL,
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
   * Skipped in CI where the server is started separately.
   */
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
