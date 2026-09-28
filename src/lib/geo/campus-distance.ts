import { prisma } from "@/lib/prisma";
import { geoPoint } from "./sql";

// Distância real (em linha reta sobre o elipsoide WGS 84) entre anúncios e um
// campus, calculada pelo PostGIS. `ST_Distance` sobre `geography` devolve metros.
//
// Os pontos vêm de `geoPoint` (./sql.ts), a mesma expressão do índice
// espacial. A busca da Fase 5 (#29) deve usá-lo também com ST_DWithin para
// filtrar pelo raio.

export type ListingDistance = {
  listingId: string;
  /** Distância em metros até o campus */
  distanceMeters: number;
};

/**
 * Distância de cada anúncio informado até o campus, do mais perto para o mais
 * longe. Anúncios inexistentes são ignorados; campus inexistente retorna `[]`.
 */
export async function getListingDistancesToCampus(
  campusId: string,
  listingIds: string[],
): Promise<ListingDistance[]> {
  if (listingIds.length === 0) return [];

  const rows = await prisma.$queryRaw<ListingDistance[]>`
    SELECT
      l."id" AS "listingId",
      ST_Distance(${geoPoint("l")}, ${geoPoint("c")}) AS "distanceMeters"
    FROM "Listing" l
    CROSS JOIN "Campus" c
    WHERE c."id" = ${campusId}
      AND l."id" = ANY(${listingIds})
    ORDER BY "distanceMeters", l."id"
  `;

  // O driver pode devolver double precision como string; garante número
  return rows.map((row) => ({
    listingId: row.listingId,
    distanceMeters: Number(row.distanceMeters),
  }));
}

/** Distância em metros de um anúncio até um campus (`null` se algum não existir). */
export async function getListingDistanceToCampus(
  listingId: string,
  campusId: string,
): Promise<number | null> {
  const [row] = await getListingDistancesToCampus(campusId, [listingId]);
  return row?.distanceMeters ?? null;
}
