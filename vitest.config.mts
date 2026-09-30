import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Resolve o alias `@/` do tsconfig.json (nativo no Vite)
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // Testes de integração (banco de verdade): vitest.integration.config.mts
    exclude: ["**/node_modules/**", "src/**/*.int.test.{ts,tsx}"],
  },
});
