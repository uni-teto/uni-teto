import { expect, test } from "@playwright/test";
import {
  createVerifiedAccount,
  signIn,
  TEST_PASSWORD,
} from "./support/accounts";
import { leaveSummaryWithoutPhotos, publishListing } from "./support/listings";

// Excluir minha conta e política de privacidade (LGPD).

test("pessoa exclui a conta com a senha e tudo dela some", async ({ page }) => {
  const { email } = await createVerifiedAccount(page, "Vai Sair", "ANUNCIANTE");
  await publishListing(page);
  await leaveSummaryWithoutPhotos(page, "Ver anúncio");
  await expect(page).toHaveURL(/\/anuncios\/(?!novo)[^/]+$/);
  const listingUrl = page.url();

  await page.goto("/perfil");
  await page.getByRole("button", { name: "Excluir minha conta" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Excluir sua conta?" });
  await expect(dialog).toContainText("seu anúncio (com as fotos)");

  // Sem senha e com senha errada: nada é apagado
  await dialog.getByRole("button", { name: "Excluir conta" }).click();
  await expect(
    dialog.getByText("Digite sua senha para confirmar."),
  ).toBeVisible();
  await dialog.getByLabel("Sua senha").fill("senha-errada-123");
  await dialog.getByRole("button", { name: "Excluir conta" }).click();
  await expect(dialog.getByText("Senha incorreta.")).toBeVisible();

  await dialog.getByLabel("Sua senha").fill(TEST_PASSWORD);
  await dialog.getByRole("button", { name: "Excluir conta" }).click();
  await expect(page.getByText("Sua conta foi excluída.")).toBeVisible();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

  // O anúncio saiu junto, e não dá mais para entrar
  expect((await page.goto(listingUrl))?.status()).toBe(404);
  await page.goto("/login");
  await signIn(page, email, TEST_PASSWORD);
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
});

test("a rota do Better Auth para excluir sem senha fica desligada", async ({
  page,
}) => {
  await createVerifiedAccount(page, "Conta Protegida", "ESTUDANTE");

  // Com sessão recente, essa rota excluiria a conta sem pedir a senha
  const response = await page.request.post("/api/auth/delete-user", {
    data: {},
    headers: { Origin: "http://localhost:3000" },
  });
  expect(response.status()).toBe(404);

  await page.goto("/perfil");
  await expect(page.getByRole("heading", { name: "Meu perfil" })).toBeVisible();
});

test("política de privacidade é pública e está no rodapé e no cadastro", async ({
  page,
}) => {
  await page.goto("/cadastro");
  await page.getByRole("link", { name: "política de privacidade" }).click();
  await expect(page).toHaveURL("/privacidade");
  await expect(
    page.getByRole("heading", { name: "Política de privacidade" }),
  ).toBeVisible();
  await expect(page.getByText("só para estudantes logados")).toBeVisible();

  await page.goto("/");
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Privacidade" })
    .click();
  await expect(page).toHaveURL("/privacidade");
});
