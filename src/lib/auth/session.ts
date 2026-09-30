import { headers } from "next/headers";
import { auth } from "./server";

/**
 * Sessão do usuário logado (ou `null`), para Server Components e Server Actions.
 * Em componentes do navegador, use `authClient.useSession()`.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Como `getSession`, mas devolve `null` se o banco falhar, em vez de lançar.
 * Para o cabeçalho do site: com o banco fora do ar, ele aparece como para
 * visitante e a própria página mostra o erro (app/error.tsx).
 */
export async function getSessionOrNull() {
  // Fora do catch: `headers()` avisa o Next (lançando um erro interno no
  // build) que a página é dinâmica. Engolir isso deixaria a página estática,
  // com o cabeçalho de visitante até para quem está logado.
  const requestHeaders = await headers();
  try {
    return await auth.api.getSession({ headers: requestHeaders });
  } catch (error) {
    console.error("Não foi possível ler a sessão", error);
    return null;
  }
}
