-- Índice espacial para a busca por raio (ST_DWithin) e a distância até o campus.
--
-- É um índice sobre uma EXPRESSÃO: só é usado quando a consulta monta o ponto
-- exatamente assim. Por isso as consultas usam o helper `geoPoint` de
-- src/lib/geo/sql.ts, que gera esta mesma expressão.
--
-- O Prisma não descreve índices de expressão no schema.prisma; este índice
-- existe só aqui (o teste de integração em src/lib/geo/sql.int.test.ts confere
-- que ele continua sendo usado).
CREATE INDEX "Listing_location_idx" ON "Listing" USING GIST (
  (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography)
);
