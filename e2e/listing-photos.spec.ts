import { expect, test } from "@playwright/test";
import { createVerifiedAccount } from "./support/accounts";
import { mockCloudinary, TINY_PNG } from "./support/cloudinary";
import { publishListing } from "./support/listings";

// Fotos do anúncio (#25), com o Cloudinary falso (e2e/support/cloudinary.ts).

const photo = (name: string) => ({
  name,
  mimeType: "image/png",
  buffer: TINY_PNG,
});

test("dono envia fotos, escolhe a capa e remove uma", async ({ page }) => {
  await mockCloudinary(page);
  await createVerifiedAccount(page, "Dono das Fotos", "ANUNCIANTE");
  await publishListing(page);

  await page.getByRole("link", { name: "Adicionar fotos" }).click();
  await expect(page).toHaveURL(/\/anuncios\/[^/]+\/fotos$/);

  const addButton = page.getByRole("button", { name: "Adicionar fotos" });
  test.skip(
    await addButton.isDisabled(),
    "Servidor reaproveitado sem Cloudinary: feche o `npm run dev` para o Playwright subir o dele",
  );

  await page
    .getByLabel("Escolher fotos")
    .setInputFiles([photo("sala.png"), photo("quarto.png")]);
  await expect(page.getByText("2 fotos adicionadas.")).toBeVisible();

  const images = page.getByRole("listitem").getByRole("img");
  await expect(images).toHaveCount(2);
  await expect(images.first()).toHaveAccessibleName("Foto de capa");
  const [firstSrc, secondSrc] = await images.evaluateAll((imgs) =>
    imgs.map((img) => img.getAttribute("src")),
  );

  // A segunda foto vira a capa
  await page.getByRole("button", { name: "Tornar capa" }).click();
  await expect(page.getByText("Capa atualizada.")).toBeVisible();
  await expect(images.first()).toHaveAttribute("src", secondSrc!);

  // Remove a capa: a outra foto sobe e vira a capa
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Remover" }).first().click();
  await expect(page.getByText("Foto removida.")).toBeVisible();
  await expect(images).toHaveCount(1);
  await expect(images.first()).toHaveAttribute("src", firstSrc!);
  await expect(images.first()).toHaveAccessibleName("Foto de capa");
});

test("outra pessoa não acessa a página de fotos do anúncio", async ({
  page,
  browser,
}) => {
  await createVerifiedAccount(page, "Dono Original", "ANUNCIANTE");
  await publishListing(page);
  await page.getByRole("link", { name: "Adicionar fotos" }).click();
  // Espera chegar na página de fotos antes de guardar o endereço
  await expect(page).toHaveURL(/\/anuncios\/[^/]+\/fotos$/);
  const photosUrl = page.url();

  // Outra conta, em outra sessão do navegador
  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  await createVerifiedAccount(other, "Curioso", "ANUNCIANTE");
  const response = await other.goto(photosUrl);

  expect(response?.status()).toBe(404);
  await expect(
    other.getByRole("heading", { name: "Fotos do anúncio" }),
  ).toBeHidden();
  await otherContext.close();
});

test("terminar sem fotos pede confirmação, mas o anúncio continua no ar", async ({
  page,
}) => {
  await createVerifiedAccount(page, "Dono Sem Fotos", "ANUNCIANTE");
  await publishListing(page);

  // No resumo, sair sem fotos abre o aviso; "Adicionar fotos" leva às fotos
  await page.getByRole("button", { name: "Ver meus anúncios" }).click();
  const confirm = page.getByRole("alertdialog", {
    name: "Continuar sem fotos?",
  });
  await expect(confirm).toContainText(
    "Anúncios sem fotos passam menos confiança",
  );
  await confirm.getByRole("button", { name: "Adicionar fotos" }).click();
  await expect(page).toHaveURL(/\/anuncios\/[^/]+\/fotos$/);

  // "Concluir" sem nenhuma foto pergunta de novo
  await page.getByRole("button", { name: "Concluir" }).click();
  await confirm.getByRole("button", { name: "Continuar sem fotos" }).click();
  await expect(page).toHaveURL("/meus-anuncios");
  await expect(
    page.getByRole("listitem", { name: "Quarto mobiliado perto da UFPI" }),
  ).toContainText("Ativo");
});
