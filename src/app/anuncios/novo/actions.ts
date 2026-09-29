"use server";

import { getSession } from "@/lib/auth/session";
import {
  createListing,
  type CreateListingResult,
} from "@/lib/listings/create-listing";
import type { ListingInput } from "@/lib/listings/listing-schema";

// Server Action: pode ser chamada direto por POST, então confere a sessão
// aqui. Os dois papéis (estudante e anunciante) podem anunciar; ter sessão já
// garante e-mail confirmado. O dono é sempre o usuário logado, nunca um valor
// vindo do navegador.
export async function createListingAction(
  input: ListingInput,
): Promise<CreateListingResult> {
  const session = await getSession();
  if (!session) throw new Error("Não autorizado");

  return createListing(session.user.id, input);
}
