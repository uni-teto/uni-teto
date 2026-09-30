"use client";

import { HouseIcon } from "lucide-react";
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
          "group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:border-foreground hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          active && "-translate-y-0.5 border-foreground shadow-lg",
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
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <HouseIcon className="size-8 opacity-40" aria-hidden />
              Sem fotos
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {LISTING_TYPE_LABELS[listing.type]} · {listing.neighborhood},{" "}
            {listing.city}
          </p>
          <Title className="line-clamp-2 font-sans text-base font-medium tracking-normal">
            {listing.title}
          </Title>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3">
            <p className="font-heading text-lg font-semibold">
              {formatPrice(listing.priceCents)}
              <span className="font-sans text-sm font-normal text-muted-foreground">
                /mês
              </span>
            </p>
            {listing.distanceMeters !== null && (
              <p
                className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
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
