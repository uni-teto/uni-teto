"use server";

import { APIError } from "better-auth/api";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import {
  deleteAccount,
  deleteAccountAttempts,
  type DeleteAccountResult,
} from "@/lib/account/delete-account";
import { auth } from "@/lib/auth/server";
import { getSession } from "@/lib/auth/session";
import { isOwnAvatarUrl } from "@/lib/cloudinary/avatar-url";
import {
  deleteAvatarImage,
  deleteImage,
  getCloudinaryConfig,
  signAvatarUpload,
} from "@/lib/cloudinary/sign-upload";
import { prisma } from "@/lib/prisma";
import { profileSchema, type ProfileInput } from "@/lib/profile/profile-schema";

// Server Actions podem ser chamadas direto por POST, então cada uma confere
// a sessão e valida os dados de novo (não confia no formulário).

async function requireUserId() {
  const session = await getSession();
  if (!session) throw new Error("Não autorizado");
  return session.user.id;
}

export type ActionResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

export async function updateProfile(
  input: ProfileInput,
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  await prisma.user.update({ where: { id: userId }, data: parsed.data });
  refresh();
  return { ok: true };
}

export async function getAvatarUploadParams() {
  const userId = await requireUserId();
  return signAvatarUpload(userId);
}

export async function saveAvatar(url: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const config = getCloudinaryConfig();

  if (!config || !isOwnAvatarUrl(url, config.cloudName, userId)) {
    return { ok: false, message: "Não foi possível salvar a foto." };
  }

  await prisma.user.update({ where: { id: userId }, data: { image: url } });
  refresh();
  return { ok: true };
}

export async function removeAvatar(): Promise<ActionResult> {
  const userId = await requireUserId();

  await prisma.user.update({ where: { id: userId }, data: { image: null } });
  // O perfil já não aponta para a foto: se apagar no Cloudinary falhar,
  // só sobra um arquivo órfão (é sobrescrito se a pessoa enviar outra foto)
  await deleteAvatarImage(userId).catch((error) => {
    console.error("Falha ao apagar a foto no Cloudinary:", error);
  });
  refresh();
  return { ok: true };
}

/**
 * Exclui a conta do usuário logado, com os anúncios e as fotos (LGPD).
 * A senha é conferida pelo Better Auth; a sessão acaba junto.
 */
export async function deleteMyAccount(
  input: unknown,
): Promise<DeleteAccountResult> {
  const userId = await requireUserId();
  const requestHeaders = await headers();

  return deleteAccount(userId, input, {
    findImageUrls: async (id) => {
      const [photos, user] = await Promise.all([
        prisma.listingPhoto.findMany({
          where: { listing: { ownerId: id } },
          select: { url: true },
        }),
        prisma.user.findUnique({ where: { id }, select: { image: true } }),
      ]);
      return [
        ...photos.map((p) => p.url),
        ...(user?.image ? [user.image] : []),
      ];
    },
    deleteUser: async (password) => {
      try {
        await auth.api.deleteUser({
          body: { password },
          headers: requestHeaders,
        });
        return true;
      } catch (error) {
        if (
          error instanceof APIError &&
          error.body?.code === "INVALID_PASSWORD"
        ) {
          return false;
        }
        throw error;
      }
    },
    deleteImage,
    attempts: deleteAccountAttempts,
  });
}
