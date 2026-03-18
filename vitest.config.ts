import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**"],
    env: {
      PERCEPTRON_API_KEY: "test-api-key",
    },
  },
});
