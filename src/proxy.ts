import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { signInUrl } from "@/lib/auth/routes";

/**
 * Manda para o login quem abre uma página que exige conta sem estar logado,
 * guardando o caminho para voltar depois (`/login?next=/perfil`).
 *
 * É só uma checagem rápida pelo cookie (não consulta o banco): cada página e
 * Server Action continua conferindo a sessão de verdade com `getSession()`.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  return NextResponse.redirect(
    new URL(signInUrl(pathname + search), request.url),
  );
}

// Páginas que exigem login. Ao criar novas (ex: criar/editar anúncio),
// acrescente aqui. O matcher precisa ser uma lista fixa (lida no build).
export const config = {
  matcher: ["/perfil/:path*"],
};
