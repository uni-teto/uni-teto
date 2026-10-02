import "dotenv/config";
import { prisma } from "@/lib/prisma";
import {
  demoListingPhotos,
  demoListings,
  demoOwners,
} from "@/lib/seed/demo-listings";

// Anúncios de demonstração para ver a busca funcionando:
// `npm run db:seed-demo`. Pode rodar várias vezes: atualiza o que já existe,
// sem duplicar. `npm run db:seed-demo -- --remove` apaga tudo de novo (os
// anúncios e as fotos saem em cascata com os donos). As fotos em si ficam no
// Cloudinary (`uniteto/demo/`): outras máquinas usam os mesmos endereços.
//
// Precisa do `npm run db:seed` antes (os donos estudantes são vinculados às
// universidades). Os dados e a origem deles estão em
// src/lib/seed/demo-listings.ts.

const ownerIds = demoOwners.map((owner) => owner.id);

async function remove() {
  const { count } = await prisma.user.deleteMany({
    where: { id: { in: ownerIds } },
  });
  console.log(`Demonstração: ${count} contas (e seus anúncios) apagadas.`);
}

async function seed() {
  for (const owner of demoOwners) {
    const data = { ...owner, emailVerified: true };
    await prisma.user.upsert({
      where: { id: owner.id },
      create: data,
      update: data,
    });
  }

  for (const listing of demoListings) {
    await prisma.listing.upsert({
      where: { id: listing.id },
      create: listing,
      update: listing,
    });
  }

  // Fotos: troca todas as dos anúncios de demonstração pelas da lista
  await prisma.listingPhoto.deleteMany({
    where: { listingId: { in: demoListings.map((listing) => listing.id) } },
  });
  await prisma.listingPhoto.createMany({ data: demoListingPhotos });

  console.log(
    `Demonstração: ${demoListings.length} anúncios de ${demoOwners.length} contas, com ${demoListingPhotos.length} fotos.`,
  );
}

(process.argv.includes("--remove") ? remove() : seed())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
