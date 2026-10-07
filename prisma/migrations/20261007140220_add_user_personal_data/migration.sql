-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('FEMININO', 'MASCULINO', 'NAO_INFORMADO');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sex" "Sex",
ADD COLUMN     "socialName" TEXT,
ADD COLUMN     "surname" TEXT;
