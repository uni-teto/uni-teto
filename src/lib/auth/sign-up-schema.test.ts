import { describe, expect, it } from "vitest";
import { z } from "zod";
import { signUpSchema, type SignUpInput } from "./sign-up-schema";

const valid: SignUpInput = {
  name: "Maria Silva",
  email: "maria@ufpi.edu.br",
  password: "senha-segura",
  confirmPassword: "senha-segura",
};

function errorsOf(input: SignUpInput) {
  const result = signUpSchema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("signUpSchema", () => {
  it("aceita um cadastro válido", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("normaliza e-mail e nome", () => {
    const data = signUpSchema.parse({
      ...valid,
      name: "  Maria Silva ",
      email: "  Maria@UFPI.edu.br ",
    });
    expect(data.name).toBe("Maria Silva");
    expect(data.email).toBe("maria@ufpi.edu.br");
  });

  it("exige nome", () => {
    expect(errorsOf({ ...valid, name: " " }).name).toEqual([
      "Informe seu nome.",
    ]);
  });

  it("exige e-mail válido", () => {
    expect(errorsOf({ ...valid, email: "maria@" }).email).toEqual([
      "Informe um e-mail válido.",
    ]);
  });

  it("exige senha com pelo menos 8 caracteres", () => {
    const errors = errorsOf({
      ...valid,
      password: "1234567",
      confirmPassword: "1234567",
    });
    expect(errors.password).toEqual([
      "A senha precisa ter pelo menos 8 caracteres.",
    ]);
  });

  it("exige que as senhas confiram", () => {
    expect(
      errorsOf({ ...valid, confirmPassword: "outra-senha" }).confirmPassword,
    ).toEqual(["As senhas não conferem."]);
  });
});
