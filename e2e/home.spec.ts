import { expect, test } from "@playwright/test";

test("página inicial carrega com os campi do seed", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "moradia perto do seu campus",
  );
  await expect(
    page.getByText("UFPI · Campus Ministro Petrônio Portella"),
  ).toBeVisible();
});

test("endereço inexistente mostra a página 404", async ({ page }) => {
  const response = await page.goto("/pagina-que-nao-existe");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" }),
  ).toBeVisible();
});
