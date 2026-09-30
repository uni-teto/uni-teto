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
  // Sem campus não há de onde medir o raio
  await expect(visitor.getByLabel("Distância até o campus")).toBeDisabled();
  await visitor
    .getByLabel("Campus", { exact: true })
    .selectOption({ label: "UFPI · Campus Ministro Petrônio Portella" });
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

test("raio: só aparecem os anúncios dentro da distância escolhida", async ({
  page,
}) => {
  await createVerifiedAccount(page, "Dona Raio", "ANUNCIANTE");
  const price = uniquePrice();
  // O endereço dos testes fica no Centro, a uns 3,5 km da UFPI
  await publishListing(page, { price: `${price},00` });
  const priceQuery = `precoMin=${price}&precoMax=${price}`;

  await page.goto(`/busca?campus=${UFPI}&${priceQuery}`);
  await expect(page.getByRole("listitem", { name: TITLE })).toBeVisible();
  const radius = page.getByLabel("Distância até o campus");
  await expect(radius).toHaveValue("");

  await radius.selectOption({ label: "Até 1 km" });
  await expect(page).toHaveURL(`/busca?campus=${UFPI}&raio=1&${priceQuery}`);
  await expect(page.getByRole("status")).toContainText(
    "0 anúncios encontrados, a até 1 km do campus",
  );
  await expect(page.getByText("Nenhum anúncio encontrado")).toBeVisible();

  await radius.selectOption({ label: "Até 5 km" });
  await expect(page).toHaveURL(`/busca?campus=${UFPI}&raio=5&${priceQuery}`);
  await expect(page.getByRole("listitem", { name: TITLE })).toContainText(
    /[0-9](,[0-9])? km do campus/,
  );

  // Tirar o campus tira o raio junto
  await page
    .getByLabel("Campus", { exact: true })
    .selectOption({ label: "Todos os campi (sem distância)" });
  await expect(page).toHaveURL(`/busca?${priceQuery}`);
  await expect(page.getByRole("listitem", { name: TITLE })).not.toContainText(
    "do campus",
  );
});

test("estudante entra na busca com o campus da universidade dele", async ({
  page,
}) => {
  // E-mail @ufpi.edu.br: vinculado à UFPI
  await createVerifiedAccount(page, "Aluno Busca", "ESTUDANTE");
  await page.goto("/");
  await page.getByRole("link", { name: "Buscar moradia" }).click();
  await expect(page).toHaveURL(`/busca?campus=${UFPI}`);
  await expect(page.getByLabel("Campus", { exact: true })).toHaveValue(UFPI);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Moradia perto de UFPI",
  );

  // Pode trocar de campus...
  await page
    .getByLabel("Campus", { exact: true })
    .selectOption({ label: "UESPI · Campus Poeta Torquato Neto" });
  await expect(page).toHaveURL("/busca?campus=uespi-torquato-neto");

  // ...ou ver todos, sem o campus dele voltar sozinho
  await page
    .getByLabel("Campus", { exact: true })
    .selectOption({ label: "Todos os campi (sem distância)" });
  await expect(page).toHaveURL("/busca?campus=todos");
  await expect(
    page.getByRole("heading", { level: 1, name: "Buscar moradia" }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL("/busca?campus=todos");
});

test("visitante e anunciante não têm campus pré-selecionado", async ({
  page,
}) => {
  await page.goto("/busca");
  await expect(page.getByLabel("Campus", { exact: true })).toHaveValue("");

  await createVerifiedAccount(page, "Dono Sem Campus", "ANUNCIANTE");
  await page.goto("/busca");
  await expect(page).toHaveURL("/busca");
  await expect(page.getByLabel("Campus", { exact: true })).toHaveValue("");
});

test("preço e tipo: filtra pelo formulário e combina com o campus", async ({
  page,
}) => {
  await createVerifiedAccount(page, "Dona Preço", "ANUNCIANTE");
  const price = uniquePrice();
  await publishListing(page, { price: `${price},00` });
  const card = page.getByRole("listitem", { name: TITLE });

  await page.goto(`/busca?campus=${UFPI}`);
  const min = page.getByLabel("Preço mínimo (R$)");
  const max = page.getByLabel("Preço máximo (R$)");
  // Aceita o preço como a pessoa costuma digitar; na URL vai em reais
  await min.fill(`R$ ${price},00`);
  await max.fill(price);
  await page.getByRole("button", { name: "Aplicar preço" }).click();
  await expect(page).toHaveURL(
    `/busca?campus=${UFPI}&precoMin=${price}&precoMax=${price}`,
  );
  await expect(page.getByRole("status")).toContainText("1 anúncio encontrado");
  await expect(card).toContainText("do campus");

  // O anúncio é um quarto
  const type = page.getByLabel("Tipo de vaga");
  await type.selectOption({ label: "Quitinete" });
  await expect(page).toHaveURL(/&tipo=QUITINETE$/);
  await expect(page.getByText("Nenhum anúncio encontrado")).toBeVisible();
  await type.selectOption({ label: "Quarto" });
  await expect(page).toHaveURL(/&tipo=QUARTO$/);
  await expect(card).toBeVisible();

  // Mínimo maior que o máximo: os dois são destrocados
  await min.fill("19999");
  await page.getByRole("button", { name: "Aplicar preço" }).click();
  await expect(page).toHaveURL(
    `/busca?campus=${UFPI}&precoMin=${price}&precoMax=19999&tipo=QUARTO`,
  );
  await expect(min).toHaveValue(price);
  await expect(max).toHaveValue("19999");

  // "Limpar" tira preço e tipo, mas mantém o campus
  await page.getByRole("link", { name: "Limpar", exact: true }).click();
  await expect(page).toHaveURL(`/busca?campus=${UFPI}`);
  await expect(min).toHaveValue("");
  await expect(type).toHaveValue("");
});
