import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/__tests__/**/*.test.{js,ts}"],
    setupFiles: ["src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.{ts,tsx,js,jsx}", "app/**/*.{ts,tsx,js,jsx}"],
      exclude: ["src/__tests__/**", "node_modules/**"],
    },
  },
});
