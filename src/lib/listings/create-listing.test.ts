import { describe, expect, it, vi } from "vitest";
import { GeocodingError, type GeocodeResult } from "@/lib/geo/geocode";
import {
  ADDRESS_NOT_FOUND,
  createListing,
  GEOCODING_UNAVAILABLE,
} from "./create-listing";
import type { ListingInput } from "./listing-schema";

// `@/lib/prisma` abre conexão ao ser importado; aqui o banco é falso
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const input: ListingInput = {
  title: "Quarto perto da UFPI",
  description: "Quarto mobiliado, com ar-condicionado e internet inclusa.",
  type: "QUARTO",
  price: "650,00",
  availableSpots: "2",
  zipCode: "64049-550",
  street: "Rua Desembargador Pires de Castro",
  number: "1100",
  complement: "",
  neighborhood: "Ininga",
  city: "Teresina",
  state: "PI",
};

const found: GeocodeResult = {
  latitude: -5.06,
  longitude: -42.8,
  precision: "rua",
  displayName: "Rua Desembargador Pires de Castro, Ininga, Teresina",
};

function setup(geocode: () => Promise<GeocodeResult | null>) {
  const deps = {
    geocode: vi.fn(geocode),
    saveListing: vi.fn(async () => ({ id: "anuncio-1" })),
  };
  return deps;
}

describe("createListing", () => {
  it("geocodifica com bairro e CEP e salva com as coordenadas", async () => {
    const deps = setup(async () => found);

    await expect(createListing("user-1", input, deps)).resolves.toEqual({
      ok: true,
      listingId: "anuncio-1",
      precision: "rua",
      displayName: found.displayName,
    });
    expect(deps.geocode).toHaveBeenCalledWith({
      street: "Rua Desembargador Pires de Castro",
      number: "1100",
      neighborhood: "Ininga",
      city: "Teresina",
      state: "PI",
      zipCode: "64049550",
    });
    expect(deps.saveListing).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: "user-1",
        price: 65_000,
        availableSpots: 2,
        latitude: -5.06,
        longitude: -42.8,
      }),
    );
  });

  it("não salva nem geocodifica dados inválidos", async () => {
    const deps = setup(async () => found);

    const result = await createListing(
      "user-1",
      { ...input, price: "abc" },
      deps,
    );
    expect(result).toMatchObject({ ok: false });
    expect(result.ok ? null : result.fieldErrors?.price).toHaveLength(1);
    expect(deps.geocode).not.toHaveBeenCalled();
    expect(deps.saveListing).not.toHaveBeenCalled();
  });

  it("não salva quando o endereço não é encontrado", async () => {
    const deps = setup(async () => null);

    await expect(createListing("user-1", input, deps)).resolves.toEqual({
      ok: false,
      fieldErrors: { street: [ADDRESS_NOT_FOUND] },
    });
    expect(deps.saveListing).not.toHaveBeenCalled();
  });

  it("explica quando o serviço de localização está fora", async () => {
    const deps = setup(async () => {
      throw new GeocodingError("Nominatim respondeu HTTP 503");
    });

    await expect(createListing("user-1", input, deps)).resolves.toEqual({
      ok: false,
      message: GEOCODING_UNAVAILABLE,
    });
    expect(deps.saveListing).not.toHaveBeenCalled();
  });

  it("não esconde erros inesperados", async () => {
    const deps = setup(async () => {
      throw new TypeError("bug");
    });
    await expect(createListing("user-1", input, deps)).rejects.toThrow("bug");
  });
});
