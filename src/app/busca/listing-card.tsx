"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
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
        className="group flex h-full flex-col gap-3 rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:outline-none"
      >
        <div
          className={cn(
            "aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted transition-shadow",
            active && "ring-2 ring-foreground ring-offset-2",
          )}
        >
          {listing.coverUrl ? (
            // O Cloudinary já entrega a foto cortada e otimizada
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listingPhotoThumbnailUrl(listing.coverUrl, 600, 450)}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-border/60 text-xs text-muted-foreground">
              <Logo variant="symbol" className="h-10 opacity-15" />
              Sem fotos
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 px-1">
          <p className="text-sm text-muted-foreground">
            {LISTING_TYPE_LABELS[listing.type]} · {listing.neighborhood},{" "}
            {listing.city}
          </p>
          <Title className="line-clamp-1 font-sans text-base font-semibold tracking-normal">
            {listing.title}
          </Title>
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
          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            <p>
              <span className="font-heading text-lg font-semibold">
                {formatPrice(listing.priceCents)}
              </span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </p>
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5"
            >
              <ArrowRightIcon className="size-4" />
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
