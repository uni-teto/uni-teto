import { describe, expect, it } from "vitest";
import { listingToInput, type StoredListing } from "./listing-input";
import { listingSchema } from "./listing-schema";

const stored: StoredListing = {
  title: "Quarto perto da UFPI",
  description: "Quarto mobiliado, com ar-condicionado e internet inclusa.",
  type: "VAGA_REPUBLICA",
  priceCents: 120_050,
  availableSpots: 3,
  zipCode: "64049550",
  street: "Rua Desembargador Pires de Castro",
  number: "1100",
  complement: null,
  neighborhood: "Ininga",
  city: "Teresina",
  state: "PI",
};

describe("listingToInput", () => {
  it("mostra preço em reais e CEP com hífen", () => {
    expect(listingToInput(stored)).toMatchObject({
      price: "1.200,50",
      availableSpots: "3",
      zipCode: "64049-550",
      complement: "",
    });
  });

  it("volta aos mesmos dados ao salvar sem mudar nada", () => {
    const data = listingSchema.parse(listingToInput(stored));
    expect(data).toMatchObject({
      price: stored.priceCents,
      availableSpots: stored.availableSpots,
      zipCode: stored.zipCode,
      complement: null,
      type: stored.type,
    });
  });
});
