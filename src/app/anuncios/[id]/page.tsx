import {
  BedDoubleIcon,
  MailIcon,
  MapPinIcon,
  MessageCircleIcon,
  SchoolIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { LazyListingMap } from "@/components/map/lazy-listing-map";
import { buttonVariants } from "@/components/ui/button";
import {
  editListingPath,
  listingPath,
  listingPhotosPath,
  MY_LISTINGS_PATH,
  signInUrl,
} from "@/lib/auth/routes";
import { getSession } from "@/lib/auth/session";
import { listingPhotoThumbnailUrl } from "@/lib/cloudinary/listing-photo-url";
import { getCampusDistancesToListing } from "@/lib/geo/campus-distance";
import { formatDistance } from "@/lib/geo/distance";
import { chooseCampusIds } from "@/lib/listings/campus-choice";
import {
  type ContactBlock,
  contactBlockFor,
  type ListingContact,
  listingContact,
} from "@/lib/listings/contact";
import { LISTING_TYPE_LABELS } from "@/lib/listings/listing-types";
import {
  APPROXIMATE_RADIUS_METERS,
  publicLocationNotice,
} from "@/lib/listings/location-notice";
import { formatPrice } from "@/lib/listings/price";
import { maskZipCodeInput } from "@/lib/listings/zip-code";
import { prisma } from "@/lib/prisma";
import { CampusSelect } from "./campus-select";
import { PhotoGallery } from "./photo-gallery";

// Página pública do anúncio (#27). Pausado só aparece para o dono; para os
// outros, 404. O contato segue a regra da #32 (src/lib/listings/contact.ts).

// `cache`: a mesma consulta serve ao generateMetadata e à página
const getListing = cache(async (id: string) =>
  prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      status: true,
      priceCents: true,
      availableSpots: true,
      street: true,
      number: true,
      complement: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
      latitude: true,
      longitude: true,
      locationPrecision: true,
      ownerId: true,
      createdAt: true,
      photos: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { url: true },
      },
    },
  }),
);

/** O anúncio, se quem está vendo pode vê-lo (`null` = 404). */
async function getVisibleListing(id: string) {
  const [listing, session] = await Promise.all([getListing(id), getSession()]);
  if (!listing) return null;
  if (listing.status === "PAUSADO" && listing.ownerId !== session?.user.id) {
    return null;
  }
  return { listing, session };
}

export async function generateMetadata({
  params,
}: PageProps<"/anuncios/[id]">): Promise<Metadata> {
  const { id } = await params;
  const visible = await getVisibleListing(id);
  if (!visible) return { title: "Anúncio não encontrado | UniTeto" };

  // Prévia do link ao compartilhar (WhatsApp, redes): capa, preço e bairro
  const { listing } = visible;
  const description = `${LISTING_TYPE_LABELS[listing.type]} por ${formatPrice(listing.priceCents)}/mês em ${listing.neighborhood}, ${listing.city} - ${listing.state}.`;
  const cover = listing.photos[0]?.url;
  return {
    title: `${listing.title} | UniTeto`,
    description,
    openGraph: {
      title: listing.title,
      description,
      url: listingPath(listing.id),
      images: cover
        ? [
            {
              url: listingPhotoThumbnailUrl(cover, 1200, 630),
              width: 1200,
              height: 630,
            },
          ]
        : undefined,
    },
    // Pausado só o dono vê: não deve ir para buscadores
    robots: listing.status === "PAUSADO" ? { index: false } : undefined,
  };
}

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

export default async function ListingPage({
  params,
  searchParams,
}: PageProps<"/anuncios/[id]">) {
  const { id } = await params;
  const { campus: requestedCampus } = await searchParams;
  const visible = await getVisibleListing(id);
  if (!visible) notFound();
  const { listing, session } = visible;

  const viewer = session
    ? { id: session.user.id, role: session.user.role }
    : null;
  const isOwner = viewer?.id === listing.ownerId;

  // Distância: campus escolhido na página ou os da universidade do estudante
  const campuses = await prisma.campus.findMany({
    orderBy: [{ university: { acronym: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      universityId: true,
      university: { select: { acronym: true } },
    },
  });
  const campusById = new Map(campuses.map((c) => [c.id, c]));
  const studentUniversityId =
    session?.user.role === "ESTUDANTE" ? session.user.universityId : null;
  const shownIds = chooseCampusIds(
    requestedCampus,
    new Set(campusById.keys()),
    campuses
      .filter((c) => c.universityId === studentUniversityId)
      .map((c) => c.id),
  );
  const distances = (
    await getCampusDistancesToListing(listing.id, shownIds)
  ).map(({ campusId, distanceMeters }) => ({
    campus: campusById.get(campusId)!,
    distanceMeters,
  }));
  const campusLabel = (c: (typeof campuses)[number]) =>
    `${c.university.acronym} · ${c.name}`;
  const locationWarning = publicLocationNotice(listing.locationPrecision);

  // Contato decidido aqui, no servidor: sem permissão, o e-mail e o WhatsApp
  // nem saem do banco (e não chegam ao HTML)
  const block = contactBlockFor(viewer, listing.ownerId);
  let contact: ListingContact | null = null;
  if (!block) {
    const owner = await prisma.user.findUniqueOrThrow({
      where: { id: listing.ownerId },
      select: { name: true, email: true, whatsapp: true },
    });
    contact = listingContact(owner, listing.title);
  }

  const address = [
    `${listing.street}, ${listing.number}`,
    listing.complement,
    listing.neighborhood,
    `${listing.city} - ${listing.state}`,
    `CEP ${maskZipCodeInput(listing.zipCode)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      {isOwner && (
        <div
          role="note"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/50 p-4 text-sm"
        >
          <p>
            {listing.status === "PAUSADO"
              ? "Este anúncio está pausado: só você consegue vê-lo."
              : "Este é o seu anúncio, do jeito que os outros o veem."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={editListingPath(listing.id)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Editar
            </Link>
            <Link
              href={listingPhotosPath(listing.id)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Fotos
            </Link>
            <Link
              href={MY_LISTINGS_PATH}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Meus anúncios
            </Link>
          </div>
        </div>
      )}

      {/* No celular: fotos e descrição, depois preço/distância/contato, depois
          o mapa. No computador, preço/distância/contato ficam na lateral. */}
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-8 lg:col-start-1">
          <PhotoGallery
            urls={listing.photos.map((p) => p.url)}
            title={listing.title}
          />

          <section className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {LISTING_TYPE_LABELS[listing.type]}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {listing.title}
            </h1>
            <p className="leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
            <p className="text-xs text-muted-foreground">
              Publicado em {dateFormat.format(listing.createdAt)}
            </p>
          </section>
        </div>

        <section
          aria-labelledby="localizacao"
          className="min-w-0 space-y-3 lg:col-start-1"
        >
          <h2 id="localizacao" className="text-lg font-semibold">
            Localização
          </h2>
          <p className="flex gap-2 text-sm">
            <MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{address}</span>
          </p>
          {locationWarning && (
            <p className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <TriangleAlertIcon
                className="mt-0.5 size-4 shrink-0 text-amber-600"
                aria-hidden
              />
              <span>{locationWarning}</span>
            </p>
          )}
          <div className="h-80 overflow-hidden rounded-xl border">
            <LazyListingMap
              listing={{
                title: listing.title,
                latitude: listing.latitude,
                longitude: listing.longitude,
                approximateRadius:
                  APPROXIMATE_RADIUS_METERS[listing.locationPrecision],
              }}
              campuses={distances.map(({ campus }) => ({
                id: campus.id,
                name: campusLabel(campus),
                latitude: campus.latitude,
                longitude: campus.longitude,
              }))}
            />
          </div>
        </section>

        <aside className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="space-y-2 rounded-xl border p-4">
            <p className="text-2xl font-semibold">
              {formatPrice(listing.priceCents)}
              <span className="text-sm font-normal text-muted-foreground">
                /mês
              </span>
            </p>
            <p className="flex items-center gap-2 text-sm">
              <BedDoubleIcon className="size-4" aria-hidden />
              {listing.availableSpots}{" "}
              {listing.availableSpots === 1
                ? "vaga disponível"
                : "vagas disponíveis"}
            </p>
          </div>

          <section
            aria-labelledby="distancia"
            className="space-y-3 rounded-xl border p-4"
          >
            <h2
              id="distancia"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <SchoolIcon className="size-4" aria-hidden />
              Distância até o campus
            </h2>
            <CampusSelect
              campuses={campuses.map((c) => ({
                id: c.id,
                label: campusLabel(c),
              }))}
              value={
                typeof requestedCampus === "string" &&
                campusById.has(requestedCampus)
                  ? requestedCampus
                  : ""
              }
            />
            {distances.length > 0 ? (
              <>
                <ul className="space-y-1 text-sm">
                  {distances.map(({ campus, distanceMeters }) => (
                    <li key={campus.id} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">
                        {campusLabel(campus)}
                      </span>
                      <span className="shrink-0 font-medium">
                        {locationWarning && "cerca de "}
                        {formatDistance(distanceMeters)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">Em linha reta.</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Escolha um campus para ver a distância em linha reta.
              </p>
            )}
          </section>

          <ContactCard
            block={block}
            contact={contact}
            signIn={signInUrl(listingPath(listing.id))}
          />
        </aside>
      </div>
    </main>
  );
}

function ContactCard({
  block,
  contact,
  signIn,
}: {
  block: ContactBlock | null;
  contact: ListingContact | null;
  signIn: string;
}) {
  return (
    <section
      aria-labelledby="contato"
      className="space-y-3 rounded-xl border p-4"
    >
      <h2 id="contato" className="text-sm font-medium">
        Contato
      </h2>
      {contact ? (
        <>
          <p className="text-sm text-muted-foreground">
            Anunciado por{" "}
            <span className="text-foreground">{contact.ownerName}</span>
          </p>
          {contact.whatsapp && (
            <a
              href={contact.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ className: "w-full" })}
            >
              <MessageCircleIcon aria-hidden />
              WhatsApp {contact.whatsapp.label}
            </a>
          )}
          <a
            href={contact.email.href}
            className={buttonVariants({
              variant: contact.whatsapp ? "outline" : "default",
              className: "w-full",
            })}
          >
            <MailIcon aria-hidden />
            <span className="truncate">{contact.email.address}</span>
          </a>
        </>
      ) : block === "dono" ? (
        <p className="text-sm text-muted-foreground">
          Estudantes logados veem aqui o seu WhatsApp e e-mail.
        </p>
      ) : block === "anunciante" ? (
        <p className="text-sm text-muted-foreground">
          O contato aparece só para estudantes com e-mail institucional.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Entre com seu e-mail de estudante para ver o contato.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={signIn} className={buttonVariants({ size: "sm" })}>
              Entrar
            </Link>
            <Link
              href="/cadastro?papel=estudante"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Criar conta de estudante
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
