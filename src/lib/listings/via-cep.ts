// Preenche o endereço a partir do CEP com o ViaCEP (https://viacep.com.br),
// gratuito e sem chave, com os dados dos Correios. Roda no navegador: só o
// CEP sai do site. A localização no mapa continua vindo do Nominatim.

import { z } from "zod";
import { isStateCode, type StateCode } from "@/lib/geo/states";

export const VIA_CEP_URL = "https://viacep.com.br/ws";

export type ZipCodeAddress = {
  /** Vazio em CEP geral de cidade pequena (um CEP para a cidade inteira) */
  street: string;
  neighborhood: string;
  city: string;
  state: StateCode;
};

/** O ViaCEP não respondeu (fora do ar, sem internet, demorou). */
export class ZipCodeLookupError extends Error {
  constructor(options?: ErrorOptions) {
    super("Não foi possível consultar o CEP.", options);
    this.name = "ZipCodeLookupError";
  }
}

const viaCepResponse = z.union([
  z.object({ erro: z.union([z.literal(true), z.literal("true")]) }),
  z.object({
    logradouro: z.string(),
    bairro: z.string(),
    localidade: z.string(),
    uf: z.string().refine(isStateCode),
  }),
]);

/**
 * Endereço do CEP (8 dígitos), ou `null` se o CEP não existir nos Correios.
 * Lança `ZipCodeLookupError` se o serviço falhar.
 */
export async function lookupZipCode(
  zipCode: string,
  fetchFn: typeof fetch = fetch,
): Promise<ZipCodeAddress | null> {
  if (!/^\d{8}$/.test(zipCode)) return null;

  let body: unknown;
  try {
    const response = await fetchFn(`${VIA_CEP_URL}/${zipCode}/json/`, {
      signal: AbortSignal.timeout(5000),
    });
    // CEP em formato inválido dá 400; aqui já foi conferido antes
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    body = await response.json();
  } catch (error) {
    throw new ZipCodeLookupError({ cause: error });
  }

  const parsed = viaCepResponse.safeParse(body);
  if (!parsed.success) throw new ZipCodeLookupError({ cause: parsed.error });
  if ("erro" in parsed.data) return null;

  const { logradouro, bairro, localidade, uf } = parsed.data;
  return {
    street: logradouro.trim(),
    neighborhood: bairro.trim(),
    city: localidade.trim(),
    state: uf as StateCode,
  };
}
