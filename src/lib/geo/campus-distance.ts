import { prisma } from "@/lib/prisma";

// Distância real (em linha reta sobre o elipsoide WGS 84) entre anúncios e um
// campus, calculada pelo PostGIS. `ST_Distance` sobre `geography` devolve metros.
//
// Os pontos são montados a partir das colunas latitude/longitude
// (ST_MakePoint recebe longitude primeiro; SRID 4326 = WGS 84, o do GPS/OSM).
// A busca da Fase 5 (#29) usa a mesma expressão com ST_DWithin para filtrar
// pelo raio.

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
      ST_Distance(
        ST_SetSRID(ST_MakePoint(l."longitude", l."latitude"), 4326)::geography,
        ST_SetSRID(ST_MakePoint(c."longitude", c."latitude"), 4326)::geography
      ) AS "distanceMeters"
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
