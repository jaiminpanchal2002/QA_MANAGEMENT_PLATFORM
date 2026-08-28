import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/tests/**",
        "src/db/migrations/**",
        "src/**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "server-only": fileURLToPath(
        new URL("./src/tests/stubs/server-only.ts", import.meta.url)
      ),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
