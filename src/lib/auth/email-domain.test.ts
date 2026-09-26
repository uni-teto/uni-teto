import { describe, expect, it, vi } from "vitest";
import {
  DomainNotAllowedError,
  getEmailDomain,
  resolveUniversityId,
} from "./email-domain";

describe("getEmailDomain", () => {
  it("retorna o domínio em minúsculas", () => {
    expect(getEmailDomain("Maria@Aluno.UFPI.edu.br")).toBe("aluno.ufpi.edu.br");
  });

  it("ignora espaços nas pontas do domínio", () => {
    expect(getEmailDomain("maria@ufpi.edu.br ")).toBe("ufpi.edu.br");
  });

  it("usa o último @ do e-mail", () => {
    expect(getEmailDomain('"a@b"@ufpi.edu.br')).toBe("ufpi.edu.br");
  });

  it.each(["", "maria", "@ufpi.edu.br", "maria@", "maria@  "])(
    "retorna null para e-mail inválido: %j",
    (email) => {
      expect(getEmailDomain(email)).toBeNull();
    },
  );
});

describe("resolveUniversityId", () => {
  const universities: Record<string, { id: string }> = {
    "ufpi.edu.br": { id: "ufpi" },
    "aluno.uespi.br": { id: "uespi" },
  };
  const findByDomain = vi.fn(
    async (domain: string) => universities[domain] ?? null,
  );

  it("retorna a universidade dona do domínio", async () => {
    await expect(
      resolveUniversityId("maria@UFPI.edu.br", findByDomain),
    ).resolves.toBe("ufpi");
    expect(findByDomain).toHaveBeenLastCalledWith("ufpi.edu.br");
  });

  it("não aceita subdomínio que não está cadastrado", async () => {
    await expect(
      resolveUniversityId("maria@aluno.ufpi.edu.br", findByDomain),
    ).rejects.toBeInstanceOf(DomainNotAllowedError);
  });

  it("recusa e-mail de domínio não permitido", async () => {
    await expect(
      resolveUniversityId("maria@gmail.com", findByDomain),
    ).rejects.toBeInstanceOf(DomainNotAllowedError);
  });

  it("recusa e-mail sem domínio sem consultar o banco", async () => {
    findByDomain.mockClear();
    await expect(
      resolveUniversityId("maria", findByDomain),
    ).rejects.toBeInstanceOf(DomainNotAllowedError);
    expect(findByDomain).not.toHaveBeenCalled();
  });
});
