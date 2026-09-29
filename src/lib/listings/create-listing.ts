import { z } from "zod";
import {
  geocodeAddress,
  GeocodingError,
  type GeocodePrecision,
  type GeocodeResult,
} from "@/lib/geo/geocode";
import { prisma } from "@/lib/prisma";
import {
  listingSchema,
  type ListingData,
  type ListingInput,
} from "./listing-schema";

export type CreateListingResult =
  | {
      ok: true;
      listingId: string;
      precision: GeocodePrecision;
      /** Endereço como o mapa entendeu, para a pessoa conferir */
      displayName: string;
    }
  | {
      ok: false;
      fieldErrors?: Record<string, string[]>;
      message?: string;
    };

export const ADDRESS_NOT_FOUND =
  "Não encontramos esse endereço no mapa. Confira a rua, o bairro e a cidade.";
export const GEOCODING_UNAVAILABLE =
  "O serviço de localização está fora do ar. Tente de novo em alguns minutos.";

type Dependencies = {
  geocode: (
    address: Parameters<typeof geocodeAddress>[0],
  ) => Promise<GeocodeResult | null>;
  saveListing: (
    data: ListingData & {
      ownerId: string;
      latitude: number;
      longitude: number;
    },
  ) => Promise<{ id: string }>;
};

export type ListingFailure = Extract<CreateListingResult, { ok: false }>;

type Geocode = Dependencies["geocode"];

/**
 * Coordenadas do endereço do anúncio (validado), ou a falha já no formato
 * que o formulário mostra. Usado ao criar e ao editar.
 */
export async function locateListing(
  data: ListingData,
  geocode: Geocode,
): Promise<{ ok: true; location: GeocodeResult } | ListingFailure> {
  let location: GeocodeResult | null;
  try {
    location = await geocode({
      street: data.street,
      number: data.number,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
    });
  } catch (error) {
    if (error instanceof GeocodingError) {
      return { ok: false, message: GEOCODING_UNAVAILABLE };
    }
    throw error;
  }

  if (!location) {
    return { ok: false, fieldErrors: { street: [ADDRESS_NOT_FOUND] } };
  }
  return { ok: true, location };
}

const defaultDependencies: Dependencies = {
  geocode: geocodeAddress,
  saveListing: ({ price, ...data }) =>
    prisma.listing.create({
      data: { ...data, priceCents: price },
      select: { id: true },
    }),
};

/**
 * Valida o anúncio, descobre as coordenadas do endereço e salva.
 * Quem chama deve garantir que `ownerId` é o usuário logado.
 * Sem coordenadas o anúncio não é salvo: ele não apareceria na busca por
 * distância, que é o centro do site.
 */
export async function createListing(
  ownerId: string,
  input: ListingInput,
  deps: Dependencies = defaultDependencies,
): Promise<CreateListingResult> {
  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;

  const located = await locateListing(data, deps.geocode);
  if (!located.ok) return located;
  const location = located.location;

  const listing = await deps.saveListing({
    ...data,
    ownerId,
    latitude: location.latitude,
    longitude: location.longitude,
  });

  return {
    ok: true,
    listingId: listing.id,
    precision: location.precision,
    displayName: location.displayName,
  };
}
