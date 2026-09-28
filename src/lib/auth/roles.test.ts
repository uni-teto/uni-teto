import { describe, expect, it, vi } from "vitest";
import { UserRole as PrismaUserRole } from "@/generated/prisma/enums";
import { DomainNotAllowedError } from "./email-domain";
import {
  assertRoleUnchanged,
  InvalidRoleError,
  isUserRole,
  RoleChangeNotAllowedError,
  roleFromParam,
  universityIdForNewUser,
  USER_ROLES,
} from "./roles";

const findByDomain = vi.fn(async (domain: string) =>
  domain === "ufpi.edu.br" ? { id: "ufpi" } : null,
);

describe("universityIdForNewUser", () => {
  it("vincula o estudante à universidade do domínio", async () => {
    await expect(
      universityIdForNewUser("ESTUDANTE", "maria@ufpi.edu.br", findByDomain),
    ).resolves.toBe("ufpi");
  });

  it("recusa estudante com e-mail fora das universidades", async () => {
    await expect(
      universityIdForNewUser("ESTUDANTE", "maria@gmail.com", findByDomain),
    ).rejects.toBeInstanceOf(DomainNotAllowedError);
  });

  it("aceita anunciante com qualquer e-mail, sem universidade", async () => {
    findByDomain.mockClear();
    await expect(
      universityIdForNewUser("ANUNCIANTE", "dono@gmail.com", findByDomain),
    ).resolves.toBeNull();
    expect(findByDomain).not.toHaveBeenCalled();
  });

  it("não vincula anunciante à universidade mesmo com e-mail institucional", async () => {
    await expect(
      universityIdForNewUser("ANUNCIANTE", "prof@ufpi.edu.br", findByDomain),
    ).resolves.toBeNull();
  });

  it.each([undefined, "", "ADMIN", "estudante"])(
    "recusa papel inválido: %j",
    async (role) => {
      await expect(
        universityIdForNewUser(role, "maria@ufpi.edu.br", findByDomain),
      ).rejects.toBeInstanceOf(InvalidRoleError);
    },
  );
});

describe("assertRoleUnchanged", () => {
  it("deixa atualizar outros campos", () => {
    expect(() => assertRoleUnchanged({ name: "Maria" })).not.toThrow();
  });

  it("impede trocar o papel", () => {
    expect(() => assertRoleUnchanged({ role: "ESTUDANTE" })).toThrow(
      RoleChangeNotAllowedError,
    );
  });
});

describe("USER_ROLES", () => {
  it("é igual ao enum UserRole do banco", () => {
    expect([...USER_ROLES].sort()).toEqual(
      Object.values(PrismaUserRole).sort(),
    );
  });
});

describe("isUserRole / roleFromParam", () => {
  it("reconhece só os papéis válidos", () => {
    expect(isUserRole("ESTUDANTE")).toBe(true);
    expect(isUserRole("ANUNCIANTE")).toBe(true);
    expect(isUserRole("ADMIN")).toBe(false);
  });

  it("lê o papel da URL do cadastro", () => {
    expect(roleFromParam("anunciante")).toBe("ANUNCIANTE");
    expect(roleFromParam("estudante")).toBe("ESTUDANTE");
    expect(roleFromParam("admin")).toBeUndefined();
    expect(roleFromParam(["anunciante"])).toBeUndefined();
    expect(roleFromParam(undefined)).toBeUndefined();
  });
});
