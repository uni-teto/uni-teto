import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./password-reset-schema";

describe("forgotPasswordSchema", () => {
  it("normaliza o e-mail", () => {
    const result = forgotPasswordSchema.parse({ email: "  Ana@UFPI.edu.br " });
    expect(result.email).toBe("ana@ufpi.edu.br");
  });

  it("recusa e-mail inválido", () => {
    expect(forgotPasswordSchema.safeParse({ email: "ana" }).success).toBe(
      false,
    );
  });
});

describe("resetPasswordSchema", () => {
  it("aceita senhas iguais com o tamanho mínimo", () => {
    const result = resetPasswordSchema.safeParse({
      password: "senha-nova-123",
      confirmPassword: "senha-nova-123",
    });
    expect(result.success).toBe(true);
  });

  it("recusa senha curta", () => {
    const result = resetPasswordSchema.safeParse({
      password: "curta",
      confirmPassword: "curta",
    });
    expect(result.success).toBe(false);
  });

  it("aponta o erro na confirmação quando as senhas não conferem", () => {
    const result = resetPasswordSchema.safeParse({
      password: "senha-nova-123",
      confirmPassword: "senha-nova-456",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });
});
