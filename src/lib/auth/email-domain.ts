/**
 * Extrai o domínio de um e-mail, normalizado em minúsculas.
 * Retorna `null` se o e-mail não tiver o formato `algo@dominio`.
 *
 * @example getEmailDomain("Maria@Aluno.UFPI.edu.br") // "aluno.ufpi.edu.br"
 */
export function getEmailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase();

  if (at < 1 || domain === "") return null;
  return domain;
}

export class DomainNotAllowedError extends Error {
  constructor() {
    super(
      "Use o e-mail institucional da sua universidade. Esse domínio não está na lista de universidades cadastradas.",
    );
    this.name = "DomainNotAllowedError";
  }
}

/**
 * Descobre a universidade do usuário pelo domínio do e-mail institucional.
 * Os domínios permitidos são os `emailDomain` das universidades cadastradas.
 *
 * A busca no banco é recebida por parâmetro para a regra poder ser testada
 * sem banco. Lança `DomainNotAllowedError` se o domínio não for permitido.
 */
export async function resolveUniversityId(
  email: string,
  findUniversityByDomain: (domain: string) => Promise<{ id: string } | null>,
): Promise<string> {
  const domain = getEmailDomain(email);
  const university = domain ? await findUniversityByDomain(domain) : null;

  if (!university) throw new DomainNotAllowedError();
  return university.id;
}
