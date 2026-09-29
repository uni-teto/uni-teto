// Para onde o link do e-mail de confirmação leva depois de validar o token.
// Em caso de erro, o Better Auth acrescenta `?error=CODIGO`.
export const EMAIL_VERIFIED_PATH = "/email-verificado";

// Página do link de redefinição de senha. O Better Auth acrescenta
// `?token=...` (link válido) ou `?error=INVALID_TOKEN`.
export const RESET_PASSWORD_PATH = "/redefinir-senha";

export const SIGN_IN_PATH = "/login";

export const FORGOT_PASSWORD_PATH = "/esqueci-senha";

export const NEW_LISTING_PATH = "/anuncios/novo";

export const MY_LISTINGS_PATH = "/meus-anuncios";

/** Página pública de detalhes do anúncio. */
export function listingPath(listingId: string) {
  return `/anuncios/${encodeURIComponent(listingId)}`;
}

/** Página de edição de um anúncio (só o dono). */
export function editListingPath(listingId: string) {
  return `/anuncios/${encodeURIComponent(listingId)}/editar`;
}

/** Página onde o dono gerencia as fotos do anúncio. */
export function listingPhotosPath(listingId: string) {
  return `/anuncios/${encodeURIComponent(listingId)}/fotos`;
}

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

/**
 * Para onde vai quem acabou de entrar sem ter pedido uma página: anunciante
 * para "Meus anúncios"; estudante para a página inicial (a busca, #28, quando
 * existir).
 */
export function homeForRole(role: "ESTUDANTE" | "ANUNCIANTE") {
  return role === "ANUNCIANTE" ? MY_LISTINGS_PATH : "/";
}
