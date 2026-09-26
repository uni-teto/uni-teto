import { headers } from "next/headers";
import { auth } from "./server";

/**
 * Sessão do usuário logado (ou `null`), para Server Components e Server Actions.
 * Em componentes do navegador, use `authClient.useSession()`.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
