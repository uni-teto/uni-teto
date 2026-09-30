import { describe, expect, it } from "vitest";
import { geoPoint } from "./sql";

describe("geoPoint", () => {
  it("monta o ponto com a longitude primeiro", () => {
    expect(geoPoint("l").sql).toBe(
      'ST_SetSRID(ST_MakePoint(l."longitude", l."latitude"), 4326)::geography',
    );
  });

  it.each(['l"; DROP TABLE "User"; --', "L", "1l", ""])(
    "recusa alias que não seja um nome simples: %j",
    (alias) => {
      expect(() => geoPoint(alias)).toThrow("Alias de tabela inválido");
    },
  );
});
