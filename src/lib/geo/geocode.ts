import { z } from "zod";
import { BRAZILIAN_STATES, type StateCode } from "./states";

// Geocodificação de endereços com o Nominatim (OpenStreetMap).
//
// Política de uso do servidor público (https://operations.osmfoundation.org/policies/nominatim/):
// - no máximo 1 requisição por segundo;
// - User-Agent que identifique a aplicação;
// - guardar os resultados em vez de repetir a mesma consulta.
//
// O limite de 1 req/s vale por processo do Node. Basta para o MVP (um servidor);
// com várias instâncias, seria preciso uma fila compartilhada.
//
// Comportamento do Nominatim no Brasil: poucos números de casa estão no OSM.
// Quando o número não existe, ele devolve os trechos da rua (um por bairro/CEP)
// sem avisar. Por isso a precisão vem da resposta (`address.house_number`) e o
// bairro/CEP informados servem para escolher o trecho certo.
//
// Se nem a rua existe no OSM (comum em ruas novas), cai para o centro do
// bairro, com checagem rígida: a busca por bairro devolve lugares de outras
// cidades quando não acha. A busca por CEP NÃO é usada como plano B: em
// Teresina ela devolve o centro da cidade para qualquer CEP (testado em
// 28/09/2026), o que colocaria o anúncio no lugar errado sem avisar.

export type AddressInput = {
  street: string;
  number: string;
  /** Escolhe o trecho certo de ruas longas e é o plano B se a rua não existir */
  neighborhood?: string;
  city: string;
  /** Sigla da UF, ex: "PI" */
  state: StateCode;
  /** CEP (com ou sem hífen); também ajuda a escolher o trecho */
  zipCode?: string;
};

export type GeocodePrecision =
  /** O ponto é o do número da casa/prédio */
  | "numero"
  /** O número não está no OpenStreetMap: o ponto é um trecho da rua */
  | "rua"
  /** Nem a rua está no OpenStreetMap: o ponto é o centro do bairro */
  | "bairro";

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  precision: GeocodePrecision;
  /** Endereço como o Nominatim entendeu, para o usuário conferir */
  displayName: string;
};

/** Falha ao falar com o Nominatim (rede, timeout, HTTP 4xx/5xx). Endereço não encontrado não é erro: retorna `null`. */
export class GeocodingError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "GeocodingError";
  }
}

const DEFAULT_BASE_URL = "https://nominatim.openstreetmap.org";
const DEFAULT_USER_AGENT =
  "UniTeto/0.1 (TCC; +https://github.com/uni-teto/uni-teto)";

const nominatimResultSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  display_name: z.string(),
  name: z.string().optional(),
  /** Tipo do lugar, ex: "road", "suburb", "city" */
  addresstype: z.string().optional(),
  address: z
    .object({
      house_number: z.string().optional(),
      postcode: z.string().optional(),
      suburb: z.string().optional(),
      neighbourhood: z.string().optional(),
      quarter: z.string().optional(),
      city_district: z.string().optional(),
      city: z.string().optional(),
      town: z.string().optional(),
      municipality: z.string().optional(),
      "ISO3166-2-lvl4": z.string().optional(),
    })
    .optional(),
});
type NominatimResult = z.infer<typeof nominatimResultSchema>;

export type GeocoderOptions = {
  baseUrl?: string;
  userAgent?: string;
  /** E-mail de contato enviado ao Nominatim (recomendado para uso frequente) */
  email?: string;
  /** Intervalo mínimo entre requisições, em ms (padrão: 1100) */
  minIntervalMs?: number;
  timeoutMs?: number;
  /** Quantos endereços guardar em memória (padrão: 500) */
  cacheSize?: number;
  // Injetáveis nos testes
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

function normalize(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

/** Para comparar nomes: sem acento, minúsculo, espaços simples. */
function comparable(text: string) {
  return normalize(text).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function digits(text: string) {
  return text.replace(/\D/g, "");
}

/** Número "de verdade" (ignora vazio e "s/n"). */
function houseNumber(number: string) {
  const n = normalize(number);
  return n && !/^s\.?\/?n\.?$/i.test(n) ? n : "";
}

function isInState(result: NominatimResult, state: StateCode) {
  const iso = result.address?.["ISO3166-2-lvl4"];
  return !iso || iso === `BR-${state}`;
}

const NEIGHBORHOOD_TYPES = new Set([
  "suburb",
  "quarter",
  "neighbourhood",
  "city_district",
]);

// Sufixo de bairros divididos em partes, ex: "Dirceu Arcoverde II", "Mocambinho 2"
const NEIGHBORHOOD_PART = /^([ivx]+|\d+)$/;

/**
 * Aceita o resultado da busca por bairro só se ele for um bairro da mesma
 * cidade e UF, com o mesmo nome (ou o nome seguido da numeração da parte).
 * "Centro Sul" não vale para "Centro".
 */
function isSameNeighborhood(result: NominatimResult, address: AddressInput) {
  const a = result.address ?? {};
  const city = a.city ?? a.town ?? a.municipality ?? "";
  const wanted = comparable(address.neighborhood ?? "");
  const name = comparable(result.name ?? "");
  const sameName =
    name === wanted ||
    (name.startsWith(`${wanted} `) &&
      NEIGHBORHOOD_PART.test(name.slice(wanted.length + 1)));

  return (
    wanted !== "" &&
    sameName &&
    NEIGHBORHOOD_TYPES.has(result.addresstype ?? "") &&
    a["ISO3166-2-lvl4"] === `BR-${address.state}` &&
    comparable(city) === comparable(address.city)
  );
}

/**
 * Escolhe o melhor resultado: descarta os de outra UF e prefere, nesta ordem,
 * o que tem o número da casa, o do mesmo CEP e o do mesmo bairro. Em empate,
 * mantém a ordem de relevância do Nominatim.
 */
function pickBest(results: NominatimResult[], address: AddressInput) {
  const zip = digits(address.zipCode ?? "");
  const neighborhood = comparable(address.neighborhood ?? "");

  let best: NominatimResult | null = null;
  let bestScore = -1;
  for (const result of results) {
    if (!isInState(result, address.state)) continue;
    const a = result.address ?? {};

    let score = 0;
    if (a.house_number) score += 4;
    if (zip.length === 8 && digits(a.postcode ?? "") === zip) score += 2;
    if (
      neighborhood &&
      [a.suburb, a.neighbourhood, a.quarter, a.city_district].some(
        (name) => name && comparable(name) === neighborhood,
      )
    ) {
      score += 1;
    }
    if (score > bestScore) {
      best = result;
      bestScore = score;
    }
  }
  return best;
}

function toResult(
  result: NominatimResult,
  precision: GeocodePrecision,
): GeocodeResult {
  return {
    latitude: result.lat,
    longitude: result.lon,
    precision,
    displayName: result.display_name,
  };
}

export function createGeocoder(options: GeocoderOptions = {}) {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  const minIntervalMs = options.minIntervalMs ?? 1100;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const cacheSize = options.cacheSize ?? 500;
  const doFetch = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const sleep =
    options.sleep ??
    ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  // Guarda a consulta (Promise), não só o resultado: pedidos iguais feitos ao
  // mesmo tempo (ex: duplo clique em "Salvar") viram uma consulta só.
  // Quando enche, remove sempre o mais antigo (FIFO, não LRU).
  const cache = new Map<string, Promise<GeocodeResult | null>>();
  // Fila: cada requisição espera a anterior e o intervalo mínimo
  let queue: Promise<unknown> = Promise.resolve();
  let lastRequestAt = -Infinity;

  function throttled<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(async () => {
      const wait = lastRequestAt + minIntervalMs - now();
      if (wait > 0) await sleep(wait);
      lastRequestAt = now();
      return task();
    });
    queue = run.catch(() => undefined);
    return run;
  }

  async function request(
    query: Record<string, string>,
  ): Promise<NominatimResult[]> {
    const params = new URLSearchParams({
      ...query,
      countrycodes: "br",
      format: "jsonv2",
      addressdetails: "1",
      limit: "10",
      "accept-language": "pt-BR",
    });
    if (options.email) params.set("email", options.email);

    const response = await throttled(async () => {
      try {
        return await doFetch(`${baseUrl}/search?${params}`, {
          headers: { "User-Agent": userAgent, Accept: "application/json" },
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        throw new GeocodingError("Não foi possível falar com o Nominatim", {
          cause: error,
        });
      }
    });

    if (!response.ok) {
      throw new GeocodingError(`Nominatim respondeu HTTP ${response.status}`);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      throw new GeocodingError("Resposta inválida do Nominatim", {
        cause: error,
      });
    }
    if (!Array.isArray(body)) {
      throw new GeocodingError("Resposta inválida do Nominatim");
    }

    // Itens malformados são ignorados em vez de derrubar a busca
    return body.flatMap((item) => {
      const parsed = nominatimResultSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
  }

  /** Busca estruturada pela rua (com ou sem número). */
  function searchStreet(street: string, address: AddressInput) {
    return request({
      street,
      city: normalize(address.city),
      state: BRAZILIAN_STATES[address.state],
      country: "Brasil",
    });
  }

  /**
   * Busca livre "bairro, cidade". Acrescentar UF e país faz o Nominatim não
   * achar nada, por isso a UF é conferida na resposta (`isSameNeighborhood`).
   */
  function searchNeighborhood(address: AddressInput) {
    return request({
      q: `${normalize(address.neighborhood ?? "")}, ${normalize(address.city)}`,
    });
  }

  async function lookup(address: AddressInput): Promise<GeocodeResult | null> {
    const street = normalize(address.street);
    const number = houseNumber(address.number);

    // Com número o Nominatim já cai na rua se não achar a casa; a busca só
    // pela rua fica para quando o número atrapalha (ex: "1100-A")
    const queries = number ? [`${number} ${street}`, street] : [street];
    for (const query of queries) {
      const best = pickBest(await searchStreet(query, address), address);
      if (best) {
        return toResult(best, best.address?.house_number ? "numero" : "rua");
      }
    }

    if (!normalize(address.neighborhood ?? "")) return null;
    const neighborhood = (await searchNeighborhood(address)).find((result) =>
      isSameNeighborhood(result, address),
    );
    return neighborhood ? toResult(neighborhood, "bairro") : null;
  }

  function geocode(address: AddressInput): Promise<GeocodeResult | null> {
    const key = [
      normalize(address.street),
      houseNumber(address.number),
      address.neighborhood ?? "",
      address.city,
      address.state,
      digits(address.zipCode ?? ""),
    ]
      .map(comparable)
      .join("|");

    const cached = cache.get(key);
    if (cached) return cached;

    const pending = lookup(address);
    if (cache.size >= cacheSize) {
      cache.delete(cache.keys().next().value!);
    }
    cache.set(key, pending);
    // Falha do serviço não fica no cache: a próxima tentativa consulta de novo
    pending.catch(() => {
      if (cache.get(key) === pending) cache.delete(key);
    });
    return pending;
  }

  return { geocode };
}

let defaultGeocoder: ReturnType<typeof createGeocoder> | undefined;

/**
 * Converte um endereço em latitude/longitude pelo Nominatim.
 *
 * Retorna `null` se o endereço não for encontrado e lança `GeocodingError`
 * se o serviço falhar. Confira `precision`: "rua" e "bairro" são aproximados
 * e vale avisar o usuário. Configuração opcional: `NOMINATIM_URL`,
 * `NOMINATIM_USER_AGENT` e `NOMINATIM_EMAIL`.
 */
export function geocodeAddress(address: AddressInput) {
  defaultGeocoder ??= createGeocoder({
    baseUrl: process.env.NOMINATIM_URL || undefined,
    userAgent: process.env.NOMINATIM_USER_AGENT || undefined,
    email: process.env.NOMINATIM_EMAIL || undefined,
  });
  return defaultGeocoder.geocode(address);
}
