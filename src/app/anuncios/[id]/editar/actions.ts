"use server";

import type { ListingInput } from "@/lib/listings/listing-schema";
import { requireOwnedListing } from "@/lib/listings/ownership";
import {
  updateListing,
  type UpdateListingResult,
} from "@/lib/listings/update-listing";

// Server Action: pode ser chamada direto por POST, então confere que o anúncio
// é do usuário logado antes de salvar.
export async function updateListingAction(
  listingId: string,
  input: ListingInput,
): Promise<UpdateListingResult> {
  const id = await requireOwnedListing(listingId);
  return updateListing(id, input);
}
