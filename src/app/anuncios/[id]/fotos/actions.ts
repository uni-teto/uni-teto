"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { publicIdFromUrl } from "@/lib/cloudinary/image-url";
import {
  isListingPhotoUrl,
  listingPhotoPublicId,
  MAX_LISTING_PHOTOS,
} from "@/lib/cloudinary/listing-photo-url";
import {
  deleteImage,
  getCloudinaryConfig,
  signImageUpload,
  type SignedUpload,
} from "@/lib/cloudinary/sign-upload";
import { requireOwnedListing } from "@/lib/listings/ownership";
import { withCoverFirst, withoutPhoto } from "@/lib/listings/photo-order";
import { prisma } from "@/lib/prisma";

// Server Actions podem ser chamadas direto por POST: todas conferem que o
// anúncio é do usuário logado (requireOwnedListing) antes de qualquer coisa.

export type PhotoActionResult = { ok: true } | { ok: false; message: string };

const LIMIT_MESSAGE = `Cada anúncio pode ter até ${MAX_LISTING_PHOTOS} fotos.`;

function photoIds(listingId: string) {
  return prisma.listingPhoto
    .findMany({
      where: { listingId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    })
    .then((photos) => photos.map((photo) => photo.id));
}

/** Grava `position` = índice de cada foto na nova ordem. */
function savePositions(orderedIds: string[]) {
  return prisma.$transaction(
    orderedIds.map((id, position) =>
      prisma.listingPhoto.update({ where: { id }, data: { position } }),
    ),
  );
}

/** Assinatura para enviar UMA foto para a pasta do anúncio. */
export async function getListingPhotoUploadParams(
  listingId: string,
): Promise<
  { ok: true; upload: SignedUpload } | { ok: false; message: string }
> {
  const id = await requireOwnedListing(listingId);

  const count = await prisma.listingPhoto.count({ where: { listingId: id } });
  if (count >= MAX_LISTING_PHOTOS) return { ok: false, message: LIMIT_MESSAGE };

  // Nome da foto gerado aqui: o navegador não escolhe onde grava
  const upload = signImageUpload(listingPhotoPublicId(id, randomUUID()));
  if (!upload) {
    return { ok: false, message: "Envio de fotos indisponível no momento." };
  }
  return { ok: true, upload };
}

/** Salva no anúncio a foto que o navegador acabou de enviar. */
export async function addListingPhoto(
  listingId: string,
  url: string,
): Promise<PhotoActionResult> {
  const id = await requireOwnedListing(listingId);
  const config = getCloudinaryConfig();

  if (
    !config ||
    typeof url !== "string" ||
    !isListingPhotoUrl(url, config.cloudName, id)
  ) {
    return { ok: false, message: "Não foi possível salvar a foto." };
  }

  const count = await prisma.listingPhoto.count({ where: { listingId: id } });
  if (count >= MAX_LISTING_PHOTOS) return { ok: false, message: LIMIT_MESSAGE };

  // A primeira foto vira a capa (position 0)
  await prisma.listingPhoto.create({
    data: { listingId: id, url, position: count },
  });
  refresh();
  return { ok: true };
}

export async function removeListingPhoto(
  listingId: string,
  photoId: string,
): Promise<PhotoActionResult> {
  const id = await requireOwnedListing(listingId);
  const photo = await prisma.listingPhoto.findFirst({
    where: { id: photoId, listingId: id },
    select: { id: true, url: true },
  });
  if (!photo) return { ok: false, message: "Foto não encontrada." };

  await prisma.listingPhoto.delete({ where: { id: photo.id } });
  // As fotos seguintes sobem uma posição (a próxima vira a capa)
  await savePositions(withoutPhoto(await photoIds(id), photo.id));

  // O anúncio já não aponta para a foto: se apagar no Cloudinary falhar, só
  // sobra um arquivo órfão na pasta do anúncio
  const publicId = publicIdFromUrl(photo.url);
  if (publicId) {
    await deleteImage(publicId).catch((error) => {
      console.error("Falha ao apagar a foto do anúncio no Cloudinary:", error);
    });
  }
  refresh();
  return { ok: true };
}

export async function setListingCoverPhoto(
  listingId: string,
  photoId: string,
): Promise<PhotoActionResult> {
  const id = await requireOwnedListing(listingId);
  const ids = await photoIds(id);
  if (!ids.includes(photoId)) {
    return { ok: false, message: "Foto não encontrada." };
  }

  await savePositions(withCoverFirst(ids, photoId));
  refresh();
  return { ok: true };
}
