// Funções puras sobre URLs de imagem do Cloudinary (sem SDK, sem segredo).
// Usadas pela foto de perfil (avatar-url.ts) e pelas fotos dos anúncios
// (listing-photo-url.ts).

/** Formatos aceitos no envio (a assinatura fixa `allowed_formats`). */
export const IMAGE_FORMATS = ["jpg", "png", "webp"] as const;

/** Tamanho máximo de cada imagem enviada. */
export const MAX_IMAGE_SIZE_MB = 5;

/** Tipos MIME para o `accept` do input de arquivo. */
export const IMAGE_MIME_TYPES = IMAGE_FORMATS.map((format) =>
  format === "jpg" ? "image/jpeg" : `image/${format}`,
);

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Confere se a URL é uma imagem enviada para a conta `cloudName`, com o
 * `public_id` batendo com `publicIdPattern` (trecho de expressão regular já
 * escapado). É o formato do `secure_url` que o Cloudinary devolve no envio.
 */
export function matchesImageUrl(
  url: string,
  cloudName: string,
  publicIdPattern: string,
) {
  const pattern = new RegExp(
    `^https://res\\.cloudinary\\.com/${escapeRegExp(cloudName)}/image/upload/v\\d+/` +
      `${publicIdPattern}\\.(${IMAGE_FORMATS.join("|")})$`,
  );
  return pattern.test(url);
}

/**
 * `public_id` a partir do `secure_url` (para apagar a imagem):
 * ".../image/upload/v123/uniteto/x/y.jpg" → "uniteto/x/y". `null` se a URL
 * não for de imagem do Cloudinary.
 */
export function publicIdFromUrl(url: string) {
  const match = /\/image\/upload\/(?:[^/]+\/)*?v\d+\/(.+)\.[a-z]+$/.exec(url);
  return match ? match[1] : null;
}

/** Insere uma transformação do Cloudinary na URL (ex: redimensionar). */
export function transformedUrl(url: string, transformation: string) {
  return url.replace("/image/upload/", `/image/upload/${transformation}/`);
}
