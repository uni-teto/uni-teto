import { Prisma } from "@/generated/prisma/client";

// Ponto geográfico montado a partir das colunas latitude/longitude, para usar
// em SQL cru com ST_Distance / ST_DWithin (resultado em metros).
//
// É a MESMA expressão do índice espacial `Listing_location_idx` (migration
// `listing_location_index`). Use sempre este helper: se a expressão da
// consulta for diferente da do índice, o PostgreSQL ignora o índice.
// ST_MakePoint recebe a longitude primeiro; SRID 4326 = WGS 84 (GPS/OSM).

const SQL_ALIAS = /^[a-z_][a-z0-9_]*$/;

/** `geoPoint("l")` → `ST_SetSRID(ST_MakePoint(l."longitude", l."latitude"), 4326)::geography` */
export function geoPoint(tableAlias: string) {
  // O alias vai direto no SQL: só aceita nomes simples escritos no código
  if (!SQL_ALIAS.test(tableAlias)) {
    throw new Error(`Alias de tabela inválido: ${tableAlias}`);
  }
  return Prisma.raw(
    `ST_SetSRID(ST_MakePoint(${tableAlias}."longitude", ${tableAlias}."latitude"), 4326)::geography`,
  );
}
