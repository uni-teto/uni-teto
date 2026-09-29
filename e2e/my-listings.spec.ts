import { expect, test } from "@playwright/test";
import {
  createVerifiedAccount,
  signIn,
  TEST_PASSWORD,
} from "./support/accounts";
import { publishListing } from "./support/listings";

// Meus anúncios (#42) e editar/pausar/excluir (#26).

test("anunciante entra e cai em Meus anúncios, vazio no começo", async ({
  page,
  context,
}) => {
  const { email } = await createVerifiedAccount(
    page,
    "Novo Dono",
    "ANUNCIANTE",
  );
  await context.clearCookies();

  await page.goto("/login");
  await signIn(page, email, TEST_PASSWORD);

  await expect(page).toHaveURL("/meus-anuncios");
  await expect(page.getByText("Você ainda não tem anúncios")).toBeVisible();
  await page.getByRole("link", { name: "Criar anúncio" }).click();
  await expect(page).toHaveURL("/anuncios/novo");
});

test("dono edita, pausa, reativa e exclui o anúncio", async ({ page }) => {
  await createVerifiedAccount(page, "Dono Completo", "ANUNCIANTE");
  await publishListing(page);
  await page.getByRole("link", { name: "Ver meus anúncios" }).click();
  await expect(page).toHaveURL("/meus-anuncios");

  const item = page.getByRole("listitem", {
    name: "Quarto mobiliado perto da UFPI",
  });
  await expect(item).toContainText("Ativo");
  await expect(item).toContainText(/R\$\s750,00\/mês/);

  // Editar: endereço que não existe não é salvo
  await item.getByRole("link", { name: "Editar" }).click();
  await expect(page.getByLabel("Valor mensal (R$)")).toHaveValue("750,00");
  await expect(page.getByLabel("CEP")).toHaveValue("64001-390");
  await page.getByLabel("Rua").fill("Rua Inexistente UniTeto E2E");
  await page.getByLabel("Bairro").fill("Bairro Inexistente UniTeto E2E");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    page.getByText("Não encontramos esse endereço no mapa"),
  ).toBeVisible();

  // Editar título e preço (endereço de volta ao original)
  await page.getByLabel("Rua").fill("Rua Desembargador Pires de Castro");
  await page.getByLabel("Bairro").fill("Centro");
  await page.getByLabel("Título").fill("Quarto amplo perto da UFPI");
  await page.getByLabel("Valor mensal (R$)").fill("900");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page).toHaveURL("/meus-anuncios");

  const edited = page.getByRole("listitem", {
    name: "Quarto amplo perto da UFPI",
  });
  await expect(edited).toContainText(/R\$\s900,00\/mês/);

  // Pausar e reativar
  await edited.getByRole("button", { name: "Pausar" }).click();
  await expect(edited).toContainText("Pausado");
  await edited.getByRole("button", { name: "Reativar" }).click();
  await expect(edited).toContainText("Ativo");

  // Excluir pede confirmação: cancelar não apaga
  await edited.getByRole("button", { name: "Excluir" }).click();
  const confirm = page.getByRole("alertdialog", {
    name: "Excluir este anúncio?",
  });
  await expect(confirm).toContainText("Quarto amplo perto da UFPI");
  await confirm.getByRole("button", { name: "Cancelar" }).click();
  await expect(confirm).toBeHidden();
  await expect(edited).toBeVisible();

  await edited.getByRole("button", { name: "Excluir" }).click();
  await confirm.getByRole("button", { name: "Excluir anúncio" }).click();
  await expect(page.getByText("Você ainda não tem anúncios")).toBeVisible();
});

test("outra pessoa não edita o anúncio", async ({ page, browser }) => {
  await createVerifiedAccount(page, "Dono Original", "ANUNCIANTE");
  await publishListing(page);
  await page.goto("/meus-anuncios");
  const editUrl = await page
    .getByRole("link", { name: "Editar" })
    .getAttribute("href");

  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  await createVerifiedAccount(other, "Curioso", "ANUNCIANTE");
  const response = await other.goto(editUrl!);

  expect(response?.status()).toBe(404);
  await expect(
    other.getByRole("heading", { name: "Editar anúncio" }),
  ).toBeHidden();
  await otherContext.close();
});
