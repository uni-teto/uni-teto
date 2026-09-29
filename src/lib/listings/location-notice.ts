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
