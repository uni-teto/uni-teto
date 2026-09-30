import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export class NotListingOwnerError extends Error {
  constructor() {
    super("Anúncio não encontrado");
    this.name = "NotListingOwnerError";
  }
}

/**
 * Id do anúncio se ele existir e for do usuário logado. Use no começo de toda
 * Server Action que mexe num anúncio (fotos, editar, pausar, excluir).
 * Anúncio inexistente e anúncio de outra pessoa dão o mesmo erro, para não
 * revelar quais ids existem.
 */
export async function requireOwnedListing(listingId: unknown) {
  const session = await getSession();
  if (!session) throw new Error("Não autorizado");
  if (typeof listingId !== "string" || listingId.length > 100) {
    throw new NotListingOwnerError();
  }

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, ownerId: session.user.id },
    select: { id: true },
  });
  if (!listing) throw new NotListingOwnerError();
  return listing.id;
}
