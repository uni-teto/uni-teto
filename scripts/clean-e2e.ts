import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { E2E_EMAIL } from "../e2e/support/e2e-email";

// Apaga as contas criadas pelos testes E2E. Os anúncios, fotos, sessões e
// logins saem junto (cascata). Sem isso, os anúncios de teste apareceriam na
// busca como se fossem de verdade.
//
// Roda sozinho no fim dos E2E (e2e/global-teardown.ts) ou com
// `npm run db:clean-e2e`. Só apaga e-mails no formato de `uniqueEmail`
// (E2E_EMAIL). As fotos dos testes nunca chegam ao Cloudinary (o envio é
// interceptado no navegador).
async function main() {
  // Filtro largo no banco; o padrão exato é conferido aqui
  const candidates = await prisma.user.findMany({
    where: { email: { startsWith: "e2e-" } },
    select: { id: true, email: true },
  });
  const ids = candidates
    .filter((user) => E2E_EMAIL.test(user.email))
    .map((user) => user.id);

  const { count } =
    ids.length > 0
      ? await prisma.user.deleteMany({ where: { id: { in: ids } } })
      : { count: 0 };
  console.log(`Limpeza dos E2E: ${count} contas de teste apagadas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
