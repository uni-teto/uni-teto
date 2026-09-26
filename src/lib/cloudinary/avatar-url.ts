// Funções puras sobre as URLs de avatar do Cloudinary (sem SDK, sem segredo).

export const AVATAR_FORMATS = ["jpg", "png", "webp"] as const;

/** Onde fica a foto de cada usuário: uma só, sobrescrita a cada troca. */
export function avatarPublicId(userId: string) {
  return `uniteto/avatars/${userId}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Confere se a URL é a foto que o próprio usuário enviou (mesma conta do
 * Cloudinary e mesmo caminho da assinatura). Impede salvar URL de outra
 * pessoa ou de outro site no perfil.
 */
export function isOwnAvatarUrl(url: string, cloudName: string, userId: string) {
  const pattern = new RegExp(
    `^https://res\\.cloudinary\\.com/${escapeRegExp(cloudName)}/image/upload/v\\d+/` +
      `${escapeRegExp(avatarPublicId(userId))}\\.(${AVATAR_FORMATS.join("|")})$`,
  );
  return pattern.test(url);
}

/**
 * URL de exibição: o Cloudinary corta em quadrado centralizando o rosto,
 * redimensiona e escolhe formato/qualidade pelo navegador.
 */
export function avatarThumbnailUrl(url: string, size: number) {
  const transformation = `c_fill,g_face,w_${size},h_${size},f_auto,q_auto`;
  return url.replace("/image/upload/", `/image/upload/${transformation}/`);
}
