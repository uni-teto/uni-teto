// Teste de integração: roda contra o Postgres/PostGIS de verdade.
// `npm run test:integration` (precisa do `docker compose up -d` e das migrations).
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { geoPoint } from "./sql";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("índice espacial Listing_location_idx", () => {
  it("é usado pela busca por raio feita com geoPoint", async () => {
    const plan = await prisma.$transaction(async (tx) => {
      // Com poucas linhas o PostgreSQL prefere ler a tabela toda; desligar a
      // leitura sequencial mostra se o índice *pode* ser usado nesta consulta
      await tx.$executeRaw`SET LOCAL enable_seqscan = off`;
      return tx.$queryRaw<{ "QUERY PLAN": string }[]>`
        EXPLAIN
        SELECT l."id"
        FROM "Listing" l
        WHERE ST_DWithin(
          ${geoPoint("l")},
          ST_SetSRID(ST_MakePoint(-42.8018, -5.0566), 4326)::geography,
          2000
        )
      `;
    });

    const text = plan.map((row) => row["QUERY PLAN"]).join("\n");
    expect(text).toContain("Listing_location_idx");
  });
});
