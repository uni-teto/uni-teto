import { expect, type Page } from "@playwright/test";
import { waitForEmailLink } from "./mailpit";

// Senha só dos testes E2E (contas criadas no banco local/CI)
export const TEST_PASSWORD = "senha-e2e-123";

/** E-mail único por teste, num domínio do seed (UFPI). */
export function uniqueEmail() {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `e2e-${id}@ufpi.edu.br`;
}

export async function fillSignUpForm(page: Page, name: string, email: string) {
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("E-mail institucional").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD);
  await page.getByLabel("Confirme a senha").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Criar conta" }).click();
}

/** Cria a conta e confirma o e-mail. Termina logado, em /email-verificado. */
export async function createVerifiedAccount(page: Page, name = "Teste E2E") {
  const email = uniqueEmail();
  await fillSignUpForm(page, name, email);
  await expect(page.getByRole("status")).toContainText(email);

  const link = await waitForEmailLink(email, "Confirme seu e-mail");
  await page.goto(link);
  await expect(
    page.getByRole("heading", { name: "E-mail confirmado" }),
  ).toBeVisible();

  return { email, name };
}

export async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel("E-mail institucional").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}
