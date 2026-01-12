import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Environment
    environment: "jsdom",

    // Setup files
    setupFiles: ["./tests/setup/vitest.setup.ts"],

    // Include patterns
    // Note: Integration tests require additional setup for database mocking
    // They can be run separately with: npm run test:integration
    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      // "tests/integration/**/*.test.ts", // Uncomment when db mocking is ready
    ],

    // Exclude patterns
    exclude: ["node_modules", "tests/e2e/**", ".next"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: [
        "src/lib/**/*.ts",
        "src/components/domain/**/*.tsx",
        "src/app/api/**/*.ts",
      ],
      exclude: [
        "src/lib/supabase/**",
        "src/lib/mock-data.ts",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
      ],
      // Initial thresholds - increase as more tests are added
      thresholds: {
        statements: 5,
        branches: 5,
        functions: 15,
        lines: 5,
      },
    },

    // Global test timeout
    testTimeout: 10000,

    // Reporter
    reporters: ["default"],

    // Mock handling
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    // Globals (enables describe/it/expect without imports)
    globals: true,
  },
});
