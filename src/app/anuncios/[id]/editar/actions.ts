"use server";

import { getSession } from "@/lib/auth/session";
import { listingSubmitBlocked } from "@/lib/listings/limits";
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
  const session = await getSession();
  if (!session) throw new Error("Não autorizado");
  const blocked = listingSubmitBlocked(session.user.id);
  if (blocked) return { ok: false, message: blocked };

  return updateListing(id, input);
}
