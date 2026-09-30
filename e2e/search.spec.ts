import { expect, test } from "@playwright/test";
import { createVerifiedAccount } from "./support/accounts";
import { publishListing } from "./support/listings";

// Busca pública de anúncios (#28).

const TITLE = "Quarto mobiliado perto da UFPI";
const UFPI = "ufpi-petronio-portella";

/** Preço em reais que só um teste usa (os outros anúncios custam R$ 750). */
function uniquePrice() {
  return String(9000 + Math.floor(Math.random() * 10000));
}

// A página do anúncio tem mapa; os testes não dependem dos tiles do OSM
test.beforeEach(async ({ context }) => {
  await context.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
});

test("visitante busca sem login, escolhe o campus e abre um anúncio", async ({
  page,
  browser,
}) => {
  const owner = await createVerifiedAccount(page, "Dona Busca", "ANUNCIANTE");
  // Outros testes publicam anúncios com o mesmo título ao mesmo tempo: o
  // preço exclusivo acha só o deste teste pelo filtro da URL
  const price = uniquePrice();
  await publishListing(page, { price: `${price},00` });
  const priceQuery = `precoMin=${price}&precoMax=${price}`;

  const visitorContext = await browser.newContext();
  const visitor = await visitorContext.newPage();
  await visitor.goto("/");
  await visitor.getByRole("link", { name: "Buscar moradia" }).click();
  await expect(visitor).toHaveURL("/busca");
  await expect(
    visitor.getByRole("heading", { level: 1, name: "Buscar moradia" }),
  ).toBeVisible();
  await expect(visitor.getByRole("status")).toContainText(
    "dos mais recentes para os mais antigos",
  );

  await visitor.goto(`/busca?${priceQuery}`);
  await expect(visitor.getByRole("status")).toContainText(
    "1 anúncio encontrado",
  );
  const card = visitor.getByRole("listitem", { name: TITLE });
  await expect(card).toContainText("Quarto · Centro, Teresina");
  await expect(card).toContainText("/mês");
  // Sem campus não há distância
  await expect(card).not.toContainText("do campus");

  // O contato de quem anunciou não vai no HTML da busca
  const html = await (await visitor.request.get(`/busca?${priceQuery}`)).text();
  expect(html).toContain(TITLE);
  expect(html).not.toContain(owner.email);
  expect(html).not.toContain("wa.me");

  // Escolher o campus ordena por distância e fica na URL
  await visitor
    .getByRole("navigation", { name: "Campus" })
    .getByRole("link", { name: "UFPI · Campus Ministro Petrônio Portella" })
    .click();
  await expect(visitor).toHaveURL(`/busca?campus=${UFPI}&${priceQuery}`);
  await expect(visitor.getByRole("heading", { level: 1 })).toContainText(
    "Moradia perto de UFPI",
  );
  const nearCard = visitor.getByRole("listitem", { name: TITLE });
  await expect(nearCard).toContainText(/(\d+(,\d)? km|\d+ m) do campus/);

  // O anúncio abre já com a distância até o campus escolhido
  await nearCard.getByRole("link").click();
  await expect(visitor).toHaveURL(
    new RegExp(`/anuncios/[^/?]+\\?campus=${UFPI}$`),
  );
  await expect(visitor.getByRole("heading", { name: TITLE })).toBeVisible();
  await expect(
    visitor.getByRole("listitem").filter({ hasText: "Petrônio Portella" }),
  ).toContainText(/\d+(,\d)? km|\d+ m/);

  await visitorContext.close();
});

test("anúncio pausado sai da busca", async ({ page }) => {
  await createVerifiedAccount(page, "Dono Pausa", "ANUNCIANTE");
  const price = uniquePrice();
  await publishListing(page, { price: `${price},00` });
  const search = `/busca?precoMin=${price}&precoMax=${price}`;

  await page.goto(search);
  await expect(page.getByRole("status")).toContainText("1 anúncio encontrado");
  await expect(page.getByRole("listitem", { name: TITLE })).toBeVisible();

  await page.goto("/meus-anuncios");
  await page
    .getByRole("listitem", { name: TITLE })
    .getByRole("button", { name: "Pausar" })
    .click();
  await expect(page.getByRole("listitem", { name: TITLE })).toContainText(
    "Pausado",
  );

  await page.goto(search);
  await expect(page.getByText("Nenhum anúncio encontrado")).toBeVisible();
  // "Limpar filtros" volta para a busca sem filtros
  await page.getByRole("link", { name: "Limpar filtros" }).click();
  await expect(page).toHaveURL("/busca");
});

test("filtros inválidos e página além da última não quebram a busca", async ({
  page,
}) => {
  const response = await page.goto(
    "/busca?campus=nao-existe&raio=abc&tipo=CASTELO&precoMin=-1",
  );
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: "Buscar moradia" }),
  ).toBeVisible();

  // Página além da última volta para a última (ou para a primeira, sem anúncios)
  await page.goto(`/busca?campus=${UFPI}&pagina=999`);
  await expect(page).toHaveURL(
    new RegExp(`/busca\\?campus=${UFPI}(&pagina=\\d{1,3})?$`),
  );
  await expect(page).not.toHaveURL(/pagina=999/);
});

test("estudante logado chega à busca pela página inicial", async ({ page }) => {
  await createVerifiedAccount(page, "Aluno Busca", "ESTUDANTE");
  await page.goto("/");
  await page.getByRole("link", { name: "Buscar moradia" }).click();
  await expect(page).toHaveURL("/busca");
});
