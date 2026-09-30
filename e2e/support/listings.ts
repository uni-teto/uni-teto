import { expect, type Page } from "@playwright/test";
import { mockViaCep } from "./via-cep";

// Endereço que o Nominatim (real e o falso) encontra em Teresina
export const KNOWN_ADDRESS = {
  street: "Rua Desembargador Pires de Castro",
  neighborhood: "Centro",
};

export async function fillListingForm(
  page: Page,
  address: { street: string; neighborhood: string } = KNOWN_ADDRESS,
) {
  await page.getByLabel("Título").fill("Quarto mobiliado perto da UFPI");
  await page.getByLabel("Tipo de vaga").selectOption("QUARTO");
  await page.getByLabel("Valor mensal (R$)").fill("750,00");
  await page.getByLabel("Vagas disponíveis").fill("2");
  await page
    .getByLabel("Descrição")
    .fill("Quarto com ar-condicionado, internet e contas inclusas.");
  // A máscara acrescenta o hífen enquanto digita, e o CEP preenche o endereço
  await mockViaCep(page);
  const zipCode = page.getByLabel("CEP");
  await zipCode.pressSequentially("64001390");
  await expect(zipCode).toHaveValue("64001-390");
  await expect(
    page.getByText("Endereço preenchido pelo CEP. Confira e informe o número."),
  ).toBeVisible();
  await page.getByLabel("Rua").fill(address.street);
  await page.getByLabel("Número", { exact: true }).fill("1100");
  await page.getByLabel("Bairro").fill(address.neighborhood);
  // Cidade e estado vieram do CEP
  await expect(page.getByLabel("Cidade")).toHaveValue("Teresina");
  await expect(page.getByLabel("Estado")).toHaveValue("PI");
}

/**
 * Publica um anúncio (usuário já logado) e termina no resumo. `price` troca
 * o valor mensal (ex: "9100,00"), para achar o anúncio pelo filtro da busca.
 */
export async function publishListing(
  page: Page,
  { price }: { price?: string } = {},
) {
  await page.goto("/anuncios/novo");
  await fillListingForm(page);
  if (price) await page.getByLabel("Valor mensal (R$)").fill(price);
  await page.getByRole("button", { name: "Publicar anúncio" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Seu anúncio foi publicado!",
  );
}

/**
 * No resumo depois de publicar (sem fotos), clica numa saída e confirma o
 * aviso "Continuar sem fotos?".
 */
export async function leaveSummaryWithoutPhotos(
  page: Page,
  button: "Ver anúncio" | "Ver meus anúncios" | "Criar outro anúncio",
) {
  await page.getByRole("button", { name: button }).click();
  const confirm = page.getByRole("alertdialog", {
    name: "Continuar sem fotos?",
  });
  await expect(confirm).toContainText("menos confiança");
  await confirm.getByRole("button", { name: "Continuar sem fotos" }).click();
}
