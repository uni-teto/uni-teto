import { resolveUniversityId } from "./email-domain";

// Papéis de usuário (decisão de 28/09/2026, issue #40):
// - ESTUDANTE: só e-mail institucional, vinculado à universidade; vê o contato
//   dos anúncios.
// - ANUNCIANTE: qualquer e-mail confirmado, sem universidade.
// Os dois podem anunciar. O papel é escolhido no cadastro e não muda depois.

export const USER_ROLES = ["ESTUDANTE", "ANUNCIANTE"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  ESTUDANTE: "Estudante",
  ANUNCIANTE: "Anunciante",
};

export function isUserRole(value: unknown): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

/** Valor de `?papel=` na URL do cadastro → papel pré-selecionado. */
export function roleFromParam(param: string | string[] | undefined) {
  if (param === "anunciante") return "ANUNCIANTE";
  if (param === "estudante") return "ESTUDANTE";
  return undefined;
}

export class InvalidRoleError extends Error {
  constructor() {
    super("Escolha se você quer procurar moradia ou anunciar um imóvel.");
    this.name = "InvalidRoleError";
  }
}

export class RoleChangeNotAllowedError extends Error {
  constructor() {
    super("O tipo de conta não pode ser alterado.");
    this.name = "RoleChangeNotAllowedError";
  }
}

/**
 * Universidade do novo usuário conforme o papel: estudante precisa de e-mail
 * de universidade cadastrada (lança `DomainNotAllowedError`); anunciante não
 * tem universidade, mesmo que use um e-mail institucional.
 */
export async function universityIdForNewUser(
  role: unknown,
  email: string,
  findUniversityByDomain: (domain: string) => Promise<{ id: string } | null>,
): Promise<string | null> {
  if (!isUserRole(role)) throw new InvalidRoleError();
  if (role === "ANUNCIANTE") return null;
  return resolveUniversityId(email, findUniversityByDomain);
}

/**
 * Impede trocar o papel depois do cadastro (ex: anunciante virar estudante
 * pela rota /api/auth/update-user para ver os contatos).
 */
export function assertRoleUnchanged(changes: Record<string, unknown>) {
  if ("role" in changes) throw new RoleChangeNotAllowedError();
}
