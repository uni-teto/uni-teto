// Envio de imagem do navegador direto para o Cloudinary (a imagem não passa
// pelo nosso servidor). Usado na foto de perfil e nas fotos dos anúncios.
import { IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_MB } from "./image-url";
import type { SignedUpload } from "./sign-upload";

/** Mensagem de erro se o arquivo não puder ser enviado; `null` se estiver ok. */
export function imageFileError(file: { type: string; size: number }) {
  if (!IMAGE_MIME_TYPES.includes(file.type)) {
    return "Use uma imagem JPG, PNG ou WEBP.";
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `A imagem pode ter no máximo ${MAX_IMAGE_SIZE_MB} MB.`;
  }
  return null;
}

/**
 * Envia o arquivo com a assinatura gerada pelo servidor e devolve o
 * `secure_url`. Lança erro se o Cloudinary recusar.
 */
export async function uploadImage(file: File, signed: SignedUpload) {
  const body = new FormData();
  body.append("file", file);
  for (const [key, value] of Object.entries(signed.fields)) {
    body.append(key, String(value));
  }

  const response = await fetch(signed.uploadUrl, { method: "POST", body });
  if (!response.ok) throw new Error(`Cloudinary: ${response.status}`);
  const { secure_url } = (await response.json()) as { secure_url: string };
  return secure_url;
}

/** Valor do `accept` do input de arquivo. */
export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(",");
