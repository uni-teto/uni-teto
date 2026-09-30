import { describe, expect, it } from "vitest";
import {
  APPROXIMATE_RADIUS_METERS,
  locationNotice,
  publicLocationNotice,
} from "./location-notice";

describe("avisos de localização", () => {
  it("não avisa quando o ponto é o número exato", () => {
    expect(locationNotice("numero")).toBeNull();
    expect(publicLocationNotice("numero")).toBeNull();
    expect(APPROXIMATE_RADIUS_METERS.numero).toBe(0);
  });

  it("avisa quem anuncia e quem procura quando é aproximado", () => {
    for (const precision of ["rua", "bairro"] as const) {
      expect(locationNotice(precision)).toBeTruthy();
      expect(publicLocationNotice(precision)).toMatch(
        /^Localização aproximada/,
      );
    }
    // Centro do bairro é menos preciso que um ponto da rua
    expect(APPROXIMATE_RADIUS_METERS.bairro).toBeGreaterThan(
      APPROXIMATE_RADIUS_METERS.rua,
    );
  });
});
