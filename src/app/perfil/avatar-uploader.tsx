"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { AVATAR_FORMATS } from "@/lib/cloudinary/avatar-url";
import { getAvatarUploadParams, removeAvatar, saveAvatar } from "./actions";

const MAX_SIZE_MB = 5;
const ACCEPT = AVATAR_FORMATS.map((format) =>
  format === "jpg" ? "image/jpeg" : `image/${format}`,
).join(",");

/**
 * Foto do perfil com os botões de trocar e remover.
 * Envia a foto direto do navegador para o Cloudinary (a imagem não passa pelo
 * nosso servidor) usando a assinatura gerada em `getAvatarUploadParams`.
 */
export function AvatarUploader({
  name,
  image,
  enabled,
}: {
  name: string;
  image: string | null;
  enabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "removing">(
    "idle",
  );
  // Prévia local da foto escolhida, mostrada enquanto o envio acontece
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function upload(file: File) {
    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("Use uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`A imagem pode ter no máximo ${MAX_SIZE_MB} MB.`);
      return;
    }

    setPreview(URL.createObjectURL(file));
    setStatus("uploading");
    try {
      const params = await getAvatarUploadParams();
      if (!params) throw new Error("Cloudinary não configurado");

      const body = new FormData();
      body.append("file", file);
      for (const [key, value] of Object.entries(params.fields)) {
        body.append(key, String(value));
      }

      const response = await fetch(params.uploadUrl, { method: "POST", body });
      if (!response.ok) throw new Error(`Cloudinary: ${response.status}`);
      const { secure_url } = (await response.json()) as { secure_url: string };

      const result = await saveAvatar(secure_url);
      if (!result.ok) throw new Error(result.message);
      toast.success("Foto atualizada.");
    } catch {
      toast.error("Não foi possível enviar a foto. Tente novamente.");
    } finally {
      setPreview(null);
      setStatus("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setStatus("removing");
    const result = await removeAvatar();
    setStatus("idle");
    if (result.ok) toast.success("Foto removida.");
    else toast.error("Não foi possível remover a foto.");
  }

  const busy = status !== "idle";

  return (
    <div className="flex flex-col items-center gap-3">
      <UserAvatar
        name={name}
        image={preview ?? image}
        size={96}
        className={status === "uploading" ? "animate-pulse opacity-70" : ""}
      />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!enabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          {status === "uploading"
            ? "Enviando..."
            : image
              ? "Alterar foto"
              : "Adicionar foto"}
        </Button>
        {image && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={remove}
          >
            {status === "removing" ? "Removendo..." : "Remover"}
          </Button>
        )}
      </div>
      {!enabled && (
        <p className="text-xs text-muted-foreground">
          Envio de foto indisponível no momento.
        </p>
      )}
    </div>
  );
}
