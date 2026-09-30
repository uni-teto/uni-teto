import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { demoListings, demoOwners } from "@/lib/seed/demo-listings";

// Anúncios de demonstração para ver a busca funcionando:
// `npm run db:seed-demo`. Pode rodar várias vezes: atualiza o que já existe,
// sem duplicar. `npm run db:seed-demo -- --remove` apaga tudo de novo (os
// anúncios saem em cascata com os donos).
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

  console.log(
    `Demonstração: ${demoListings.length} anúncios de ${demoOwners.length} contas.`,
  );
}

(process.argv.includes("--remove") ? remove() : seed())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
