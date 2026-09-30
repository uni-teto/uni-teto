"use client";

import Link from "next/link";
import { listingPath } from "@/lib/auth/routes";
import { listingPhotoThumbnailUrl } from "@/lib/cloudinary/listing-photo-url";
import { formatDistance } from "@/lib/geo/distance";
import { LISTING_TYPE_LABELS } from "@/lib/listings/listing-types";
import { formatPrice } from "@/lib/listings/price";
import type { SearchResultItem } from "@/lib/search/search-listings";
import { cn } from "@/lib/utils";
import { useSearchUi } from "./search-ui";

/**
 * Card de um resultado da busca (também usado nos destaques da página inicial). O card inteiro leva ao anúncio; com campus
 * escolhido, o link guarda o campus para a página do anúncio mostrar a mesma
 * distância. O contato não aparece aqui: fica na página do anúncio.
 */
export function ListingCard({
  listing,
  campusId,
  titleAs: Title = "h2",
}: {
  listing: SearchResultItem;
  campusId: string | null;
  /** Nível do título: `h3` quando a lista fica dentro de uma seção com `h2` */
  titleAs?: "h2" | "h3";
}) {
  const href = listingPath(listing.id, campusId);
  // Na busca, o card e o marcador do mapa se destacam juntos
  const { activeId, setActiveId } = useSearchUi();
  const active = activeId === listing.id;
  // Centro do bairro: a distância pode errar bastante (decisão de 30/09/2026)
  const approximate = listing.locationPrecision === "bairro";

  return (
    <li
      aria-label={listing.title}
      data-active={active || undefined}
      onMouseEnter={() => setActiveId(listing.id)}
      onMouseLeave={() => setActiveId(null)}
      onFocus={() => setActiveId(listing.id)}
      onBlur={() => setActiveId(null)}
    >
      <Link
        href={href}
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-xl border transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          active && "border-foreground/30 ring-2 ring-ring",
        )}
      >
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          {listing.coverUrl ? (
            // O Cloudinary já entrega a foto cortada e otimizada
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listingPhotoThumbnailUrl(listing.coverUrl, 480, 360)}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              Sem fotos
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">
            {LISTING_TYPE_LABELS[listing.type]} · {listing.neighborhood},{" "}
            {listing.city}
          </p>
          <Title className="line-clamp-2 font-medium">{listing.title}</Title>
          <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 pt-2">
            <p className="font-semibold">
              {formatPrice(listing.priceCents)}
              <span className="text-sm font-normal text-muted-foreground">
                /mês
              </span>
            </p>
            {listing.distanceMeters !== null && (
              <p
                className="text-sm text-muted-foreground"
                title={
                  approximate
                    ? "Distância aproximada: o ponto é o centro do bairro"
                    : undefined
                }
              >
                {approximate && "≈ "}
                {formatDistance(listing.distanceMeters)} do campus
              </p>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
