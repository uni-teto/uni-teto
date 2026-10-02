import { HouseIcon, PlusIcon, TriangleAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  editListingPath,
  listingPath,
  listingPhotosPath,
  MY_LISTINGS_PATH,
  NEW_LISTING_PATH,
  signInUrl,
} from "@/lib/auth/routes";
import { getSession } from "@/lib/auth/session";
import { listingPhotoThumbnailUrl } from "@/lib/cloudinary/listing-photo-url";
import { LISTING_TYPE_LABELS } from "@/lib/listings/listing-types";
import { formatPrice } from "@/lib/listings/price";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { ListingActions } from "./listing-actions";

export const metadata: Metadata = {
  title: "Meus anúncios | UniTeto",
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

// Estudantes e anunciantes podem anunciar, então os dois têm esta página
export default async function MyListingsPage() {
  const session = await getSession();
  // O proxy (src/proxy.ts) já redireciona sem cookie; aqui a sessão é validada
  if (!session) redirect(signInUrl(MY_LISTINGS_PATH));

  // Só os anúncios do usuário logado
  const listings = await prisma.listing.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      priceCents: true,
      availableSpots: true,
      status: true,
      neighborhood: true,
      locationPrecision: true,
      createdAt: true,
      photos: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: { url: true },
      },
      _count: { select: { photos: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Meus anúncios</h1>
        {listings.length > 0 && (
          <Link href={NEW_LISTING_PATH} className={buttonVariants()}>
            <PlusIcon aria-hidden />
            Criar anúncio
          </Link>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-card px-4 py-16 text-center">
          <HouseIcon className="size-8 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-medium">Você ainda não tem anúncios</p>
            <p className="text-sm text-muted-foreground">
              Anuncie um quarto, uma vaga em república ou uma quitinete.
            </p>
          </div>
          <Link href={NEW_LISTING_PATH} className={buttonVariants()}>
            Criar anúncio
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {listings.map((listing) => {
            const cover = listing.photos[0]?.url;
            const paused = listing.status === "PAUSADO";
            return (
              <li
                key={listing.id}
                aria-label={listing.title}
                className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row"
              >
                <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-40">
                  {cover ? (
                    // O Cloudinary já entrega a foto cortada e otimizada
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listingPhotoThumbnailUrl(cover, 320, 240)}
                      alt=""
                      className={cn(
                        "size-full object-cover",
                        paused && "opacity-50",
                      )}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                      Sem fotos
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-medium">{listing.title}</h2>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-medium",
                        paused
                          ? "bg-muted text-muted-foreground"
                          : "bg-green-500/15 text-green-700 dark:text-green-400",
                      )}
                    >
                      {paused ? "Pausado" : "Ativo"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {LISTING_TYPE_LABELS[listing.type]} ·{" "}
                    {formatPrice(listing.priceCents)}/mês ·{" "}
                    {listing.availableSpots}{" "}
                    {listing.availableSpots === 1 ? "vaga" : "vagas"} ·{" "}
                    {listing.neighborhood}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Publicado em {dateFormat.format(listing.createdAt)} ·{" "}
                    {listing._count.photos}{" "}
                    {listing._count.photos === 1 ? "foto" : "fotos"}
                  </p>
                  {/* "rua" é o comum em Teresina (o OSM quase não tem os
                      números); só o centro do bairro merece o alerta */}
                  {listing.locationPrecision === "bairro" && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                      <TriangleAlertIcon className="size-3.5" aria-hidden />
                      Localização aproximada (centro do bairro). Confira o
                      endereço em Editar.
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <Link
                      href={listingPath(listing.id)}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Ver
                    </Link>
                    <Link
                      href={editListingPath(listing.id)}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Editar
                    </Link>
                    <Link
                      href={listingPhotosPath(listing.id)}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Fotos
                    </Link>
                    <ListingActions
                      listingId={listing.id}
                      title={listing.title}
                      paused={paused}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
