// Funções puras sobre as URLs de avatar do Cloudinary (sem SDK, sem segredo).
import {
  escapeRegExp,
  IMAGE_FORMATS,
  matchesImageUrl,
  transformedUrl,
} from "./image-url";

export const AVATAR_FORMATS = IMAGE_FORMATS;

/** Onde fica a foto de cada usuário: uma só, sobrescrita a cada troca. */
export function avatarPublicId(userId: string) {
  return `uniteto/avatars/${userId}`;
}

/**
 * Confere se a URL é a foto que o próprio usuário enviou (mesma conta do
 * Cloudinary e mesmo caminho da assinatura). Impede salvar URL de outra
 * pessoa ou de outro site no perfil.
 */
export function isOwnAvatarUrl(url: string, cloudName: string, userId: string) {
  return matchesImageUrl(url, cloudName, escapeRegExp(avatarPublicId(userId)));
}

/**
 * URL de exibição: o Cloudinary corta em quadrado centralizando o rosto,
 * redimensiona e escolhe formato/qualidade pelo navegador.
 */
export function avatarThumbnailUrl(url: string, size: number) {
  return transformedUrl(url, `c_fill,g_face,w_${size},h_${size},f_auto,q_auto`);
}
