"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GripIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { transformedUrl } from "@/lib/cloudinary/image-url";
import { listingPhotoThumbnailUrl } from "@/lib/cloudinary/listing-photo-url";
import { cn } from "@/lib/utils";

/**
 * Fotos do anúncio: mosaico com a capa grande e até quatro menores (no
 * celular, só a capa). Clicar abre as fotos em tela cheia, com setas e Esc.
 */
export function PhotoGallery({
  urls,
  title,
}: {
  urls: string[];
  title: string;
}) {
  // Foto aberta em tela cheia (`null` = fechado)
  const [open, setOpen] = useState<number | null>(null);

  if (urls.length === 0) {
    return (
      <div className="flex aspect-[2/1] flex-col items-center justify-center gap-2 rounded-3xl border bg-gradient-to-br from-muted to-border/60 text-sm text-muted-foreground">
        <Logo variant="symbol" className="h-12 opacity-15" />
        Sem fotos
      </div>
    );
  }

  const tiles = urls.slice(0, 5);

  return (
    <>
      <div
        className={cn(
          "relative grid aspect-[4/3] gap-2 overflow-hidden rounded-3xl sm:aspect-[2/1]",
          tiles.length > 1 && "sm:grid-cols-4 sm:grid-rows-2",
        )}
      >
        {tiles.map((url, index) => (
          <button
            key={url}
            type="button"
            aria-label={`Ver foto ${index + 1} de ${urls.length}`}
            onClick={() => setOpen(index)}
            className={cn(
              "group relative overflow-hidden bg-muted",
              index === 0
                ? "sm:col-span-2 sm:row-span-2"
                : // No celular só a capa; em tela larga, as menores
                  "hidden sm:block",
              // Com 2 a 4 fotos, as últimas ocupam o espaço que sobra
              tiles.length === 2 &&
                index === 1 &&
                "sm:col-span-2 sm:row-span-2",
              tiles.length === 3 && index > 0 && "sm:col-span-2",
              tiles.length === 4 && index === 3 && "sm:col-span-2",
            )}
          >
            {/* O Cloudinary já entrega a foto cortada e otimizada */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={listingPhotoThumbnailUrl(
                url,
                index === 0 ? 1200 : 600,
                index === 0 ? 900 : 450,
              )}
              alt={index === 0 ? `Foto 1 de ${urls.length}: ${title}` : ""}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </button>
        ))}
        {urls.length > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(0)}
            className="absolute right-4 bottom-4 shadow-sm"
          >
            <GripIcon aria-hidden />
            Ver as {urls.length} fotos
          </Button>
        )}
      </div>

      {open !== null && (
        <PhotoViewer
          urls={urls}
          title={title}
          index={open}
          onIndexChange={setOpen}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

/** Fotos em tela cheia, uma por vez. */
function PhotoViewer({
  urls,
  title,
  index,
  onIndexChange,
  onClose,
}: {
  urls: string[];
  title: string;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const previous = () => onIndexChange((index - 1 + urls.length) % urls.length);
  const next = () => onIndexChange((index + 1) % urls.length);

  // Teclado: Esc fecha, setas trocam; a página atrás não rola
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") {
        onIndexChange((index - 1 + urls.length) % urls.length);
      }
      if (event.key === "ArrowRight") onIndexChange((index + 1) % urls.length);
    }
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [index, urls.length, onIndexChange, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos: ${title}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
    >
      <div className="flex items-center justify-between p-4">
        <p className="text-sm">
          {index + 1} de {urls.length}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Fechar fotos"
          autoFocus
          onClick={onClose}
          className="text-white hover:bg-white/10 hover:text-white"
        >
          <XIcon aria-hidden />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-2 px-2 pb-6 sm:px-6">
        {urls.length > 1 && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Foto anterior"
            onClick={previous}
          >
            <ChevronLeftIcon aria-hidden />
          </Button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          // Sem cortar: a foto inteira, até 1600 px
          src={transformedUrl(
            urls[index],
            "c_limit,w_1600,h_1200,f_auto,q_auto",
          )}
          alt={`Foto ${index + 1} de ${urls.length}: ${title}`}
          className="max-h-full min-w-0 flex-1 rounded-xl object-contain"
        />
        {urls.length > 1 && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Próxima foto"
            onClick={next}
          >
            <ChevronRightIcon aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}
