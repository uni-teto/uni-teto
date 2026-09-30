"use server";

import { getSession } from "@/lib/auth/session";
import {
  createListing,
  type CreateListingResult,
} from "@/lib/listings/create-listing";
import {
  listingSubmitBlocked,
  MAX_LISTINGS_PER_USER,
  TOO_MANY_LISTINGS,
} from "@/lib/listings/limits";
import type { ListingInput } from "@/lib/listings/listing-schema";
import { prisma } from "@/lib/prisma";

// Server Action: pode ser chamada direto por POST, então confere a sessão
// aqui. Os dois papéis (estudante e anunciante) podem anunciar; ter sessão já
// garante e-mail confirmado. O dono é sempre o usuário logado, nunca um valor
// vindo do navegador.
export async function createListingAction(
  input: ListingInput,
): Promise<CreateListingResult> {
  const session = await getSession();
  if (!session) throw new Error("Não autorizado");

  const userId = session.user.id;
  const blocked = listingSubmitBlocked(userId);
  if (blocked) return { ok: false, message: blocked };
  const total = await prisma.listing.count({ where: { ownerId: userId } });
  if (total >= MAX_LISTINGS_PER_USER) {
    return { ok: false, message: TOO_MANY_LISTINGS };
  }

  return createListing(userId, input);
}
