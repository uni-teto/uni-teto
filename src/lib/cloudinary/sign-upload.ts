import { v2 as cloudinary } from "cloudinary";
import { avatarPublicId } from "./avatar-url";
import { IMAGE_FORMATS } from "./image-url";

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

export type SignedUpload = {
  uploadUrl: string;
  fields: Record<string, string | number | boolean>;
};

/**
 * Parâmetros para o navegador enviar uma imagem direto ao Cloudinary.
 * A assinatura fixa o `public_id` e os formatos aceitos, então o navegador não
 * consegue gravar em outro lugar. `null` sem as credenciais.
 */
export function signImageUpload(publicId: string): SignedUpload | null {
  const config = getCloudinaryConfig();
  if (!config) return null;

  const params = {
    timestamp: Math.round(Date.now() / 1000),
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    allowed_formats: IMAGE_FORMATS.join(","),
  };
  const signature = cloudinary.utils.api_sign_request(params, config.apiSecret);

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    fields: { ...params, api_key: config.apiKey, signature },
  };
}

/** Apaga uma imagem no Cloudinary (não faz nada sem as credenciais). */
export async function deleteImage(publicId: string) {
  const config = getCloudinaryConfig();
  if (!config) return;

  // Chamadas à API do Cloudinary (diferente da assinatura) leem a config global
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
  });
  await cloudinary.uploader.destroy(publicId, { invalidate: true });
}

/** Assinatura para a foto de perfil (sempre o mesmo caminho por usuário). */
export function signAvatarUpload(userId: string) {
  return signImageUpload(avatarPublicId(userId));
}

/** Apaga a foto do usuário no Cloudinary (ao remover a foto do perfil). */
export function deleteAvatarImage(userId: string) {
  return deleteImage(avatarPublicId(userId));
}
