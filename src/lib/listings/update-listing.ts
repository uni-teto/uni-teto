import { z } from "zod";
import {
  geocodeAddress,
  type GeocodePrecision,
  type GeocodeResult,
} from "@/lib/geo/geocode";
import { prisma } from "@/lib/prisma";
import { locateListing, type ListingFailure } from "./create-listing";
import {
  listingSchema,
  type ListingData,
  type ListingInput,
} from "./listing-schema";

const ADDRESS_FIELDS = [
  "street",
  "number",
  "neighborhood",
  "city",
  "state",
  "zipCode",
] as const;

export type ListingAddress = Pick<ListingData, (typeof ADDRESS_FIELDS)[number]>;

/** Para comparar: sem acento, minúsculo, espaços simples. */
function comparable(text: string) {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * O endereço mudou de um jeito que muda o lugar? Diferenças só de maiúsculas,
 * acentos ou espaços não contam (não vale gastar uma consulta ao Nominatim).
 * O complemento (ex: "Apto 2") não muda o ponto no mapa.
 */
export function addressChanged(before: ListingAddress, after: ListingAddress) {
  return ADDRESS_FIELDS.some(
    (field) => comparable(before[field]) !== comparable(after[field]),
  );
}

export type UpdateListingResult =
  | { ok: true; relocated: false }
  | {
      ok: true;
      relocated: true;
      precision: GeocodePrecision;
      displayName: string;
    }
  | ListingFailure;

type Location = {
  latitude: number;
  longitude: number;
  locationPrecision: GeocodePrecision;
};

type Dependencies = {
  geocode: (
    address: Parameters<typeof geocodeAddress>[0],
  ) => Promise<GeocodeResult | null>;
  findAddress: (listingId: string) => Promise<ListingAddress | null>;
  saveListing: (
    listingId: string,
    data: ListingData,
    location: Location | null,
  ) => Promise<void>;
};

const defaultDependencies: Dependencies = {
  geocode: geocodeAddress,
  findAddress: (listingId) =>
    prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        street: true,
        number: true,
        neighborhood: true,
        city: true,
        state: true,
        zipCode: true,
      },
    }) as Promise<ListingAddress | null>,
  saveListing: async (listingId, { price, ...data }, location) => {
    await prisma.listing.update({
      where: { id: listingId },
      data: { ...data, priceCents: price, ...location },
    });
  },
};

/**
 * Valida e salva a edição de um anúncio. Só consulta o Nominatim de novo se
 * o endereço mudou; se a nova localização não for encontrada, nada é salvo.
 * Quem chama deve garantir que o anúncio é do usuário logado
 * (`requireOwnedListing`).
 */
export async function updateListing(
  listingId: string,
  input: ListingInput,
  deps: Dependencies = defaultDependencies,
): Promise<UpdateListingResult> {
  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;

  const current = await deps.findAddress(listingId);
  if (!current) return { ok: false, message: "Anúncio não encontrado." };

  if (!addressChanged(current, data)) {
    await deps.saveListing(listingId, data, null);
    return { ok: true, relocated: false };
  }

  const located = await locateListing(data, deps.geocode);
  if (!located.ok) return located;
  const { latitude, longitude, precision, displayName } = located.location;

  await deps.saveListing(listingId, data, {
    latitude,
    longitude,
    locationPrecision: precision,
  });
  return { ok: true, relocated: true, precision, displayName };
}
