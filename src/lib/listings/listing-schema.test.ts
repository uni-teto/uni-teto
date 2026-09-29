import { describe, expect, it } from "vitest";
import { z } from "zod";
import { listingSchema, type ListingInput } from "./listing-schema";

const valid: ListingInput = {
  title: "Quarto perto da UFPI",
  description: "Quarto mobiliado, com ar-condicionado e internet inclusa.",
  type: "QUARTO",
  price: "650,00",
  availableSpots: "1",
  zipCode: "64049-550",
  street: "Rua Desembargador Pires de Castro",
  number: "1100",
  complement: "",
  neighborhood: "Ininga",
  city: "Teresina",
  state: "PI",
};

function errorsOf(input: ListingInput) {
  const result = listingSchema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("listingSchema", () => {
  it("converte o formulário para os dados do banco", () => {
    expect(
      listingSchema.parse({ ...valid, title: "  Quarto perto da UFPI " }),
    ).toMatchObject({
      title: "Quarto perto da UFPI",
      price: 65_000,
      availableSpots: 1,
      zipCode: "64049550",
      complement: null,
      state: "PI",
    });
  });

  it("guarda o complemento quando preenchido", () => {
    expect(
      listingSchema.parse({ ...valid, complement: " Apto 2 " }).complement,
    ).toBe("Apto 2");
  });

  it.each([
    ["49,99", "O valor deve ficar entre R$ 50,00 e R$ 20.000,00."],
    ["20.000,01", "O valor deve ficar entre R$ 50,00 e R$ 20.000,00."],
    ["seiscentos", "Informe o valor, ex: 650,00."],
  ])("recusa preço %j", (price, message) => {
    expect(errorsOf({ ...valid, price }).price).toEqual([message]);
  });

  it.each(["0", "21", "1.5", "", "dois"])("recusa %j vagas", (spots) => {
    expect(
      errorsOf({ ...valid, availableSpots: spots }).availableSpots,
    ).toEqual(["Informe de 1 a 20 vagas."]);
  });

  it("recusa CEP incompleto e estado inválido", () => {
    const errors = errorsOf({ ...valid, zipCode: "6404", state: "XX" });
    expect(errors.zipCode).toEqual(["Informe o CEP com 8 dígitos."]);
    expect(errors.state).toEqual(["Escolha o estado."]);
  });

  it("exige os campos do endereço", () => {
    const errors = errorsOf({ ...valid, street: " ", neighborhood: "" });
    expect(errors.street).toEqual(["Informe a rua."]);
    expect(errors.neighborhood).toEqual(["Informe o bairro."]);
  });

  it("recusa tipo de vaga inválido e descrição curta", () => {
    const errors = errorsOf({
      ...valid,
      type: "CASA" as ListingInput["type"],
      description: "curta",
    });
    expect(errors.type).toEqual(["Escolha o tipo de vaga."]);
    expect(errors.description).toHaveLength(1);
  });
});
