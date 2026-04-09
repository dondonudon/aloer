#!/usr/bin/env node
/**
 * Interactive helper that prompts for Supabase session cookie chunks and writes
 * the Playwright storage-state file expected at `e2e/.auth/user.json`.
 *
 * Supabase splits large auth tokens across two cookies:
 *   sb-<project-ref>-auth-token.0
 *   sb-<project-ref>-auth-token.1
 *
 * The project ref is derived automatically from NEXT_PUBLIC_SUPABASE_URL
 * (read from .env.local if not already in the environment).
 *
 * Usage:
 *   1. Sign in at http://localhost:3001/login in your browser.
 *   2. Open DevTools → Application → Cookies → http://localhost:3001
 *   3. Copy the Value of `sb-<project-ref>-auth-token.0`
 *      and `sb-<project-ref>-auth-token.1`.
 *   4. Run:  npm run test:e2e:setup
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", ".auth");
const OUT_FILE = join(OUT_DIR, "user.json");

/**
 * Reads key=value pairs from .env.local without requiring a dotenv dependency.
 * Values already present in process.env take precedence.
 */
async function loadEnvLocal() {
  try {
    const content = await readFile(
      join(__dirname, "..", "..", ".env.local"),
      "utf8",
    );
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("="))
        continue;
      const i = trimmed.indexOf("=");
      const key = trimmed.slice(0, i).trim();
      const value = trimmed.slice(i + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env.local is optional
  }
}

await loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL is not set. Add it to .env.local or export it before running this script.",
  );
  process.exit(1);
}

const PROJECT_REF = new URL(supabaseUrl).hostname.split(".")[0];
const COOKIE_BASE = `sb-${PROJECT_REF}-auth-token`;

const rl = createInterface({ input: process.stdin, output: process.stdout });

const chunk0 = (await rl.question(`Paste ${COOKIE_BASE}.0 value: `)).trim();
const chunk1 = (await rl.question(`Paste ${COOKIE_BASE}.1 value: `)).trim();

rl.close();

if (!chunk0 || !chunk1) {
  console.error("Both cookie chunks are required.");
  process.exit(1);
}

/** @type {import('@playwright/test').StorageState} */
const storageState = {
  cookies: [
    {
      name: `${COOKIE_BASE}.0`,
      value: chunk0,
      domain: "localhost",
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
    {
      name: `${COOKIE_BASE}.1`,
      value: chunk1,
      domain: "localhost",
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ],
  origins: [],
};

await mkdir(OUT_DIR, { recursive: true });
await writeFile(OUT_FILE, JSON.stringify(storageState, null, 2), "utf8");

console.log(`Auth state written to ${OUT_FILE}`);
console.log("You can now run: npm run test:e2e:authenticated");
