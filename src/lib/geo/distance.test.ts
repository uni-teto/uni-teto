import { describe, expect, it } from "vitest";
import {
  formatDistance,
  haversineDistanceMeters,
  metersToKm,
} from "./distance";

describe("haversineDistanceMeters", () => {
  it("retorna 0 para o mesmo ponto", () => {
    const p = { latitude: -23.5505, longitude: -46.6333 };
    expect(haversineDistanceMeters(p, p)).toBe(0);
  });

  it("calcula a distância entre São Paulo e Rio de Janeiro (~361 km)", () => {
    const saoPaulo = { latitude: -23.5505, longitude: -46.6333 };
    const rio = { latitude: -22.9068, longitude: -43.1729 };
    const km = haversineDistanceMeters(saoPaulo, rio) / 1000;
    expect(km).toBeGreaterThan(359);
    expect(km).toBeLessThan(363);
  });

  it("é simétrica", () => {
    const a = { latitude: -15.7939, longitude: -47.8828 };
    const b = { latitude: -15.7801, longitude: -47.9292 };
    expect(haversineDistanceMeters(a, b)).toBeCloseTo(
      haversineDistanceMeters(b, a),
    );
  });

  it("mede 1 grau de latitude como ~111 km", () => {
    const d = haversineDistanceMeters(
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 0 },
    );
    expect(d).toBeGreaterThan(111_000);
    expect(d).toBeLessThan(111_300);
  });
});

describe("formatDistance", () => {
  it("usa metros abaixo de 1 km", () => {
    expect(formatDistance(849.6)).toBe("850 m");
  });

  it("usa km com vírgula decimal a partir de 1 km", () => {
    expect(formatDistance(1234)).toBe("1,2 km");
    expect(formatDistance(3000)).toBe("3 km");
  });
});

describe("metersToKm", () => {
  it("converte com 1 casa decimal por padrão", () => {
    expect(metersToKm(1234)).toBe(1.2);
    expect(metersToKm(1250)).toBe(1.3);
    expect(metersToKm(0)).toBe(0);
  });

  it("aceita outra quantidade de casas", () => {
    expect(metersToKm(1234.5, 2)).toBe(1.23);
    expect(metersToKm(1500, 0)).toBe(2);
  });
});
