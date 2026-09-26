import { createAuthClient } from "better-auth/react";

// Cliente do Better Auth para componentes do navegador ("use client").
// Sem `baseURL`: usa a mesma origem da página.
export const authClient = createAuthClient();
