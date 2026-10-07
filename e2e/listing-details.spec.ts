import { expect, type Page, test } from "@playwright/test";
import { createVerifiedAccount } from "./support/accounts";
import { leaveSummaryWithoutPhotos, publishListing } from "./support/listings";

// Página de detalhes do anúncio (#27), com a regra de contato da #32.

const TITLE = "Quarto mobiliado perto da UFPI";

// Os tiles do mapa vêm do OpenStreetMap; os testes não dependem deles
test.beforeEach(async ({ context }) => {
  await context.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
});

/** Dono (com o WhatsApp do cadastro) publica um anúncio; devolve o caminho. */
async function publishWithWhatsapp(page: Page) {
  const owner = await createVerifiedAccount(page, "Dona Rita", "ANUNCIANTE");

  await publishListing(page);
  await leaveSummaryWithoutPhotos(page, "Ver anúncio");
  await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
  return { path: new URL(page.url()).pathname, email: owner.email };
}

test("visitante vê o anúncio e o mapa, mas não o contato", async ({
  page,
  browser,
}) => {
  const { path, email } = await publishWithWhatsapp(page);
  // O dono vê o aviso de que é o anúncio dele
  await expect(page.getByRole("note")).toContainText("Este é o seu anúncio");

  const visitorContext = await browser.newContext();
  const visitor = await visitorContext.newPage();
  const response = await visitor.goto(path);
  expect(response?.status()).toBe(200);

  await expect(visitor.getByRole("heading", { name: TITLE })).toBeVisible();
  await expect(
    visitor.getByRole("complementary").getByText(/R\$\s750,00/),
  ).toBeVisible();
  await expect(visitor.getByText("2 vagas disponíveis")).toBeVisible();
  await expect(
    visitor.getByText(/Rua Desembargador Pires de Castro, 1100/),
  ).toBeVisible();
  await expect(visitor.locator(".leaflet-container")).toBeVisible();
  // O Nominatim não tem o número: a página avisa que o ponto é aproximado
  await expect(
    visitor.getByText(/^Localização aproximada: o ponto está na rua/),
  ).toBeVisible();

  // Prévia do link ao compartilhar
  await expect(visitor.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    TITLE,
  );
  await expect(
    visitor.locator('meta[property="og:description"]'),
  ).toHaveAttribute("content", /R\$\s750,00\/mês em Centro, Teresina - PI/);

  // Contato: nem o e-mail nem o telefone chegam ao HTML
  await expect(
    visitor.getByText("Entre com seu e-mail de estudante para ver o contato."),
  ).toBeVisible();
  // Depois de entrar, volta para o anúncio
  const contact = visitor.getByRole("region", { name: "Contato" });
  await expect(contact.getByRole("link", { name: "Entrar" })).toHaveAttribute(
    "href",
    `/login?next=${encodeURIComponent(path)}`,
  );
  await expect(
    contact.getByRole("link", { name: "Criar conta de estudante" }),
  ).toHaveAttribute("href", "/cadastro?papel=estudante");
  const html = await response!.text();
  expect(html).not.toContain(email);
  expect(html).not.toContain("99999");
  expect(html).not.toContain("wa.me");

  // Distância: aparece ao escolher um campus, e o link guarda a escolha
  await expect(
    visitor.getByText("Escolha um campus para ver a distância"),
  ).toBeVisible();
  await visitor
    .getByLabel("Escolher campus")
    .selectOption({ label: "UFPI · Campus Ministro Petrônio Portella" });
  await expect(visitor).toHaveURL(/\?campus=ufpi-petronio-portella$/);
  await expect(
    visitor.getByRole("listitem").filter({ hasText: "Petrônio Portella" }),
  ).toContainText(/\d+(,\d)? km|\d+ m/);

  await visitorContext.close();
});

test("estudante vê o contato e a distância até o campus dele", async ({
  page,
  browser,
}) => {
  const { path, email } = await publishWithWhatsapp(page);

  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  await createVerifiedAccount(student, "Aluno Curioso", "ESTUDANTE");
  await student.goto(path);

  // Estudante da UFPI: a distância até o campus da UFPI já aparece
  await expect(
    student.getByRole("listitem").filter({ hasText: "Petrônio Portella" }),
  ).toContainText(/\d+(,\d)? km|\d+ m/);

  const contact = student.getByRole("region", { name: "Contato" });
  await expect(contact).toContainText("Anunciado por Dona Rita");
  const whatsapp = contact.getByRole("link", { name: /WhatsApp/ });
  await expect(whatsapp).toContainText("(86) 99999-8888");
  const href = new URL((await whatsapp.getAttribute("href"))!);
  expect(href.origin + href.pathname).toBe("https://wa.me/5586999998888");
  expect(href.searchParams.get("text")).toContain(TITLE);
  await expect(contact.getByRole("link", { name: email })).toHaveAttribute(
    "href",
    /^mailto:/,
  );

  await studentContext.close();
});

test("anunciante não vê o contato de outro anúncio", async ({
  page,
  browser,
}) => {
  const { path } = await publishWithWhatsapp(page);

  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  await createVerifiedAccount(other, "Outro Dono", "ANUNCIANTE");
  await other.goto(path);

  await expect(
    other.getByText(
      "O contato aparece só para estudantes com e-mail institucional.",
    ),
  ).toBeVisible();
  await expect(other.getByRole("link", { name: /WhatsApp/ })).toHaveCount(0);

  await otherContext.close();
});

test("anúncio pausado só aparece para o dono; inexistente dá 404", async ({
  page,
  browser,
}) => {
  await createVerifiedAccount(page, "Dono Pausado", "ANUNCIANTE");
  await publishListing(page);
  await page.goto("/meus-anuncios");
  const item = page.getByRole("listitem", { name: TITLE });
  await item.getByRole("button", { name: "Pausar" }).click();
  await expect(item).toContainText("Pausado");
  await item.getByRole("link", { name: "Ver", exact: true }).click();
  await expect(page.getByRole("note")).toContainText(
    "Este anúncio está pausado",
  );
  const path = new URL(page.url()).pathname;

  const visitorContext = await browser.newContext();
  const visitor = await visitorContext.newPage();
  expect((await visitor.goto(path))?.status()).toBe(404);
  await expect(visitor.getByText("Página não encontrada")).toBeVisible();
  expect((await visitor.goto("/anuncios/nao-existe"))?.status()).toBe(404);
  await visitorContext.close();
});
