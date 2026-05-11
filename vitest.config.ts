import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  test: {
    globals: true,
    include: ["lib/**/__tests__/**/*.test.ts", "lib/**/*.test.ts"],
    environment: "node"
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url))
    }
  }
});
