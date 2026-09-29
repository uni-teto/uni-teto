import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listingPhotosPath, signInUrl } from "@/lib/auth/routes";
import { getSession } from "@/lib/auth/session";
import { MAX_LISTING_PHOTOS } from "@/lib/cloudinary/listing-photo-url";
import { getCloudinaryConfig } from "@/lib/cloudinary/sign-upload";
import { prisma } from "@/lib/prisma";
import { PhotoManager } from "./photo-manager";

export const metadata: Metadata = {
  title: "Fotos do anúncio | UniTeto",
};

export default async function ListingPhotosPage({
  params,
}: PageProps<"/anuncios/[id]/fotos">) {
  const { id } = await params;
  const session = await getSession();
  // O proxy (src/proxy.ts) já redireciona sem cookie; aqui a sessão é validada
  if (!session) redirect(signInUrl(listingPhotosPath(id)));

  // Só o dono vê esta página; para os outros é como se não existisse
  const listing = await prisma.listing.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      title: true,
      photos: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true, url: true },
      },
    },
  });
  if (!listing) notFound();

  return (
    <main className="flex flex-1 justify-center px-4 py-12">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>
            <h1>Fotos do anúncio</h1>
          </CardTitle>
          <CardDescription>
            {listing.title}. Até {MAX_LISTING_PHOTOS} fotos; a primeira é a capa
            que aparece na busca.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PhotoManager
            listingId={listing.id}
            photos={listing.photos}
            enabled={getCloudinaryConfig() !== null}
          />
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Concluir
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
