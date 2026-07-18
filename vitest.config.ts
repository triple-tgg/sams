import { defineConfig } from "vitest/config";
import path from "path";

// Test runner for pure logic (status calc, point-in-time query, resolution rule,
// event emission). Kept deliberately narrow — the master-data logic is authored as
// pure functions so it can move server-side unchanged, and these tests exercise it
// without React or a DOM.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
