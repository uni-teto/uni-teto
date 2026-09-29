import { describe, expect, it, vi } from "vitest";
import { lookupZipCode, VIA_CEP_URL, ZipCodeLookupError } from "./via-cep";

function fakeFetch(body: unknown, status = 200) {
  return vi.fn(async () =>
    Response.json(body, { status }),
  ) as unknown as typeof fetch;
}

// Resposta real do ViaCEP para 65633-330 (resumida)
const TIMON = {
  cep: "65633-330",
  logradouro: "Rua Firmino José da Silva",
  complemento: "",
  bairro: "Parque Alvorada",
  localidade: "Timon",
  uf: "MA",
  ddd: "99",
};

describe("lookupZipCode", () => {
  it("devolve rua, bairro, cidade e estado do CEP", async () => {
    const fetchFn = fakeFetch(TIMON);
    await expect(lookupZipCode("65633330", fetchFn)).resolves.toEqual({
      street: "Rua Firmino José da Silva",
      neighborhood: "Parque Alvorada",
      city: "Timon",
      state: "MA",
    });
    expect(fetchFn).toHaveBeenCalledWith(
      `${VIA_CEP_URL}/65633330/json/`,
      expect.anything(),
    );
  });

  it("CEP geral de cidade vem sem rua e sem bairro", async () => {
    const fetchFn = fakeFetch({ ...TIMON, logradouro: "", bairro: "" });
    await expect(lookupZipCode("65630000", fetchFn)).resolves.toMatchObject({
      street: "",
      neighborhood: "",
      city: "Timon",
    });
  });

  it("CEP que não existe devolve null", async () => {
    await expect(
      lookupZipCode("99999999", fakeFetch({ erro: "true" })),
    ).resolves.toBeNull();
    await expect(
      lookupZipCode("99999999", fakeFetch({ erro: true })),
    ).resolves.toBeNull();
  });

  it("não consulta CEP incompleto", async () => {
    const fetchFn = fakeFetch(TIMON);
    await expect(lookupZipCode("6563", fetchFn)).resolves.toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("lança ZipCodeLookupError se o serviço falhar ou responder errado", async () => {
    const offline = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    await expect(lookupZipCode("65633330", offline)).rejects.toBeInstanceOf(
      ZipCodeLookupError,
    );
    await expect(
      lookupZipCode("65633330", fakeFetch({}, 500)),
    ).rejects.toBeInstanceOf(ZipCodeLookupError);
    await expect(
      lookupZipCode("65633330", fakeFetch({ ...TIMON, uf: "XX" })),
    ).rejects.toBeInstanceOf(ZipCodeLookupError);
  });
});
