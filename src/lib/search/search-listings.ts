import { Prisma } from "@/generated/prisma/client";
import type { GeocodePrecision } from "@/lib/geo/geocode";
import { geoPoint } from "@/lib/geo/sql";
import type { ListingType } from "@/lib/listings/listing-types";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE, type SearchFilters } from "./search-filters";

// Busca de anúncios (#41): o diferencial do UniTeto é filtrar e ordenar pela
// distância real até o campus, calculada pelo PostGIS.
//
// - Com campus: `ST_DWithin` filtra pelo raio (usa o índice espacial
//   `Listing_location_idx`) e `ST_Distance` ordena do mais perto para o mais
//   longe. Os dois pontos vêm de `geoPoint`, a mesma expressão do índice.
// - Sem campus: todos os anúncios ativos, do mais recente para o mais antigo,
//   sem distância.
// - `sort: "preco"` põe o mais barato primeiro; a ordem acima desempata.
// - Só anúncios `ATIVO`. O `id` desempata a ordem, para a paginação não
//   repetir nem pular anúncio.

export type SearchResultItem = {
  id: string;
  title: string;
  type: ListingType;
  priceCents: number;
  availableSpots: number;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  /** "rua" e "bairro": o ponto (e a distância) são aproximados */
  locationPrecision: GeocodePrecision;
  /** Foto de capa (`position` 0), ou `null` se o anúncio não tem fotos */
  coverUrl: string | null;
  /** Metros até o campus escolhido; `null` na busca sem campus */
  distanceMeters: number | null;
  createdAt: Date;
};

export type SearchResult = {
  items: SearchResultItem[];
  /** Anúncios que passam nos filtros, em todas as páginas */
  total: number;
  page: number;
  pageCount: number;
};

/** `FROM` e `WHERE` da busca, iguais na consulta dos itens e na contagem. */
function fromWhere(filters: SearchFilters) {
  const conditions = [Prisma.sql`l."status" = 'ATIVO'::"ListingStatus"`];

  if (filters.campusId && filters.radiusKm) {
    conditions.push(
      Prisma.sql`ST_DWithin(${geoPoint("l")}, ${geoPoint("c")}, ${filters.radiusKm * 1000})`,
    );
  }
  if (filters.minPriceCents !== null) {
    conditions.push(Prisma.sql`l."priceCents" >= ${filters.minPriceCents}`);
  }
  if (filters.maxPriceCents !== null) {
    conditions.push(Prisma.sql`l."priceCents" <= ${filters.maxPriceCents}`);
  }
  if (filters.type) {
    conditions.push(Prisma.sql`l."type" = ${filters.type}::"ListingType"`);
  }

  // Campus inexistente: a junção não acha nada e a busca volta vazia
  const campus = filters.campusId
    ? Prisma.sql`JOIN "Campus" c ON c."id" = ${filters.campusId}`
    : Prisma.empty;

  return Prisma.sql`
    FROM "Listing" l
    ${campus}
    WHERE ${Prisma.join(conditions, " AND ")}
  `;
}

/**
 * SQL da página de resultados. Exportado para o teste de integração conferir
 * com `EXPLAIN` que a busca por raio usa o índice espacial.
 */
export function searchListingsSql(filters: SearchFilters, pageSize: number) {
  const withCampus = filters.campusId !== null;
  const distance = withCampus
    ? Prisma.sql`ST_Distance(${geoPoint("l")}, ${geoPoint("c")})`
    : Prisma.sql`NULL::double precision`;
  const defaultOrder = withCampus
    ? Prisma.sql`"distanceMeters", l."id"`
    : Prisma.sql`l."createdAt" DESC, l."id"`;
  // Por preço, a ordem padrão desempata (o mais perto entre os de mesmo preço)
  const order =
    filters.sort === "preco"
      ? Prisma.sql`l."priceCents", ${defaultOrder}`
      : defaultOrder;

  return Prisma.sql`
    SELECT
      l."id", l."title", l."type", l."priceCents", l."availableSpots",
      l."neighborhood", l."city", l."state", l."latitude", l."longitude",
      l."locationPrecision", l."createdAt",
      ${distance} AS "distanceMeters",
      (
        SELECT p."url"
        FROM "ListingPhoto" p
        WHERE p."listingId" = l."id"
        ORDER BY p."position", p."id"
        LIMIT 1
      ) AS "coverUrl"
    ${fromWhere(filters)}
    ORDER BY ${order}
    LIMIT ${pageSize} OFFSET ${(filters.page - 1) * pageSize}
  `;
}

/**
 * Anúncios ativos que passam nos filtros, uma página por vez. Página além da
 * última volta sem itens, com `total` e `pageCount` certos.
 */
export async function searchListings(
  filters: SearchFilters,
  pageSize: number = PAGE_SIZE,
): Promise<SearchResult> {
  const [rows, [{ total }]] = await Promise.all([
    prisma.$queryRaw<SearchResultItem[]>(searchListingsSql(filters, pageSize)),
    prisma.$queryRaw<[{ total: bigint }]>(
      Prisma.sql`SELECT COUNT(*) AS "total" ${fromWhere(filters)}`,
    ),
  ]);

  return {
    // O driver pode devolver double precision como string; garante número
    items: rows.map((row) => ({
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      distanceMeters:
        row.distanceMeters === null ? null : Number(row.distanceMeters),
    })),
    total: Number(total),
    page: filters.page,
    pageCount: Math.ceil(Number(total) / pageSize),
  };
}
