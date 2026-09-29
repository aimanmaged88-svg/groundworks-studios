import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/rls/**/*.test.ts", "tests/unit/**/*.test.ts"],
    // the RLS suites share one database and reload the fixture in beforeAll,
    // so they must not run at the same time
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});
