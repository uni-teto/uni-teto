// Fotos "órfãs" no Cloudinary: arquivos que nenhum anúncio ou perfil usa.
// Aparecem quando alguém envia a foto e fecha a página antes de salvar, ou
// quando apagar no Cloudinary falha ao excluir um anúncio.

/** Pastas do UniTeto; o script nunca mexe fora delas. */
export const MANAGED_PREFIXES = ["uniteto/listings/", "uniteto/avatars/"];

/**
 * Idade mínima para considerar órfã: entre assinar o envio e salvar a foto
 * passam segundos, mas uma foto recém-enviada nunca deve ser apagada.
 */
export const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000;

export type StoredImage = { publicId: string; createdAt: Date };

/** Imagens das pastas do UniTeto que não estão em uso e já são antigas. */
export function findOrphans(
  images: StoredImage[],
  usedPublicIds: ReadonlySet<string>,
  now: Date,
  minAgeMs = ORPHAN_MIN_AGE_MS,
): StoredImage[] {
  return images.filter(
    (image) =>
      MANAGED_PREFIXES.some((prefix) => image.publicId.startsWith(prefix)) &&
      !usedPublicIds.has(image.publicId) &&
      now.getTime() - image.createdAt.getTime() >= minAgeMs,
  );
}
