"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { isOwnAvatarUrl } from "@/lib/cloudinary/avatar-url";
import {
  deleteAvatarImage,
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
