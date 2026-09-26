import { expect, test } from "@playwright/test";
import {
  createVerifiedAccount,
  fillSignUpForm,
  signIn,
  TEST_PASSWORD,
} from "./support/accounts";
import { waitForEmailLink } from "./support/mailpit";

// Precisa do banco com o seed e do Mailpit (docker compose up -d)

test("cadastro recusa e-mail fora das universidades cadastradas", async ({
  page,
}) => {
  await fillSignUpForm(page, "Fulano", "fulano@gmail.com");

  await expect(page.getByText("Esse domínio não está na lista")).toBeVisible();
});

test("cadastro, confirmação por e-mail, perfil, saída e novo login", async ({
  page,
}) => {
  const { email } = await createVerifiedAccount(page, "Maria Clara Souza");

  // Já entra logado depois de confirmar: o menu mostra o primeiro nome
  const menu = page.getByRole("button", { name: "Menu da conta" });
  await expect(menu).toContainText("Olá, Maria");

  // Perfil: WhatsApp com máscara enquanto digita
  await menu.click();
  await page.getByRole("menuitem", { name: "Meu perfil" }).click();
  await expect(page).toHaveURL("/perfil");
  const whatsapp = page.getByLabel("WhatsApp (opcional)");
  await whatsapp.pressSequentially("86999998888");
  await expect(whatsapp).toHaveValue("(86) 99999-8888");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Alterações salvas.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("WhatsApp (opcional)")).toHaveValue(
    "(86) 99999-8888",
  );

  // Sair e entrar de novo
  await page.getByRole("button", { name: "Menu da conta" }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

  await page.getByRole("link", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/login");
  await signIn(page, email, TEST_PASSWORD);
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("button", { name: "Menu da conta" }),
  ).toBeVisible();
});

test("página protegida manda para o login e volta para ela depois", async ({
  page,
  context,
}) => {
  const { email } = await createVerifiedAccount(page);
  await context.clearCookies();

  await page.goto("/perfil");
  await expect(page).toHaveURL("/login?next=%2Fperfil");

  await signIn(page, email, TEST_PASSWORD);
  await expect(page).toHaveURL("/perfil");
  await expect(page.getByRole("heading", { name: "Meu perfil" })).toBeVisible();
});

test("login não redireciona para outro site", async ({ page, context }) => {
  const { email } = await createVerifiedAccount(page);
  await context.clearCookies();

  await page.goto("/login?next=//exemplo.com");
  await signIn(page, email, TEST_PASSWORD);
  await expect(page).toHaveURL("/");
});

test("esqueci minha senha: redefine e entra com a senha nova", async ({
  page,
  context,
}) => {
  const { email } = await createVerifiedAccount(page);
  await context.clearCookies();

  await page.goto("/login");
  await page.getByRole("link", { name: "Esqueci minha senha" }).click();
  await expect(page).toHaveURL("/esqueci-senha");
  await page.getByLabel("E-mail institucional").fill(email);
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByRole("status")).toContainText(email);

  const link = await waitForEmailLink(email, "Redefina sua senha");
  await page.goto(link);
  await expect(page).toHaveURL(/\/redefinir-senha\?token=/);

  const newPassword = "senha-nova-e2e-456";
  await page.getByLabel("Nova senha", { exact: true }).fill(newPassword);
  await page.getByLabel("Confirme a nova senha").fill(newPassword);
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await page.getByRole("link", { name: "Entrar com a nova senha" }).click();
  await expect(page).toHaveURL("/login");

  // A senha antiga não vale mais
  await signIn(page, email, TEST_PASSWORD);
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();

  await signIn(page, email, newPassword);
  await expect(page).toHaveURL("/");
});

test("link de redefinição inválido explica e oferece um novo", async ({
  page,
}) => {
  await page.goto("/redefinir-senha?error=INVALID_TOKEN");
  await expect(
    page.getByRole("heading", { name: "Link inválido ou expirado" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Pedir novo link" }),
  ).toBeVisible();
});
