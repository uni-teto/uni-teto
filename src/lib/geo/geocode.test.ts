import { describe, expect, it, vi } from "vitest";
import {
  createGeocoder,
  GeocodingError,
  type AddressInput,
  type GeocoderOptions,
} from "./geocode";

const address: AddressInput = {
  street: "Rua Desembargador Pires de Castro",
  number: "1100",
  city: "Teresina",
  state: "PI",
};

type ItemOptions = {
  houseNumber?: string;
  postcode?: string;
  suburb?: string;
  iso?: string;
  displayName?: string;
};

// Formato da resposta jsonv2 com addressdetails=1 (campos que usamos)
function nominatimItem(lat: string, lon: string, opts: ItemOptions = {}) {
  return {
    lat,
    lon,
    display_name:
      opts.displayName ??
      "Rua Desembargador Pires de Castro, Centro, Teresina, Piauí, Brasil",
    address: {
      ...(opts.houseNumber && { house_number: opts.houseNumber }),
      ...(opts.postcode && { postcode: opts.postcode }),
      ...(opts.suburb && { suburb: opts.suburb }),
      "ISO3166-2-lvl4": opts.iso ?? "BR-PI",
    },
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Geocoder com fetch falso e relógio falso (sem esperas de verdade). */
function setup(responses: (Response | Error)[], options: GeocoderOptions = {}) {
  let clock = 0;
  const sleeps: number[] = [];
  const fetchMock = vi.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error("fetch chamado mais vezes que o esperado");
    if (next instanceof Error) throw next;
    return next;
  });
  const geocoder = createGeocoder({
    fetch: fetchMock as unknown as typeof fetch,
    now: () => clock,
    sleep: async (ms) => {
      sleeps.push(ms);
      clock += ms;
    },
    ...options,
  });
  const requestedUrls = () =>
    fetchMock.mock.calls.map(
      (call) => new URL((call as unknown as [string])[0]),
    );
  return { geocoder, fetchMock, sleeps, requestedUrls };
}

describe("createGeocoder", () => {
  it("usa a busca estruturada, com UF por extenso e restrita ao Brasil", async () => {
    const { geocoder, requestedUrls } = setup([
      jsonResponse([nominatimItem("-5.0892", "-42.8016")]),
    ]);
    await geocoder.geocode(address);

    const url = requestedUrls()[0];
    expect(url.origin + url.pathname).toBe(
      "https://nominatim.openstreetmap.org/search",
    );
    expect(url.searchParams.get("street")).toBe(
      "1100 Rua Desembargador Pires de Castro",
    );
    expect(url.searchParams.get("city")).toBe("Teresina");
    expect(url.searchParams.get("state")).toBe("Piauí");
    expect(url.searchParams.get("countrycodes")).toBe("br");
    expect(url.searchParams.get("format")).toBe("jsonv2");
    expect(url.searchParams.get("addressdetails")).toBe("1");
  });

  it("envia um User-Agent que identifica a aplicação", async () => {
    const { geocoder, fetchMock } = setup([jsonResponse([])], {
      userAgent: "UniTeto-teste/1.0",
    });
    await geocoder.geocode({ ...address, number: "s/n" });

    const init = (
      fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    )[1];
    expect(init.headers).toMatchObject({ "User-Agent": "UniTeto-teste/1.0" });
  });

  it('marca precisão "numero" quando o Nominatim acha a casa', async () => {
    const { geocoder } = setup([
      jsonResponse([
        nominatimItem("-5.0892", "-42.8016", { houseNumber: "1100" }),
      ]),
    ]);

    await expect(geocoder.geocode(address)).resolves.toEqual({
      latitude: -5.0892,
      longitude: -42.8016,
      precision: "numero",
      displayName:
        "Rua Desembargador Pires de Castro, Centro, Teresina, Piauí, Brasil",
    });
  });

  it('marca precisão "rua" quando ele devolve só a rua (número fora do OSM)', async () => {
    const { geocoder, fetchMock } = setup([
      jsonResponse([nominatimItem("-5.0914", "-42.8039")]),
    ]);

    const result = await geocoder.geocode(address);
    expect(result?.precision).toBe("rua");
    // Não precisa de uma segunda busca: a rua já veio
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("prefere o resultado com o número da casa", async () => {
    const { geocoder } = setup([
      jsonResponse([
        nominatimItem("-5.01", "-42.01"),
        nominatimItem("-5.02", "-42.02", { houseNumber: "1100" }),
      ]),
    ]);

    const result = await geocoder.geocode(address);
    expect(result).toMatchObject({ latitude: -5.02, precision: "numero" });
  });

  it("escolhe o trecho da rua no bairro informado (sem acento/caixa)", async () => {
    // Ruas longas vêm em vários trechos, um por bairro
    const { geocoder } = setup([
      jsonResponse([
        nominatimItem("-5.0914", "-42.8039", { suburb: "Centro Sul" }),
        nominatimItem("-5.0778", "-42.8107", { suburb: "Marquês" }),
      ]),
    ]);

    const result = await geocoder.geocode({
      ...address,
      neighborhood: "  marques ",
    });
    expect(result?.latitude).toBe(-5.0778);
  });

  it("escolhe o trecho da rua pelo CEP", async () => {
    const { geocoder } = setup([
      jsonResponse([
        nominatimItem("-5.0914", "-42.8039", { postcode: "64001-390" }),
        nominatimItem("-5.0846", "-42.8071", { postcode: "64000-370" }),
      ]),
    ]);

    const result = await geocoder.geocode({ ...address, zipCode: "64000370" });
    expect(result?.latitude).toBe(-5.0846);
  });

  it("sem bairro/CEP que batam, fica com o primeiro (mais relevante)", async () => {
    const { geocoder } = setup([
      jsonResponse([
        nominatimItem("-5.0914", "-42.8039", { suburb: "Centro Sul" }),
        nominatimItem("-5.0778", "-42.8107", { suburb: "Marquês" }),
      ]),
    ]);

    const result = await geocoder.geocode({
      ...address,
      neighborhood: "Ininga",
    });
    expect(result?.latitude).toBe(-5.0914);
  });

  it("tenta só a rua quando a busca com número não acha nada", async () => {
    const { geocoder, requestedUrls } = setup([
      jsonResponse([]),
      jsonResponse([nominatimItem("-5.09", "-42.80")]),
    ]);

    const result = await geocoder.geocode({ ...address, number: "1100-A" });

    expect(result?.precision).toBe("rua");
    expect(requestedUrls().map((u) => u.searchParams.get("street"))).toEqual([
      "1100-A Rua Desembargador Pires de Castro",
      "Rua Desembargador Pires de Castro",
    ]);
  });

  it('não manda "s/n" como número', async () => {
    const { geocoder, requestedUrls } = setup([
      jsonResponse([nominatimItem("-5.09", "-42.80")]),
    ]);

    await geocoder.geocode({ ...address, number: "S/N" });

    expect(requestedUrls()).toHaveLength(1);
    expect(requestedUrls()[0].searchParams.get("street")).toBe(
      "Rua Desembargador Pires de Castro",
    );
  });

  it("retorna null quando o endereço não existe", async () => {
    const { geocoder } = setup([jsonResponse([]), jsonResponse([])]);
    await expect(geocoder.geocode(address)).resolves.toBeNull();
  });

  it("ignora resultados de outra UF", async () => {
    const { geocoder } = setup([
      jsonResponse([
        nominatimItem("-3.73", "-38.52", { iso: "BR-CE", houseNumber: "1" }),
        nominatimItem("-5.0892", "-42.8016"),
      ]),
    ]);

    const result = await geocoder.geocode(address);
    expect(result).toMatchObject({ latitude: -5.0892, longitude: -42.8016 });
  });

  it("ignora itens com coordenadas inválidas", async () => {
    const { geocoder } = setup([
      jsonResponse([
        nominatimItem("abc", "-42.8"),
        nominatimItem("-5.0892", "-42.8016"),
      ]),
    ]);

    const result = await geocoder.geocode(address);
    expect(result?.latitude).toBe(-5.0892);
  });

  it("guarda o resultado e não repete a consulta", async () => {
    const { geocoder, fetchMock } = setup([
      jsonResponse([nominatimItem("-5.0892", "-42.8016")]),
    ]);

    const first = await geocoder.geocode(address);
    const second = await geocoder.geocode({
      ...address,
      street: "  rua desembargador   PIRES de castro ",
      city: "teresina",
    });

    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("também guarda endereço não encontrado", async () => {
    const { geocoder, fetchMock } = setup([jsonResponse([]), jsonResponse([])]);

    await geocoder.geocode(address);
    await geocoder.geocode(address);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("descarta o mais antigo quando o cache enche", async () => {
    const { geocoder, fetchMock } = setup(
      [
        jsonResponse([nominatimItem("-5.1", "-42.1")]),
        jsonResponse([nominatimItem("-5.2", "-42.2")]),
        jsonResponse([nominatimItem("-5.1", "-42.1")]),
      ],
      { cacheSize: 1 },
    );

    await geocoder.geocode(address);
    await geocoder.geocode({ ...address, number: "200" });
    await geocoder.geocode(address);

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("espera o intervalo mínimo entre requisições (1 por segundo)", async () => {
    const { geocoder, sleeps } = setup(
      [
        jsonResponse([nominatimItem("-5.1", "-42.1")]),
        jsonResponse([nominatimItem("-5.2", "-42.2")]),
        jsonResponse([nominatimItem("-5.3", "-42.3")]),
      ],
      { minIntervalMs: 1000 },
    );

    // Pedidos simultâneos entram na fila
    await Promise.all([
      geocoder.geocode(address),
      geocoder.geocode({ ...address, number: "200" }),
      geocoder.geocode({ ...address, number: "300" }),
    ]);

    expect(sleeps).toEqual([1000, 1000]);
  });

  it("lança GeocodingError em erro HTTP e não guarda no cache", async () => {
    const { geocoder, fetchMock } = setup([
      new Response("Too Many Requests", { status: 429 }),
      jsonResponse([nominatimItem("-5.0892", "-42.8016")]),
    ]);

    await expect(geocoder.geocode(address)).rejects.toThrow(GeocodingError);
    await expect(geocoder.geocode(address)).resolves.not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("lança GeocodingError em falha de rede", async () => {
    const { geocoder } = setup([new TypeError("fetch failed")]);
    await expect(geocoder.geocode(address)).rejects.toBeInstanceOf(
      GeocodingError,
    );
  });

  it("lança GeocodingError quando a resposta não é uma lista", async () => {
    const { geocoder } = setup([jsonResponse({ error: "algo deu errado" })]);
    await expect(geocoder.geocode(address)).rejects.toBeInstanceOf(
      GeocodingError,
    );
  });

  it("uma falha não trava a fila para as próximas consultas", async () => {
    const { geocoder } = setup([
      new TypeError("fetch failed"),
      jsonResponse([nominatimItem("-5.2", "-42.2")]),
    ]);

    const [failed, ok] = await Promise.allSettled([
      geocoder.geocode(address),
      geocoder.geocode({ ...address, number: "200" }),
    ]);

    expect(failed.status).toBe("rejected");
    expect(ok.status).toBe("fulfilled");
  });

  it("aceita outra URL base e envia o e-mail de contato", async () => {
    const { geocoder, requestedUrls } = setup([jsonResponse([])], {
      baseUrl: "http://localhost:8088/",
      email: "contato@uniteto.dev",
    });
    await geocoder.geocode({ ...address, number: "" });

    const url = requestedUrls()[0];
    expect(url.origin + url.pathname).toBe("http://localhost:8088/search");
    expect(url.searchParams.get("email")).toBe("contato@uniteto.dev");
  });
});
