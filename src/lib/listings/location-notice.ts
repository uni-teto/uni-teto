import type { GeocodePrecision } from "@/lib/geo/geocode";

/**
 * Aviso para quem anuncia quando a localização encontrada é aproximada
 * (`null` quando o ponto é o do número da casa).
 */
export function locationNotice(precision: GeocodePrecision): string | null {
  switch (precision) {
    case "numero":
      return null;
    case "rua":
      return "O número não está no mapa, então usamos um ponto da sua rua. A distância até o campus pode variar um pouco.";
    case "bairro":
      return "Sua rua ainda não está no mapa, então usamos o centro do bairro. A distância até o campus é aproximada.";
  }
}

/**
 * Aviso na página do anúncio para quem está procurando (`null` quando o
 * ponto é o do número da casa).
 */
export function publicLocationNotice(
  precision: GeocodePrecision,
): string | null {
  switch (precision) {
    case "numero":
      return null;
    case "rua":
      return "Localização aproximada: o ponto está na rua do imóvel, mas não no número exato.";
    case "bairro":
      return "Localização aproximada: o ponto é o centro do bairro. Confirme o endereço com quem anunciou.";
  }
}

/** Raio (em metros) do círculo desenhado no mapa quando o ponto é aproximado. */
export const APPROXIMATE_RADIUS_METERS: Record<GeocodePrecision, number> = {
  numero: 0,
  rua: 150,
  bairro: 600,
};
