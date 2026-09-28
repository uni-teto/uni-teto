import { defineConfig } from "vitest/config";

// Testes de integração: rodam contra o Postgres/PostGIS do docker-compose.
// `npm run test:integration` (antes: `docker compose up -d` e `npm run db:migrate`).
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.int.test.{ts,tsx}"],
    // Carrega DATABASE_URL do .env
    setupFiles: ["dotenv/config"],
    // Um arquivo por vez: todos usam o mesmo banco
    fileParallelism: false,
  },
});
