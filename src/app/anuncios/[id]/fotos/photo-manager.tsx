"use client";

import { ImagePlusIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  listingPhotoThumbnailUrl,
  MAX_LISTING_PHOTOS,
} from "@/lib/cloudinary/listing-photo-url";
import {
  IMAGE_ACCEPT,
  imageFileError,
  uploadImage,
} from "@/lib/cloudinary/upload-client";
import {
  addListingPhoto,
  getListingPhotoUploadParams,
  removeListingPhoto,
  setListingCoverPhoto,
} from "./actions";

type Photo = { id: string; url: string };

/**
 * Lista as fotos do anúncio e envia novas direto do navegador para o
 * Cloudinary, uma de cada vez (cada uma com sua assinatura do servidor).
 * Depois de cada ação o servidor atualiza a página (`refresh()`), e a lista
 * chega de novo por `photos`.
 */
export function PhotoManager({
  listingId,
  photos,
  enabled,
}: {
  listingId: string;
  photos: Photo[];
  enabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [busyPhotoId, setBusyPhotoId] = useState<string | null>(null);
  const remaining = MAX_LISTING_PHOTOS - photos.length;

  async function uploadFiles(files: File[]) {
    if (files.length > remaining) {
      toast.error(
        `Você pode adicionar mais ${remaining} foto(s) neste anúncio.`,
      );
      files = files.slice(0, remaining);
    }

    let sent = 0;
    for (const [index, file] of files.entries()) {
      const fileError = imageFileError(file);
      if (fileError) {
        toast.error(`${file.name}: ${fileError}`);
        continue;
      }

      setProgress(`Enviando ${index + 1} de ${files.length}...`);
      try {
        const signed = await getListingPhotoUploadParams(listingId);
        if (!signed.ok) {
          toast.error(signed.message);
          break;
        }
        const secureUrl = await uploadImage(file, signed.upload);
        const saved = await addListingPhoto(listingId, secureUrl);
        if (!saved.ok) throw new Error(saved.message);
        sent++;
      } catch {
        toast.error(`${file.name}: não foi possível enviar. Tente de novo.`);
      }
    }

    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    if (sent > 0) {
      toast.success(
        sent === 1 ? "Foto adicionada." : `${sent} fotos adicionadas.`,
      );
    }
  }

  async function run(
    photoId: string,
    action: () => Promise<{ ok: boolean }>,
    done: string,
  ) {
    setBusyPhotoId(photoId);
    const result = await action().catch(() => ({ ok: false }));
    setBusyPhotoId(null);
    if (result.ok) toast.success(done);
    else toast.error("Não foi possível concluir. Tente de novo.");
  }

  const busy = progress !== null || busyPhotoId !== null;

  return (
    <div className="space-y-4">
      {photos.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {photos.map((photo, index) => (
            <li key={photo.id} className="overflow-hidden rounded-lg border">
              <div className="relative">
                {/* O Cloudinary já entrega a foto cortada e otimizada */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={listingPhotoThumbnailUrl(photo.url, 800, 600)}
                  alt={index === 0 ? "Foto de capa" : `Foto ${index + 1}`}
                  className="aspect-[4/3] w-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute top-2 left-2 rounded-md bg-background/90 px-2 py-0.5 text-xs font-medium">
                    Capa
                  </span>
                )}
              </div>
              <div className="flex justify-end gap-2 p-2">
                {index > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      run(
                        photo.id,
                        () => setListingCoverPhoto(listingId, photo.id),
                        "Capa atualizada.",
                      )
                    }
                  >
                    Tornar capa
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm("Remover esta foto do anúncio?"))
                      return;
                    run(
                      photo.id,
                      () => removeListingPhoto(listingId, photo.id),
                      "Foto removida.",
                    );
                  }}
                >
                  {busyPhotoId === photo.id ? "Aguarde..." : "Remover"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhuma foto ainda. Anúncios com fotos chamam mais atenção.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="hidden"
        aria-label="Escolher fotos"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) uploadFiles(files);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={!enabled || busy || remaining <= 0}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlusIcon aria-hidden />
          {progress ?? "Adicionar fotos"}
        </Button>
        <p className="text-sm text-muted-foreground">
          {enabled
            ? remaining > 0
              ? `JPG, PNG ou WEBP, até 5 MB cada. Pode adicionar mais ${remaining}.`
              : `Limite de ${MAX_LISTING_PHOTOS} fotos atingido.`
            : "Envio de fotos indisponível no momento; o anúncio continua publicado sem fotos."}
        </p>
      </div>
    </div>
  );
}
