import { z } from "zod";
import { publicIdFromUrl } from "@/lib/cloudinary/image-url";
import { MANAGED_PREFIXES } from "@/lib/cloudinary/orphans";
import { createRateLimiter } from "@/lib/rate-limit";

// "Excluir minha conta" (LGPD): apaga o usuário e tudo que é dele. No banco,
// anúncios, fotos, sessões e logins saem em cascata; as imagens no Cloudinary
// são apagadas aqui, depois.
//
// A rota pública do Better Auth (/api/auth/delete-user) fica desligada
// (`disabledPaths` em src/lib/auth/server.ts): sem senha ela aceitaria
// excluir quem entrou há menos de 1 dia. Aqui a senha é sempre obrigatória.

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Digite sua senha para confirmar."),
});

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; fieldErrors?: { password?: string[] }; message?: string };

export const WRONG_PASSWORD = "Senha incorreta.";
export const TOO_MANY_ATTEMPTS =
  "Muitas tentativas. Espere alguns minutos e tente de novo.";

type Dependencies = {
  /** URLs das imagens do usuário (fotos dos anúncios e foto de perfil). */
  findImageUrls: (userId: string) => Promise<string[]>;
  /** Confere a senha e apaga o usuário; `false` se a senha estiver errada. */
  deleteUser: (password: string) => Promise<boolean>;
  deleteImage: (publicId: string) => Promise<void>;
  /** Limite de tentativas de senha (senão daria para adivinhar sem parar). */
  attempts: { hit: (key: string) => { ok: boolean } };
};

/** 5 tentativas a cada 15 minutos por pessoa. */
export const deleteAccountAttempts = createRateLimiter({
  limit: 5,
  windowMs: 15 * 60_000,
});

/**
 * Exclui a conta de `userId` (o usuário logado) depois de conferir a senha.
 * Falha ao apagar uma imagem no Cloudinary não desfaz a exclusão: fica no
 * log e o `npm run cloudinary:cleanup` pega depois.
 */
export async function deleteAccount(
  userId: string,
  input: unknown,
  deps: Dependencies,
): Promise<DeleteAccountResult> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  if (!deps.attempts.hit(userId).ok) {
    return { ok: false, message: TOO_MANY_ATTEMPTS };
  }

  // Antes de apagar: depois, os anúncios e fotos já saíram do banco
  const publicIds = (await deps.findImageUrls(userId))
    .map(publicIdFromUrl)
    .filter(
      (id): id is string =>
        id !== null && MANAGED_PREFIXES.some((prefix) => id.startsWith(prefix)),
    );

  const deleted = await deps.deleteUser(parsed.data.password);
  if (!deleted) {
    return { ok: false, fieldErrors: { password: [WRONG_PASSWORD] } };
  }

  await Promise.all(
    publicIds.map((publicId) =>
      deps.deleteImage(publicId).catch((error) => {
        console.error(`Conta excluída: falha ao apagar ${publicId}`, error);
      }),
    ),
  );
  return { ok: true };
}
