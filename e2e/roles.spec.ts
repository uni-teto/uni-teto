import { expect, test } from "@playwright/test";
import {
  createVerifiedAccount,
  roleOption,
  TEST_PASSWORD,
  uniqueEmail,
} from "./support/accounts";

// Papéis estudante/anunciante (#40). Precisa do banco com o seed e do Mailpit.

test("cadastro exige escolher entre procurar moradia e anunciar", async ({
  page,
}) => {
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill("Sem Papel");
  await page
    .getByLabel("E-mail institucional", { exact: true })
    .fill(uniqueEmail());
  await page.getByLabel("Senha", { exact: true }).fill(TEST_PASSWORD);
  await page.getByLabel("Confirme a senha").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(
    page.getByText("Escolha se você quer procurar moradia ou anunciar"),
  ).toBeVisible();
});

test("link da página inicial já marca o papel no cadastro", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Quero anunciar" }).click();

  await expect(page).toHaveURL("/cadastro?papel=anunciante");
  await expect(roleOption(page, "ANUNCIANTE")).toBeChecked();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
});

test("estudante fica vinculado à universidade do e-mail", async ({ page }) => {
  await createVerifiedAccount(page, "Estudante E2E", "ESTUDANTE");

  await page.goto("/perfil");
  await expect(page.getByText("Estudante", { exact: true })).toBeVisible();
  await expect(page.getByText("Universidade Federal do Piauí")).toBeVisible();
});

test("anunciante se cadastra com e-mail comum e não tem universidade", async ({
  page,
}) => {
  await createVerifiedAccount(page, "Anunciante E2E", "ANUNCIANTE");

  await expect(
    page.getByRole("heading", { name: "Anuncie para universitários" }),
  ).toBeHidden(); // ainda em /email-verificado
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Anuncie para universitários" }),
  ).toBeVisible();

  await page.goto("/perfil");
  await expect(page.getByText("Anunciante", { exact: true })).toBeVisible();
  await expect(page.getByText("Universidade", { exact: true })).toBeHidden();
});

test("anunciante não consegue virar estudante pela API", async ({
  page,
  baseURL,
}) => {
  await createVerifiedAccount(page, "Anunciante Curioso", "ANUNCIANTE");

  // A rota do Better Auth aceitaria o campo `role`: o servidor tem que barrar
  const response = await page.request.post("/api/auth/update-user", {
    headers: { Origin: baseURL! },
    data: { role: "ESTUDANTE" },
  });
  expect(response.status()).toBe(403);
  expect(await response.json()).toMatchObject({
    code: "ROLE_CHANGE_NOT_ALLOWED",
  });

  await page.goto("/perfil");
  await expect(page.getByText("Anunciante", { exact: true })).toBeVisible();
});
