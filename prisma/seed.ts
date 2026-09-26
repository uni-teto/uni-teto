// Popula universidades e campi iniciais: `npm run db:seed`.
// Pode rodar várias vezes: atualiza o que já existe, sem duplicar.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { universities } from "../src/lib/seed/universities";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  for (const { campuses, ...university } of universities) {
    await prisma.university.upsert({
      where: { id: university.id },
      create: university,
      update: university,
    });

    for (const campus of campuses) {
      const data = { ...campus, universityId: university.id };
      await prisma.campus.upsert({
        where: { id: campus.id },
        create: data,
        update: data,
      });
    }

    console.log(`${university.acronym}: ${campuses.length} campus(i)`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
