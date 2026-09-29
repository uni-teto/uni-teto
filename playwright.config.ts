import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const NOMINATIM_MOCK_PORT = 8089;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // No CI, lista no log e gera o HTML (enviado como artefato se falhar)
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "html",
  // O `next dev` compila cada rota na primeira visita: dá mais tempo às esperas
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Geocodificação falsa (e2e/support/nominatim-mock.mjs)
      command: "node e2e/support/nominatim-mock.mjs",
      url: `http://localhost:${NOMINATIM_MOCK_PORT}`,
      env: { NOMINATIM_MOCK_PORT: String(NOMINATIM_MOCK_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev",
      url: `http://localhost:${PORT}`,
      // Se já houver um `npm run dev` aberto (local), ele é reaproveitado e usa
      // o Nominatim configurado nele; os testes funcionam com os dois
      env: {
        NOMINATIM_URL: `http://localhost:${NOMINATIM_MOCK_PORT}`,
        // Credenciais falsas: só geram a assinatura; o envio ao Cloudinary é
        // interceptado no navegador (e2e/support/cloudinary.ts)
        CLOUDINARY_CLOUD_NAME: "uniteto-e2e",
        CLOUDINARY_API_KEY: "e2e-api-key",
        CLOUDINARY_API_SECRET: "e2e-api-secret-sem-uso-real",
      },
      reuseExistingServer: !process.env.CI,
      // A primeira compilação do `next dev` pode demorar
      timeout: 120_000,
    },
  ],
});
