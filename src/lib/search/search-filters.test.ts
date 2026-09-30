import { describe, expect, it } from "vitest";
import {
  parseSearchFilters,
  searchQueryString,
  searchUrl,
  type SearchFilters,
} from "./search-filters";

const EMPTY: SearchFilters = {
  campusId: null,
  radiusKm: null,
  minPriceCents: null,
  maxPriceCents: null,
  type: null,
  page: 1,
};

describe("parseSearchFilters", () => {
  it("sem parâmetros, busca tudo na primeira página", () => {
    expect(parseSearchFilters({})).toEqual(EMPTY);
  });

  it("lê campus, raio, preços em reais, tipo e página", () => {
    expect(
      parseSearchFilters({
        campus: "ufpi-petronio-portella",
        raio: "2",
        precoMin: "300",
        precoMax: "800",
        tipo: "VAGA_REPUBLICA",
        pagina: "3",
      }),
    ).toEqual({
      campusId: "ufpi-petronio-portella",
      radiusKm: 2,
      minPriceCents: 300_00,
      maxPriceCents: 800_00,
      type: "VAGA_REPUBLICA",
      page: 3,
    });
  });

  it("só aceita os raios oferecidos", () => {
    const radius = (raio: string) =>
      parseSearchFilters({ campus: "c", raio }).radiusKm;
    expect(radius("1")).toBe(1);
    expect(radius("10")).toBe(10);
    expect(radius("3")).toBeNull();
    expect(radius("2.5")).toBeNull();
    expect(radius("-2")).toBeNull();
    expect(radius("abc")).toBeNull();
  });

  it("ignora o raio sem campus", () => {
    expect(parseSearchFilters({ raio: "2" }).radiusKm).toBeNull();
  });

  it("ignora preço, tipo e página inválidos", () => {
    expect(
      parseSearchFilters({
        precoMin: "barato",
        precoMax: "-5",
        tipo: "CASTELO",
        pagina: "0",
      }),
    ).toEqual(EMPTY);
    expect(parseSearchFilters({ pagina: "1.5" }).page).toBe(1);
    expect(parseSearchFilters({ pagina: "999999999" }).page).toBe(1);
    expect(parseSearchFilters({ precoMax: "99999999" }).maxPriceCents).toBe(
      null,
    );
  });

  it("destroca preço mínimo e máximo invertidos", () => {
    const filters = parseSearchFilters({ precoMin: "800", precoMax: "300" });
    expect(filters.minPriceCents).toBe(300_00);
    expect(filters.maxPriceCents).toBe(800_00);
  });

  it("ignora parâmetro repetido", () => {
    expect(
      parseSearchFilters({ tipo: ["QUARTO", "QUITINETE"], campus: ["a", "b"] }),
    ).toEqual(EMPTY);
  });
});

describe("searchQueryString", () => {
  it("fica vazia na busca padrão", () => {
    expect(searchQueryString(EMPTY)).toBe("");
  });

  it("volta aos mesmos filtros ao ser lida de novo", () => {
    const filters: SearchFilters = {
      campusId: "uespi-torquato-neto",
      radiusKm: 5,
      minPriceCents: 250_00,
      maxPriceCents: 900_00,
      type: "QUITINETE",
      page: 2,
    };
    const query = searchQueryString(filters);
    expect(query).toBe(
      "campus=uespi-torquato-neto&raio=5&precoMin=250&precoMax=900&tipo=QUITINETE&pagina=2",
    );
    expect(
      parseSearchFilters(Object.fromEntries(new URLSearchParams(query))),
    ).toEqual(filters);
  });

  it("não leva o raio sem campus", () => {
    expect(searchQueryString({ ...EMPTY, radiusKm: 2 })).toBe("");
  });
});

describe("searchUrl", () => {
  it("monta o endereço da busca, sem `?` na busca padrão", () => {
    expect(searchUrl(EMPTY)).toBe("/busca");
    expect(searchUrl({ ...EMPTY, type: "QUARTO", page: 2 })).toBe(
      "/busca?tipo=QUARTO&pagina=2",
    );
  });
});
