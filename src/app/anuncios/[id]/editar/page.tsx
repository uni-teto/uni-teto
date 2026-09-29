import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  editListingPath,
  listingPhotosPath,
  signInUrl,
} from "@/lib/auth/routes";
import { getSession } from "@/lib/auth/session";
import { listingToInput } from "@/lib/listings/listing-input";
import { prisma } from "@/lib/prisma";
import { ListingForm } from "../../listing-form";

export const metadata: Metadata = {
  title: "Editar anúncio | UniTeto",
};

export default async function EditListingPage({
  params,
}: PageProps<"/anuncios/[id]/editar">) {
  const { id } = await params;
  const session = await getSession();
  // O proxy (src/proxy.ts) já redireciona sem cookie; aqui a sessão é validada
  if (!session) redirect(signInUrl(editListingPath(id)));

  // Só o dono edita; para os outros é como se o anúncio não existisse
  const listing = await prisma.listing.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      priceCents: true,
      availableSpots: true,
      zipCode: true,
      street: true,
      number: true,
      complement: true,
      neighborhood: true,
      city: true,
      state: true,
    },
  });
  if (!listing) notFound();

  return (
    <main className="flex flex-1 justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>
            <h1>Editar anúncio</h1>
          </CardTitle>
          <CardDescription>
            Se mudar o endereço, localizamos de novo no mapa para atualizar a
            distância até os campi. As fotos ficam em{" "}
            <Link
              href={listingPhotosPath(listing.id)}
              className="font-medium underline"
            >
              Fotos do anúncio
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ListingForm
            mode="edit"
            listingId={listing.id}
            defaultValues={listingToInput(listing)}
          />
        </CardContent>
      </Card>
    </main>
  );
}
