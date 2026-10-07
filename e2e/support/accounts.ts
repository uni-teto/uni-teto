import { expect, type Page } from "@playwright/test";
import { waitForEmailLink } from "./mailpit";

// Senha só dos testes E2E (contas criadas no banco local/CI)
export const TEST_PASSWORD = "senha-e2e-123";
export const TEST_WHATSAPP = "(86) 99999-8888";

export type Role = "ESTUDANTE" | "ANUNCIANTE";

// Estudante precisa de um domínio do seed (UFPI); anunciante usa qualquer um
// (example.com é reservado para testes; o Mailpit captura tudo)
const DOMAINS: Record<Role, string> = {
  ESTUDANTE: "ufpi.edu.br",
  ANUNCIANTE: "example.com",
};

/** E-mail único por teste. */
export function uniqueEmail(role: Role = "ESTUDANTE") {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `e2e-${id}@${DOMAINS[role]}`;
}

/** Opção de papel no cadastro ("Procurar moradia" / "Anunciar imóvel"). */
export function roleOption(page: Page, role: Role) {
  const name = role === "ESTUDANTE" ? /Procurar moradia/ : /Anunciar imóvel/;
  return page.getByRole("radio", { name });
}

/**
 * Escolhe o papel clicando no cartão, como uma pessoa faria. O botão de opção
 * fica escondido visualmente dentro do cartão, então clicar direto nele não
 * funciona (o cartão está por cima).
 */
export async function chooseRole(page: Page, role: Role) {
  const option = roleOption(page, role);
  await page.locator("label").filter({ has: option }).click();
  await expect(option).toBeChecked();
}

export async function fillSignUpForm(
  page: Page,
  name: string,
  email: string,
  role: Role = "ESTUDANTE",
) {
  await page.goto("/cadastro");
  await chooseRole(page, role);
  // "Maria Clara Souza" → nome "Maria", sobrenome "Clara Souza"
  const [first, ...rest] = name.split(" ");
  await page.getByLabel("Nome", { exact: true }).fill(first);
  await page.getByLabel("Sobrenome").fill(rest.join(" ") || "E2E");
  await page.getByLabel("Sexo").selectOption({ label: "Prefiro não informar" });
  await page.getByLabel("WhatsApp").fill(TEST_WHATSAPP);
  // O rótulo do e-mail muda conforme o papel escolhido
  await page
    .getByLabel(role === "ESTUDANTE" ? "E-mail institucional" : "E-mail", {
      exact: true,
    })
    .fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD);
  await page.getByLabel("Confirme a senha").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Criar conta" }).click();
}

/** Cria a conta e confirma o e-mail. Termina logado, em /email-verificado. */
export async function createVerifiedAccount(
  page: Page,
  name = "Teste E2E",
  role: Role = "ESTUDANTE",
) {
  const email = uniqueEmail(role);
  await fillSignUpForm(page, name, email, role);
  await expect(page.getByRole("status")).toContainText(email);

  const link = await waitForEmailLink(email, "Confirme seu e-mail");
  await page.goto(link);
  await expect(
    page.getByRole("heading", { name: "E-mail confirmado" }),
  ).toBeVisible();

  return { email, name };
}

export async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}
