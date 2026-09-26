import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // No CI, lista no log e gera o HTML (enviado como artefato se falhar)
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "html",
  // O `next dev` compila cada rota na primeira visita: dÃ¡ mais tempo Ã s esperas
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // A primeira compilaÃ§Ã£o do `next dev` pode demorar
    timeout: 120_000,
  },
});
