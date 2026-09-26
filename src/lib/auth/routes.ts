// Para onde o link do e-mail de confirmação leva depois de validar o token.
// Em caso de erro, o Better Auth acrescenta `?error=CODIGO`.
export const EMAIL_VERIFIED_PATH = "/email-verificado";

// Página do link de redefinição de senha. O Better Auth acrescenta
// `?token=...` (link válido) ou `?error=INVALID_TOKEN`.
export const RESET_PASSWORD_PATH = "/redefinir-senha";

export const SIGN_IN_PATH = "/login";

export const FORGOT_PASSWORD_PATH = "/esqueci-senha";

/**
 * Caminho interno seguro para voltar depois do login (`/login?next=...`).
 * Aceita só caminhos do próprio site: bloqueia URLs externas como
 * `https://outro.site` e `//outro.site`, que causariam um "open redirect".
 */
export function safeRedirectPath(next: string | string[] | null | undefined) {
  if (typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/";
  }
  return next;
}

/** `/login?next=<caminho atual>`, usado ao exigir login. */
export function signInUrl(next: string) {
  if (next === "/") return SIGN_IN_PATH;
  return `${SIGN_IN_PATH}?next=${encodeURIComponent(next)}`;
}
