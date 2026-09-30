import type { StateCode } from "@/lib/geo/states";
import type { ListingInput } from "./listing-schema";
import type { ListingType } from "./listing-types";
import { centsToPriceInput } from "./price";
import { maskZipCodeInput } from "./zip-code";

export type StoredListing = {
  title: string;
  description: string;
  type: ListingType;
  priceCents: number;
  availableSpots: number;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
};

/** Anúncio do banco → valores do formulário de edição ("750,00", "64001-390"). */
export function listingToInput(listing: StoredListing): ListingInput {
  return {
    title: listing.title,
    description: listing.description,
    type: listing.type,
    price: centsToPriceInput(listing.priceCents),
    availableSpots: String(listing.availableSpots),
    zipCode: maskZipCodeInput(listing.zipCode),
    street: listing.street,
    number: listing.number,
    complement: listing.complement ?? "",
    neighborhood: listing.neighborhood,
    city: listing.city,
    state: listing.state as StateCode,
  };
}
