import { describe, expect, it } from "vitest";
import { z } from "zod";
import { profileSchema, type ProfileInput } from "./profile-schema";

const valid: ProfileInput = {
  name: " Maria ",
  surname: " Souza ",
  socialName: "",
  sex: "FEMININO",
  whatsapp: "(86) 99999-8888",
};

function errorsOf(input: ProfileInput) {
  const result = profileSchema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("profileSchema", () => {
  it("normaliza os campos e guarda nome social vazio como null", () => {
    expect(profileSchema.parse(valid)).toEqual({
      name: "Maria",
      surname: "Souza",
      socialName: null,
      sex: "FEMININO",
      whatsapp: "5586999998888",
    });
  });

  it("guarda o nome social preenchido", () => {
    expect(profileSchema.parse({ ...valid, socialName: " Joana " })).toEqual(
      expect.objectContaining({ socialName: "Joana" }),
    );
  });

  it("recusa nome social de uma letra", () => {
    expect(errorsOf({ ...valid, socialName: "J" }).socialName).toEqual([
      "Informe o nome social completo ou deixe em branco.",
    ]);
  });

  it("exige o WhatsApp", () => {
    expect(errorsOf({ ...valid, whatsapp: "  " }).whatsapp).toEqual([
      "Informe seu WhatsApp com DDD.",
    ]);
  });

  it("recusa WhatsApp inválido", () => {
    expect(errorsOf({ ...valid, whatsapp: "3222-1111" }).whatsapp).toEqual([
      "Informe um celular com DDD, ex: (86) 99999-8888.",
    ]);
  });

  it("exige sobrenome e sexo", () => {
    const errors = errorsOf({
      ...valid,
      surname: "",
      sex: "" as ProfileInput["sex"],
    });
    expect(errors.surname).toEqual(["Informe seu sobrenome."]);
    expect(errors.sex).toEqual(["Escolha uma opção."]);
  });

  it("usa a mesma regra de nome do cadastro", () => {
    expect(errorsOf({ ...valid, name: "" }).name).toHaveLength(1);
  });
});
