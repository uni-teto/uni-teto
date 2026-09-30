import { SEARCH_PATH } from "@/lib/auth/routes";
import { LISTING_TYPES, type ListingType } from "@/lib/listings/listing-types";

// Filtros da busca (#41), lidos da URL para o link poder ser compartilhado:
// `/busca?campus=<id>&raio=2&precoMin=300&precoMax=800&tipo=QUARTO&pagina=2`.
//
// A página é pública e a URL pode vir de qualquer lugar: valor inválido não
// dá erro, só é ignorado (volta ao padrão).

/** Raios oferecidos, em km. Sem raio = qualquer distância. */
export const RADIUS_OPTIONS_KM = [1, 2, 5, 10] as const;
export type RadiusKm = (typeof RADIUS_OPTIONS_KM)[number];

export const PAGE_SIZE = 12;

// Acima disso o OFFSET fica caro e não há tanto anúncio assim
const MAX_PAGE = 1000;
// Maior preço aceito num filtro, em reais (cabe folgado num inteiro do banco)
const MAX_PRICE_REAIS = 1_000_000;

export type SearchFilters = {
  /** Sem campus: lista por mais recentes, sem distância */
  campusId: string | null;
  /** Só vale com campus; `null` = qualquer distância */
  radiusKm: RadiusKm | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  type: ListingType | null;
  /** Começa em 1 */
  page: number;
};

type RawParams = Record<string, string | string[] | undefined>;

/** Número inteiro escrito só com dígitos, ou `null`. */
function wholeNumber(value: string | null, max: number): number | null {
  if (!value || !/^\d{1,9}$/.test(value)) return null;
  const number = Number(value);
  return number <= max ? number : null;
}

/** Lê os filtros dos `searchParams` da página. */
export function parseSearchFilters(params: RawParams): SearchFilters {
  // Parâmetro repetido (`?tipo=A&tipo=B`) chega como lista: é ignorado
  const text = (name: string) => {
    const value = params[name];
    return typeof value === "string" ? value.trim() : null;
  };

  const campusId = text("campus") || null;

  const radius = wholeNumber(text("raio"), 10);
  const radiusKm =
    campusId && RADIUS_OPTIONS_KM.includes(radius as RadiusKm)
      ? (radius as RadiusKm)
      : null;

  let min = wholeNumber(text("precoMin"), MAX_PRICE_REAIS);
  let max = wholeNumber(text("precoMax"), MAX_PRICE_REAIS);
  // "De 800 a 300": a pessoa trocou os campos
  if (min !== null && max !== null && min > max) [min, max] = [max, min];

  const type = text("tipo");

  return {
    campusId,
    radiusKm,
    minPriceCents: min === null ? null : min * 100,
    maxPriceCents: max === null ? null : max * 100,
    type: LISTING_TYPES.includes(type as ListingType)
      ? (type as ListingType)
      : null,
    page: Math.max(1, wholeNumber(text("pagina"), MAX_PAGE) ?? 1),
  };
}

/**
 * Query string dos filtros (sem o `?`), só com o que foge do padrão. Usada
 * nos links de paginação e ao mudar um filtro.
 *
 * @example searchQueryString({ ...filters, page: 2 }) // "campus=ufpi-...&raio=2&pagina=2"
 */
export function searchQueryString(filters: SearchFilters): string {
  const query = new URLSearchParams();
  if (filters.campusId) {
    query.set("campus", filters.campusId);
    if (filters.radiusKm) query.set("raio", String(filters.radiusKm));
  }
  if (filters.minPriceCents !== null) {
    query.set("precoMin", String(filters.minPriceCents / 100));
  }
  if (filters.maxPriceCents !== null) {
    query.set("precoMax", String(filters.maxPriceCents / 100));
  }
  if (filters.type) query.set("tipo", filters.type);
  if (filters.page > 1) query.set("pagina", String(filters.page));
  return query.toString();
}

/** Endereço da busca com os filtros, ex: `/busca?campus=ufpi-...&pagina=2`. */
export function searchUrl(filters: SearchFilters): string {
  const query = searchQueryString(filters);
  return query ? `${SEARCH_PATH}?${query}` : SEARCH_PATH;
}
