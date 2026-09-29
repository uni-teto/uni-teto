// Funções puras sobre as URLs das fotos de anúncio no Cloudinary.
import { escapeRegExp, matchesImageUrl, transformedUrl } from "./image-url";

/** Quantas fotos cada anúncio pode ter. */
export const MAX_LISTING_PHOTOS = 8;

/** Pasta das fotos de um anúncio: `uniteto/listings/<listingId>`. */
export function listingPhotoFolder(listingId: string) {
  return `uniteto/listings/${listingId}`;
}

/** Caminho de uma foto; `photoKey` é gerado pelo servidor ao assinar. */
export function listingPhotoPublicId(listingId: string, photoKey: string) {
  return `${listingPhotoFolder(listingId)}/${photoKey}`;
}

/**
 * Confere se a URL é uma foto enviada para a pasta daquele anúncio, na conta
 * do Cloudinary do projeto. Impede salvar no anúncio a foto de outro anúncio
 * ou de outro site.
 */
export function isListingPhotoUrl(
  url: string,
  cloudName: string,
  listingId: string,
) {
  return matchesImageUrl(
    url,
    cloudName,
    `${escapeRegExp(listingPhotoFolder(listingId))}/[A-Za-z0-9_-]+`,
  );
}

/** Foto cortada no tamanho pedido, com formato/qualidade automáticos. */
export function listingPhotoThumbnailUrl(
  url: string,
  width: number,
  height: number,
) {
  return transformedUrl(url, `c_fill,w_${width},h_${height},f_auto,q_auto`);
}
