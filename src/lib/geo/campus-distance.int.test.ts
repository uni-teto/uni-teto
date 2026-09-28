// Teste de integração: roda contra o Postgres/PostGIS de verdade.
// `npm run test:integration` (precisa do `docker compose up -d` e das migrations).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { universities } from "@/lib/seed/universities";
import {
  getListingDistancesToCampus,
  getListingDistanceToCampus,
} from "./campus-distance";
import { haversineDistanceMeters, type Coordinates } from "./distance";

// Prefixo único para não colidir com dados de outros testes/do seed
const run = `int-geo-${Date.now()}`;
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
// Campus fictício no Equador, para conferir o elipsoide
const equatorCampus = { id: `${run}-equator`, latitude: 0, longitude: 0 };

const places = {
  mesmoLugar: { latitude: campus.latitude, longitude: campus.longitude },
  // Pontos reais de Teresina, a distâncias diferentes do campus
  ininga: { latitude: -5.0636, longitude: -42.7937 },
  centro: { latitude: -5.0892, longitude: -42.8016 },
  dirceu: { latitude: -5.1015, longitude: -42.7478 },
  // 1 grau ao norte do ponto (0, 0)
  umGrauNorte: { latitude: 1, longitude: 0 },
} satisfies Record<string, Coordinates>;

const listingId = (name: keyof typeof places) => `${run}-${name}`;

beforeAll(async () => {
  await prisma.university.create({
    data: {
      id: universityId,
      name: "Universidade de Teste",
      acronym: "UT",
      emailDomain: `${run}.test`,
      campuses: {
        create: [campus, equatorCampus].map((c) => ({
          ...c,
          name: c.id,
          city: "Teresina",
          state: "PI",
        })),
      },
    },
  });
  await prisma.user.create({
    data: { id: ownerId, name: "Dono", email: `${run}@${run}.test` },
  });
  await prisma.listing.createMany({
    data: Object.entries(places).map(([name, point]) => ({
      id: listingId(name as keyof typeof places),
      title: name,
      description: "Anúncio de teste",
      type: "QUARTO" as const,
      priceCents: 50_000,
      street: "Rua de Teste",
      number: "1",
      neighborhood: "Centro",
      city: "Teresina",
      state: "PI",
      zipCode: "64000000",
      ...point,
      ownerId,
    })),
  });
});

afterAll(async () => {
  // Anúncios saem em cascata com o usuário
  await prisma.user.deleteMany({ where: { id: ownerId } });
  await prisma.campus.deleteMany({ where: { universityId } });
  await prisma.university.deleteMany({ where: { id: universityId } });
  await prisma.$disconnect();
});

describe("getListingDistancesToCampus (PostGIS)", () => {
  it("retorna 0 para um anúncio no mesmo ponto do campus", async () => {
    const d = await getListingDistanceToCampus(
      listingId("mesmoLugar"),
      campus.id,
    );
    expect(d).toBe(0);
  });

  it("concorda com o Haversine (diferença < 1%; a esfera erra até ~0,5%)", async () => {
    const names = ["ininga", "centro", "dirceu"] as const;
    const rows = await getListingDistancesToCampus(
      campus.id,
      names.map(listingId),
    );

    expect(rows).toHaveLength(names.length);
    for (const name of names) {
      const row = rows.find((r) => r.listingId === listingId(name))!;
      const expected = haversineDistanceMeters(places[name], campus);
      expect(typeof row.distanceMeters).toBe("number");
      expect(Math.abs(row.distanceMeters - expected) / expected).toBeLessThan(
        0.01,
      );
    }
  });

  it("ordena do mais perto para o mais longe", async () => {
    const rows = await getListingDistancesToCampus(campus.id, [
      listingId("dirceu"),
      listingId("mesmoLugar"),
      listingId("centro"),
      listingId("ininga"),
    ]);

    expect(rows.map((r) => r.listingId)).toEqual([
      listingId("mesmoLugar"),
      listingId("ininga"),
      listingId("centro"),
      listingId("dirceu"),
    ]);
    const distances = rows.map((r) => r.distanceMeters);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it("usa o elipsoide WGS 84: 1° de latitude no Equador ≈ 110,574 km", async () => {
    const d = await getListingDistanceToCampus(
      listingId("umGrauNorte"),
      equatorCampus.id,
    );
    // Numa esfera (Haversine) daria ~111,195 km
    expect(d).toBeGreaterThan(110_570);
    expect(d).toBeLessThan(110_580);
  });

  it("ignora anúncios inexistentes e aceita lista vazia", async () => {
    const rows = await getListingDistancesToCampus(campus.id, [
      listingId("centro"),
      `${run}-nao-existe`,
    ]);
    expect(rows.map((r) => r.listingId)).toEqual([listingId("centro")]);
    await expect(getListingDistancesToCampus(campus.id, [])).resolves.toEqual(
      [],
    );
  });

  it("retorna null para campus inexistente", async () => {
    await expect(
      getListingDistanceToCampus(listingId("centro"), `${run}-sem-campus`),
    ).resolves.toBeNull();
  });
});
