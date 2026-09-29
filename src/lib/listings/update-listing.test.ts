import { describe, expect, it, vi } from "vitest";
import { GeocodingError, type GeocodeResult } from "@/lib/geo/geocode";
import { ADDRESS_NOT_FOUND, GEOCODING_UNAVAILABLE } from "./create-listing";
import type { ListingInput } from "./listing-schema";
import {
  addressChanged,
  updateListing,
  type ListingAddress,
} from "./update-listing";

// `@/lib/prisma` abre conexão ao ser importado; aqui o banco é falso
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const saved: ListingAddress = {
  street: "Rua Desembargador Pires de Castro",
  number: "1100",
  neighborhood: "Centro",
  city: "Teresina",
  state: "PI",
  zipCode: "64001390",
};

const input: ListingInput = {
  title: "Quarto mobiliado perto da UFPI",
  description: "Quarto com ar-condicionado, internet e contas inclusas.",
  type: "QUARTO",
  price: "800,00",
  availableSpots: "1",
  zipCode: "64001-390",
  street: "Rua Desembargador Pires de Castro",
  number: "1100",
  complement: "",
  neighborhood: "Centro",
  city: "Teresina",
  state: "PI",
};

const found: GeocodeResult = {
  latitude: -5.06,
  longitude: -42.79,
  precision: "rua",
  displayName: "Rua Olavo Bilac, Centro, Teresina",
};

function setup(
  geocode: () => Promise<GeocodeResult | null> = async () => found,
) {
  return {
    geocode: vi.fn(geocode),
    findAddress: vi.fn(async () => saved),
    saveListing: vi.fn(async () => {}),
  };
}

describe("addressChanged", () => {
  it("ignora maiúsculas, acentos e espaços", () => {
    expect(
      addressChanged(saved, {
        ...saved,
        street: "  rua desembargador  pires de castro ",
        city: "TERESINA",
      }),
    ).toBe(false);
  });

  it("detecta mudança de rua, número, bairro, CEP, cidade ou estado", () => {
    for (const change of [
      { street: "Rua Olavo Bilac" },
      { number: "200" },
      { neighborhood: "Ininga" },
      { zipCode: "64049550" },
      { city: "Timon" },
      { state: "MA" as const },
    ]) {
      expect(addressChanged(saved, { ...saved, ...change })).toBe(true);
    }
  });
});

describe("updateListing", () => {
  it("salva sem consultar o mapa se o endereço não mudou", async () => {
    const deps = setup();

    await expect(updateListing("anuncio-1", input, deps)).resolves.toEqual({
      ok: true,
      relocated: false,
    });
    expect(deps.geocode).not.toHaveBeenCalled();
    expect(deps.saveListing).toHaveBeenCalledWith(
      "anuncio-1",
      expect.objectContaining({ price: 80_000 }),
      null,
    );
  });

  it("geocodifica de novo quando o endereço muda", async () => {
    const deps = setup();

    await expect(
      updateListing("anuncio-1", { ...input, street: "Rua Olavo Bilac" }, deps),
    ).resolves.toEqual({
      ok: true,
      relocated: true,
      precision: "rua",
      displayName: found.displayName,
    });
    expect(deps.saveListing).toHaveBeenCalledWith(
      "anuncio-1",
      expect.objectContaining({ street: "Rua Olavo Bilac" }),
      { latitude: -5.06, longitude: -42.79 },
    );
  });

  it("não salva se o endereço novo não for encontrado", async () => {
    const deps = setup(async () => null);

    await expect(
      updateListing("anuncio-1", { ...input, street: "Rua Nenhuma" }, deps),
    ).resolves.toEqual({
      ok: false,
      fieldErrors: { street: [ADDRESS_NOT_FOUND] },
    });
    expect(deps.saveListing).not.toHaveBeenCalled();
  });

  it("não salva se o serviço de localização estiver fora", async () => {
    const deps = setup(async () => {
      throw new GeocodingError("HTTP 503");
    });

    await expect(
      updateListing("anuncio-1", { ...input, number: "200" }, deps),
    ).resolves.toEqual({ ok: false, message: GEOCODING_UNAVAILABLE });
    expect(deps.saveListing).not.toHaveBeenCalled();
  });

  it("não salva dados inválidos", async () => {
    const deps = setup();
    const result = await updateListing(
      "anuncio-1",
      { ...input, price: "" },
      deps,
    );
    expect(result.ok).toBe(false);
    expect(deps.findAddress).not.toHaveBeenCalled();
    expect(deps.saveListing).not.toHaveBeenCalled();
  });
});
