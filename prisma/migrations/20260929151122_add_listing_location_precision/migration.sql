-- Precisão do ponto do anúncio no mapa (#27, melhorias da Fase 4).

-- CreateEnum
CREATE TYPE "LocationPrecision" AS ENUM ('numero', 'rua', 'bairro');

-- AlterTable
-- Anúncios já existentes não guardaram a precisão: ficam como "rua"
-- (aproximado, sem afirmar que é o centro do bairro). Editar o endereço
-- localiza de novo e grava a precisão certa. Depois o padrão é removido:
-- todo anúncio novo informa a precisão ao ser salvo.
ALTER TABLE "Listing" ADD COLUMN "locationPrecision" "LocationPrecision" NOT NULL DEFAULT 'rua';
ALTER TABLE "Listing" ALTER COLUMN "locationPrecision" DROP DEFAULT;
