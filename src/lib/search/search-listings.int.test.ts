// Teste de integração: roda contra o Postgres/PostGIS de verdade.
// `npm run test:integration` (precisa do `docker compose up -d` e das migrations).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { haversineDistanceMeters } from "@/lib/geo/distance";
import type { ListingType } from "@/lib/listings/listing-types";
import { prisma } from "@/lib/prisma";
import { universities } from "@/lib/seed/universities";
import type { SearchFilters } from "./search-filters";
import { searchListings, searchListingsSql } from "./search-listings";

// Prefixo único para não colidir com dados de outros testes/do seed
const run = `int-search-${Date.now()}`;
const universityId = `${run}-uni`;
const ownerId = `${run}-owner`;

// Mesmas coordenadas do seed: Campus Ministro Petrônio Portella (UFPI)
const ufpi = universities
  .find((u) => u.id === "ufpi")!
  .campuses.find((c) => c.id === "ufpi-petronio-portella")!;
const campus = {
  id: `${run}-campus`,
  latitude: ufpi.latitude,
  longitude: ufpi.longitude,
};

// O banco pode ter outros anúncios perto da UFPI (seed de demonstração, E2E).
// Os daqui ficam numa faixa de preço que ninguém mais usa, e toda busca do
// teste filtra por ela: assim só eles aparecem, sem mudar a consulta.
const BAND_MIN = 19_000_00;

type Place = {
  latitude: number;
  longitude: number;
  type: ListingType;
  priceCents: number;
  status?: "PAUSADO";
};

// Pontos reais de Teresina e Timon (ruas do seed de demonstração), do mais
// perto para o mais longe do campus: ~0,6 / 1,6 / 2,6 / 2,6 / 3,5 / 6,3 / 8,6 km
const places = {
  universitaria: {
    latitude: -5.0621995,
    longitude: -42.8011078,
    type: "QUARTO",
    priceCents: 19_100_00,
  },
  fatima: {
    latitude: -5.0640332,
    longitude: -42.7893491,
    type: "VAGA_REPUBLICA",
    priceCents: 19_200_00,
  },
  // Dois anúncios no mesmo ponto (mesmo prédio): o id desempata
  joqueiA: {
    latitude: -5.0748162,
    longitude: -42.7860061,
    type: "QUITINETE",
    priceCents: 19_300_00,
  },
  joqueiB: {
    latitude: -5.0748162,
    longitude: -42.7860061,
    type: "QUITINETE",
    priceCents: 19_350_00,
  },
  centro: {
    latitude: -5.0858113,
    longitude: -42.8135257,
    type: "QUARTO",
    priceCents: 19_400_00,
  },
  timon: {
    latitude: -5.0969235,
    longitude: -42.8414636,
    type: "QUARTO",
    priceCents: 19_500_00,
  },
  extrema: {
    latitude: -5.1209031,
    longitude: -42.7581107,
    type: "QUITINETE",
    priceCents: 19_600_00,
  },
  // Em cima do campus, mas pausado: nunca aparece
  pausado: {
    latitude: campus.latitude,
    longitude: campus.longitude,
    type: "QUARTO",
    priceCents: 19_100_00,
    status: "PAUSADO",
  },
} satisfies Record<string, Place>;

type PlaceName = keyof typeof places;
const names = Object.keys(places) as PlaceName[];
const listingId = (name: PlaceName) => `${run}-${name}`;
const listingIds = (list: PlaceName[]) => list.map(listingId);
const byDistance: PlaceName[] = [
  "universitaria",
  "fatima",
  "joqueiA",
  "joqueiB",
  "centro",
  "timon",
  "extrema",
];

/** Busca só entre os anúncios deste teste (faixa de preço exclusiva). */
function search(filters: Partial<SearchFilters> = {}, pageSize?: number) {
  return searchListings(
    {
      campusId: campus.id,
      radiusKm: null,
      minPriceCents: BAND_MIN,
      maxPriceCents: null,
      type: null,
      page: 1,
      ...filters,
    },
    pageSize,
  );
}

const ids = (result: { items: { id: string }[] }) =>
  result.items.map((item) => item.id);

beforeAll(async () => {
  await prisma.university.create({
    data: {
      id: universityId,
      name: "Universidade de Teste",
      acronym: "UT",
      emailDomain: `${run}.test`,
      campuses: {
        create: [{ ...campus, name: campus.id, city: "Teresina", state: "PI" }],
      },
    },
  });
  await prisma.user.create({
    data: { id: ownerId, name: "Dono", email: `${run}@${run}.test` },
  });
  await prisma.listing.createMany({
    data: names.map((name, index) => {
      const place: Place = places[name];
      return {
        id: listingId(name),
        title: name,
        description: "Anúncio de teste",
        type: place.type,
        status: place.status ?? "ATIVO",
        priceCents: place.priceCents,
        street: "Rua de Teste",
        number: "1",
        neighborhood: "Centro",
        city: "Teresina",
        state: "PI",
        zipCode: "64000000",
        latitude: place.latitude,
        longitude: place.longitude,
        locationPrecision: "rua" as const,
        ownerId,
        // Quanto mais longe, mais recente: a ordem sem campus é a inversa
        createdAt: new Date(Date.UTC(2026, 0, 1 + index)),
      };
    }),
  });
  // Fotos fora de ordem: a capa é a de `position` 0
  await prisma.listingPhoto.createMany({
    data: [
      { listingId: listingId("fatima"), url: "https://x.test/2", position: 1 },
      { listingId: listingId("fatima"), url: "https://x.test/1", position: 0 },
    ],
  });
});

afterAll(async () => {
  // Anúncios e fotos saem em cascata com o usuário
  await prisma.user.deleteMany({ where: { id: ownerId } });
  await prisma.campus.deleteMany({ where: { universityId } });
  await prisma.university.deleteMany({ where: { id: universityId } });
  await prisma.$disconnect();
});

describe("searchListings com campus (PostGIS)", () => {
  it("sem raio, traz todos os ativos do mais perto para o mais longe", async () => {
    const result = await search();

    expect(ids(result)).toEqual(byDistance.map(listingId));
    expect(result.total).toBe(byDistance.length);
    const distances = result.items.map((item) => item.distanceMeters!);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it("devolve a distância real (diferença < 1% do Haversine)", async () => {
    const result = await search();

    for (const name of byDistance) {
      const item = result.items.find((i) => i.id === listingId(name))!;
      const expected = haversineDistanceMeters(places[name], campus);
      expect(typeof item.distanceMeters).toBe("number");
      expect(Math.abs(item.distanceMeters! - expected) / expected).toBeLessThan(
        0.01,
      );
    }
  });

  it.each([
    [1, ["universitaria"]],
    [2, ["universitaria", "fatima"]],
    [5, ["universitaria", "fatima", "joqueiA", "joqueiB", "centro"]],
    [10, byDistance],
  ] as const)(
    "raio de %i km: só quem está dentro",
    async (radiusKm, inside) => {
      const result = await search({ radiusKm });

      expect(ids(result)).toEqual(inside.map(listingId));
      expect(result.total).toBe(inside.length);
      // O conjunto esperado bate com a distância calculada fora do banco
      for (const name of byDistance) {
        const meters = haversineDistanceMeters(places[name], campus);
        expect(meters < radiusKm * 1000, name).toBe(
          (inside as readonly string[]).includes(name),
        );
      }
    },
  );

  it("nunca traz anúncio pausado, mesmo em cima do campus", async () => {
    const result = await search({ radiusKm: 1 });
    expect(ids(result)).not.toContain(listingId("pausado"));
  });

  it("combina raio, tipo e faixa de preço", async () => {
    const quartos = await search({ radiusKm: 5, type: "QUARTO" });
    expect(ids(quartos)).toEqual(listingIds(["universitaria", "centro"]));

    const baratos = await search({
      radiusKm: 5,
      type: "QUARTO",
      maxPriceCents: 19_399_00,
    });
    expect(ids(baratos)).toEqual([listingId("universitaria")]);

    const faixa = await search({
      radiusKm: 10,
      minPriceCents: 19_300_00,
      maxPriceCents: 19_500_00,
    });
    expect(ids(faixa)).toEqual(
      listingIds(["joqueiA", "joqueiB", "centro", "timon"]),
    );
  });

  it("inclui os limites da faixa de preço", async () => {
    const result = await search({
      minPriceCents: 19_200_00,
      maxPriceCents: 19_200_00,
    });
    expect(ids(result)).toEqual([listingId("fatima")]);
  });

  it("pagina sem repetir nem pular, desempatando pelo id", async () => {
    const pages = await Promise.all(
      [1, 2, 3, 4].map((page) => search({ page }, 2)),
    );

    expect(pages.flatMap(ids)).toEqual(byDistance.map(listingId));
    expect(pages.map((p) => p.items.length)).toEqual([2, 2, 2, 1]);
    for (const page of pages) {
      expect(page.total).toBe(byDistance.length);
      expect(page.pageCount).toBe(4);
    }
    // joqueiA e joqueiB estão no mesmo ponto e caem em páginas diferentes
    expect(ids(pages[1])).toEqual([listingId("joqueiA"), listingId("joqueiB")]);
  });

  it("página além da última volta vazia, com o total certo", async () => {
    const result = await search({ page: 9 }, 2);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(byDistance.length);
    expect(result.pageCount).toBe(4);
  });

  it("traz a foto de capa, ou null sem fotos", async () => {
    const result = await search({ radiusKm: 2 });
    const cover = Object.fromEntries(
      result.items.map((item) => [item.id, item.coverUrl]),
    );
    expect(cover[listingId("fatima")]).toBe("https://x.test/1");
    expect(cover[listingId("universitaria")]).toBeNull();
  });

  it("campus inexistente não traz nada", async () => {
    const result = await search({ campusId: `${run}-sem-campus` });
    expect(result).toEqual({ items: [], total: 0, page: 1, pageCount: 0 });
  });
});

describe("searchListings sem campus", () => {
  it("lista os ativos do mais recente para o mais antigo, sem distância", async () => {
    const result = await search({ campusId: null });

    expect(ids(result)).toEqual([...byDistance].reverse().map(listingId));
    expect(result.total).toBe(byDistance.length);
    for (const item of result.items) expect(item.distanceMeters).toBeNull();
  });

  it("aplica tipo e preço", async () => {
    const result = await search({
      campusId: null,
      type: "QUITINETE",
      maxPriceCents: 19_350_00,
    });
    expect(ids(result)).toEqual(listingIds(["joqueiB", "joqueiA"]));
  });
});

describe("plano da busca por raio", () => {
  it("usa o índice espacial Listing_location_idx", async () => {
    const sql = searchListingsSql(
      {
        campusId: campus.id,
        radiusKm: 2,
        minPriceCents: null,
        maxPriceCents: null,
        type: null,
        page: 1,
      },
      12,
    );
    const plan = await prisma.$transaction(async (tx) => {
      // Com poucas linhas o PostgreSQL prefere ler a tabela toda; desligar a
      // leitura sequencial mostra se o índice *pode* ser usado nesta consulta
      await tx.$executeRaw`SET LOCAL enable_seqscan = off`;
      return tx.$queryRaw<{ "QUERY PLAN": string }[]>(
        Prisma.sql`EXPLAIN ${sql}`,
      );
    });

    const text = plan.map((row) => row["QUERY PLAN"]).join("\n");
    expect(text).toContain("Listing_location_idx");
  });
});
