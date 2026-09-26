import { describe, expect, it } from "vitest";
import { z } from "zod";
import { signInSchema, type SignInInput } from "./sign-in-schema";

const valid: SignInInput = {
  email: "maria@ufpi.edu.br",
  password: "senha-segura",
};

function errorsOf(input: SignInInput) {
  const result = signInSchema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("signInSchema", () => {
  it("aceita e-mail e senha", () => {
    expect(signInSchema.safeParse(valid).success).toBe(true);
  });

  it("normaliza o e-mail", () => {
    const data = signInSchema.parse({ ...valid, email: " Maria@UFPI.edu.br " });
    expect(data.email).toBe("maria@ufpi.edu.br");
  });

  it("exige e-mail válido", () => {
    expect(errorsOf({ ...valid, email: "maria" }).email).toEqual([
      "Informe um e-mail válido.",
    ]);
  });

  it("exige senha", () => {
    expect(errorsOf({ ...valid, password: "" }).password).toEqual([
      "Informe sua senha.",
    ]);
  });

  it("não aplica regra de tamanho na senha do login", () => {
    expect(signInSchema.safeParse({ ...valid, password: "123" }).success).toBe(
      true,
    );
  });
});
