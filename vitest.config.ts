import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    /**
     * Use jsdom as the browser-like environment so React components can be
     * rendered and queried with Testing Library.
     */
    environment: "jsdom",
    /** Load jest-dom matchers (toBeInTheDocument, etc.) before every suite. */
    setupFiles: ["src/test/setup.ts"],
    globals: true,
    /** Exclude Playwright E2E specs — those run via `npm run test:e2e`. */
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**", "src/components/**"],
      exclude: ["src/lib/supabase/**", "src/lib/actions/**"],
    },
  },
  resolve: {
    alias: {
      /** Mirror the @/* → src/* path alias from tsconfig.json */
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
