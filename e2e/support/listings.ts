import { expect, type Page } from "@playwright/test";

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
  // A máscara acrescenta o hífen enquanto digita
  const zipCode = page.getByLabel("CEP");
  await zipCode.pressSequentially("64001390");
  await expect(zipCode).toHaveValue("64001-390");
  await page.getByLabel("Rua").fill(address.street);
  await page.getByLabel("Número", { exact: true }).fill("1100");
  await page.getByLabel("Bairro").fill(address.neighborhood);
  // Cidade e estado já vêm como Teresina / Piauí
  await expect(page.getByLabel("Cidade")).toHaveValue("Teresina");
}

/** Publica um anúncio (usuário já logado) e termina no resumo. */
export async function publishListing(page: Page) {
  await page.goto("/anuncios/novo");
  await fillListingForm(page);
  await page.getByRole("button", { name: "Publicar anúncio" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Seu anúncio foi publicado!",
  );
}
