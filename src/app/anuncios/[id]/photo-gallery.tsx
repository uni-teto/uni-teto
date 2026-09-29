"use client";

import { useState } from "react";
import { listingPhotoThumbnailUrl } from "@/lib/cloudinary/listing-photo-url";
import { cn } from "@/lib/utils";

/** Foto grande com miniaturas para trocar; a primeira é a capa. */
export function PhotoGallery({
  urls,
  title,
}: {
  urls: string[];
  title: string;
}) {
  const [selected, setSelected] = useState(0);

  if (urls.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        Sem fotos
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* O Cloudinary já entrega a foto cortada e otimizada */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={listingPhotoThumbnailUrl(urls[selected], 960, 720)}
        alt={`Foto ${selected + 1} de ${urls.length}: ${title}`}
        className="aspect-[4/3] w-full rounded-xl bg-muted object-cover"
      />
      {urls.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {urls.map((url, index) => (
            <button
              key={url}
              type="button"
              aria-label={`Ver foto ${index + 1}`}
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
              className={cn(
                "overflow-hidden rounded-md ring-offset-2 ring-offset-background",
                index === selected && "ring-2 ring-primary",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={listingPhotoThumbnailUrl(url, 160, 120)}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
