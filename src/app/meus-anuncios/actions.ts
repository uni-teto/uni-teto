"use server";

import { refresh } from "next/cache";
import { publicIdFromUrl } from "@/lib/cloudinary/image-url";
import { deleteImage } from "@/lib/cloudinary/sign-upload";
import { requireOwnedListing } from "@/lib/listings/ownership";
import { prisma } from "@/lib/prisma";

// Server Actions podem ser chamadas direto por POST: todas conferem que o
// anúncio é do usuário logado (requireOwnedListing) antes de qualquer coisa.

export type ListingActionResult = { ok: true } | { ok: false; message: string };

/** Pausar (ex: vaga preenchida; some da busca) ou reativar o anúncio. */
export async function setListingPaused(
  listingId: string,
  paused: boolean,
): Promise<ListingActionResult> {
  const id = await requireOwnedListing(listingId);
  if (typeof paused !== "boolean") {
    return { ok: false, message: "Ação inválida." };
  }

  await prisma.listing.update({
    where: { id },
    data: { status: paused ? "PAUSADO" : "ATIVO" },
  });
  refresh();
  return { ok: true };
}

/** Exclui o anúncio e apaga as fotos dele no Cloudinary. */
export async function deleteListing(
  listingId: string,
): Promise<ListingActionResult> {
  const id = await requireOwnedListing(listingId);
  const photos = await prisma.listingPhoto.findMany({
    where: { listingId: id },
    select: { url: true },
  });

  // As fotos saem do banco junto com o anúncio (onDelete: Cascade)
  await prisma.listing.delete({ where: { id } });

  // Se apagar alguma no Cloudinary falhar, só sobra um arquivo órfão
  await Promise.all(
    photos.map(({ url }) => {
      const publicId = publicIdFromUrl(url);
      return publicId
        ? deleteImage(publicId).catch((error) => {
            console.error("Falha ao apagar foto de anúncio excluído:", error);
          })
        : undefined;
    }),
  );
  refresh();
  return { ok: true };
}
