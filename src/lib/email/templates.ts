export type EmailContent = { subject: string; text: string; html: string };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** E-mail com o link de confirmação enviado após o cadastro. */
export function verificationEmail({
  name,
  url,
  expiresInHours,
}: {
  name: string;
  url: string;
  expiresInHours: number;
}): EmailContent {
  const subject = "Confirme seu e-mail no UniTeto";
  const text = [
    `Olá, ${name}!`,
    "",
    "Para ativar sua conta no UniTeto, confirme seu e-mail abrindo o link abaixo:",
    url,
    "",
    `O link vale por ${expiresInHours} horas. Se você não criou uma conta, ignore este e-mail.`,
  ].join("\n");

  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(url);
  const html = `<p>Olá, ${safeName}!</p>
<p>Para ativar sua conta no UniTeto, confirme seu e-mail:</p>
<p><a href="${safeUrl}">Confirmar e-mail</a></p>
<p>Se o botão não funcionar, copie e cole este endereço no navegador:<br>${safeUrl}</p>
<p>O link vale por ${expiresInHours} horas. Se você não criou uma conta, ignore este e-mail.</p>`;

  return { subject, text, html };
}

/** E-mail com o link para escolher uma nova senha ("Esqueci minha senha"). */
export function resetPasswordEmail({
  name,
  url,
  expiresInMinutes,
}: {
  name: string;
  url: string;
  expiresInMinutes: number;
}): EmailContent {
  const subject = "Redefina sua senha no UniTeto";
  const text = [
    `Olá, ${name}!`,
    "",
    "Recebemos um pedido para redefinir a senha da sua conta no UniTeto. Para escolher uma nova senha, abra o link abaixo:",
    url,
    "",
    `O link vale por ${expiresInMinutes} minutos. Se você não pediu, ignore este e-mail: sua senha continua a mesma.`,
  ].join("\n");

  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(url);
  const html = `<p>Olá, ${safeName}!</p>
<p>Recebemos um pedido para redefinir a senha da sua conta no UniTeto.</p>
<p><a href="${safeUrl}">Escolher nova senha</a></p>
<p>Se o botão não funcionar, copie e cole este endereço no navegador:<br>${safeUrl}</p>
<p>O link vale por ${expiresInMinutes} minutos. Se você não pediu, ignore este e-mail: sua senha continua a mesma.</p>`;

  return { subject, text, html };
}

/**
 * Enviado quando alguém tenta se cadastrar com um e-mail que já tem conta.
 * O site mostra a mesma mensagem de um cadastro novo (para não revelar quais
 * e-mails existem); é por este e-mail que o dono da conta fica sabendo.
 */
export function existingAccountEmail({
  name,
  signInUrl,
  forgotPasswordUrl,
}: {
  name: string;
  signInUrl: string;
  forgotPasswordUrl: string;
}): EmailContent {
  const subject = "Você já tem uma conta no UniTeto";
  const text = [
    `Olá, ${name}!`,
    "",
    "Alguém (provavelmente você) tentou criar uma conta no UniTeto com este e-mail, mas ele já está cadastrado.",
    `Para entrar: ${signInUrl}`,
    `Esqueceu a senha? ${forgotPasswordUrl}`,
    "",
    "Se não foi você, ignore este e-mail.",
  ].join("\n");

  const safeName = escapeHtml(name);
  const safeSignIn = escapeHtml(signInUrl);
  const safeForgot = escapeHtml(forgotPasswordUrl);
  const html = `<p>Olá, ${safeName}!</p>
<p>Alguém (provavelmente você) tentou criar uma conta no UniTeto com este e-mail, mas ele já está cadastrado.</p>
<p><a href="${safeSignIn}">Entrar na conta</a> · <a href="${safeForgot}">Esqueci minha senha</a></p>
<p>Se não foi você, ignore este e-mail.</p>`;

  return { subject, text, html };
}
