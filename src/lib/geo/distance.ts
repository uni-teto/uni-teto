export type Coordinates = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

/**
 * Distância em metros entre dois pontos pela fórmula de Haversine.
 *
 * A busca principal usa PostGIS no banco; esta função serve para exibir
 * distâncias na interface e como fallback caso o PostGIS não esteja disponível.
 */
export function haversineDistanceMeters(
  a: Coordinates,
  b: Coordinates,
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/** Converte metros em quilômetros, com `decimals` casas (padrão: 1). */
export function metersToKm(meters: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round((meters / 1000) * factor) / factor;
}

/** Formata uma distância para exibição, ex: "850 m" ou "1,2 km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
}
