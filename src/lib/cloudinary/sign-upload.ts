import { v2 as cloudinary } from "cloudinary";
import { AVATAR_FORMATS, avatarPublicId } from "./avatar-url";

// Credenciais em CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e
// CLOUDINARY_API_SECRET (painel do Cloudinary → Settings → API Keys).
// O segredo nunca vai para o navegador: só a assinatura gerada com ele.
export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

/**
 * Parâmetros para o navegador enviar a foto direto ao Cloudinary.
 * A assinatura fixa o `public_id` (pasta do usuário) e os formatos aceitos,
 * então o navegador não consegue gravar em outro lugar.
 */
export function signAvatarUpload(userId: string) {
  const config = getCloudinaryConfig();
  if (!config) return null;

  const params = {
    timestamp: Math.round(Date.now() / 1000),
    public_id: avatarPublicId(userId),
    overwrite: true,
    invalidate: true,
    allowed_formats: AVATAR_FORMATS.join(","),
  };
  const signature = cloudinary.utils.api_sign_request(params, config.apiSecret);

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    fields: { ...params, api_key: config.apiKey, signature },
  };
}

/** Apaga a foto do usuário no Cloudinary (ao remover a foto do perfil). */
export async function deleteAvatarImage(userId: string) {
  const config = getCloudinaryConfig();
  if (!config) return;

  // Chamadas à API do Cloudinary (diferente da assinatura) leem a config global
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
  });
  await cloudinary.uploader.destroy(avatarPublicId(userId), {
    invalidate: true,
  });
}
