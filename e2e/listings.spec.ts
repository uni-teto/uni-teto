import { expect, test } from "@playwright/test";
import { createVerifiedAccount } from "./support/accounts";
import { fillListingForm, KNOWN_ADDRESS } from "./support/listings";

// Criar anúncio (#24). Precisa do banco com o seed e do Mailpit; a
// geocodificação usa o Nominatim falso (e2e/support/nominatim-mock.mjs).

test("visitante é mandado para o login ao tentar anunciar", async ({
  page,
}) => {
  await page.goto("/anuncios/novo");
  await expect(page).toHaveURL("/login?next=%2Fanuncios%2Fnovo");
});

test("anunciante publica um anúncio e vê o aviso de localização aproximada", async ({
  page,
}) => {
  await createVerifiedAccount(page, "Anunciante E2E", "ANUNCIANTE");
  await page.goto("/");
  await page.getByRole("link", { name: "Anunciar" }).click();
  await expect(page).toHaveURL("/anuncios/novo");

  await fillListingForm(page, KNOWN_ADDRESS);
  await page.getByRole("button", { name: "Publicar anúncio" }).click();

  const status = page.getByRole("status");
  await expect(status).toContainText("Seu anúncio foi publicado!");
  await expect(status).toContainText("Rua Desembargador Pires de Castro");
  // O número não está no mapa: o ponto é o da rua
  await expect(status).toContainText("O número não está no mapa");
});

test("estudante também pode anunciar (vaga em república)", async ({ page }) => {
  await createVerifiedAccount(page, "Estudante Anunciante", "ESTUDANTE");
  await page.goto("/anuncios/novo");

  await expect(
    page.getByRole("heading", { name: "Criar anúncio" }),
  ).toBeVisible();
});

test("valida o formulário e explica quando o endereço não é encontrado", async ({
  page,
}) => {
  await createVerifiedAccount(page, "Endereço Errado", "ANUNCIANTE");
  await page.goto("/anuncios/novo");

  await page.getByRole("button", { name: "Publicar anúncio" }).click();
  await expect(page.getByText("Escolha o tipo de vaga.")).toBeVisible();
  await expect(page.getByText("Informe o CEP com 8 dígitos.")).toBeVisible();

  await fillListingForm(page, {
    street: "Rua Inexistente UniTeto E2E",
    neighborhood: "Bairro Inexistente UniTeto E2E",
  });
  await page.getByRole("button", { name: "Publicar anúncio" }).click();

  await expect(
    page.getByText("Não encontramos esse endereço no mapa"),
  ).toBeVisible();
  await expect(page.getByRole("status")).toBeHidden();
});
