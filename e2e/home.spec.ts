import { expect, test } from "@playwright/test";
import { createVerifiedAccount } from "./support/accounts";
import { publishListing } from "./support/listings";

test("página inicial carrega com os campi do seed", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "moradia perto do seu campus",
  );
  await expect(
    page
      .getByRole("region", { name: "Campi atendidos" })
      .getByText("UFPI · Campus Ministro Petrônio Portella"),
  ).toBeVisible();
});

test("endereço inexistente mostra a página 404", async ({ page }) => {
  const response = await page.goto("/pagina-que-nao-existe");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" }),
  ).toBeVisible();
});

test("página inicial mostra os anúncios recentes e leva à busca", async ({
  page,
  browser,
}) => {
  await createVerifiedAccount(page, "Dona Destaque", "ANUNCIANTE");
  await publishListing(page);

  const visitorContext = await browser.newContext();
  const visitor = await visitorContext.newPage();
  await visitor.goto("/");
  const featured = visitor.getByRole("region", { name: "Anúncios recentes" });
  // Outros testes publicam anúncios com o mesmo título ao mesmo tempo
  const card = featured
    .getByRole("listitem", { name: "Quarto mobiliado perto da UFPI" })
    .first();
  await expect(card).toContainText("/mês");
  // Sem campus não há distância, e o contato não aparece
  await expect(card).not.toContainText("do campus");
  expect(await featured.getByRole("listitem").count()).toBeLessThanOrEqual(6);

  await featured
    .getByRole("link", { name: /^Ver (na busca|os \d+ anúncios)$/ })
    .click();
  await expect(visitor).toHaveURL("/busca");
  await visitorContext.close();
});

test("estudante vê na página inicial os anúncios perto do campus dele", async ({
  page,
  browser,
}) => {
  await createVerifiedAccount(page, "Dona Perto", "ANUNCIANTE");
  await publishListing(page);

  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  await createVerifiedAccount(student, "Aluno Início", "ESTUDANTE");
  await student.goto("/");
  const featured = student.getByRole("region", {
    name: "Perto de UFPI · Campus Ministro Petrônio Portella",
  });
  await expect(featured.getByRole("listitem").first()).toContainText(
    "do campus",
  );
  await studentContext.close();
});
