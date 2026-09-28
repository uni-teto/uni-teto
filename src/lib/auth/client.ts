import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./server";

// Cliente do Better Auth para componentes do navegador ("use client").
// Sem `baseURL`: usa a mesma origem da página. `inferAdditionalFields` dá
// os tipos dos campos extras (ex: `role` no cadastro); é só tipo, o código
// do servidor não vai para o navegador.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
