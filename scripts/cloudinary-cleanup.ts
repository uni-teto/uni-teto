import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import { publicIdFromUrl } from "@/lib/cloudinary/image-url";
import {
  findOrphans,
  MANAGED_PREFIXES,
  type StoredImage,
} from "@/lib/cloudinary/orphans";
import { deleteImage, getCloudinaryConfig } from "@/lib/cloudinary/sign-upload";
import { prisma } from "@/lib/prisma";

// Lista (e, com --apply, apaga) as fotos do Cloudinary que nenhum anúncio ou
// perfil do banco usa. `npm run cloudinary:cleanup` só lista;
// `npm run cloudinary:cleanup -- --apply` apaga.
//
// ATENÇÃO: compare com o banco dono dessa conta do Cloudinary. Se duas pessoas
// usam as mesmas chaves com bancos locais diferentes, as fotos de uma parecem
// órfãs para a outra. Em produção, rode com o banco de produção.

async function listImages(prefix: string): Promise<StoredImage[]> {
  const images: StoredImage[] = [];
  let cursor: string | undefined;
  do {
    const page = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix,
      max_results: 500,
      next_cursor: cursor,
    });
    for (const resource of page.resources) {
      images.push({
        publicId: resource.public_id,
        createdAt: new Date(resource.created_at),
      });
    }
    cursor = page.next_cursor;
  } while (cursor);
  return images;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const config = getCloudinaryConfig();
  if (!config) {
    console.log("Sem as variáveis CLOUDINARY_* no .env: nada a fazer.");
    return;
  }
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
  });

  const [photos, users] = await Promise.all([
    prisma.listingPhoto.findMany({ select: { url: true } }),
    prisma.user.findMany({
      where: { image: { not: null } },
      select: { image: true },
    }),
  ]);
  const used = new Set(
    [...photos.map((p) => p.url), ...users.map((u) => u.image!)]
      .map(publicIdFromUrl)
      .filter((id): id is string => id !== null),
  );

  const images = (await Promise.all(MANAGED_PREFIXES.map(listImages))).flat();
  const orphans = findOrphans(images, used, new Date());

  console.log(
    `Cloudinary "${config.cloudName}": ${images.length} fotos do UniTeto, ${used.size} em uso no banco, ${orphans.length} órfãs.`,
  );
  for (const orphan of orphans) {
    console.log(
      `  ${orphan.publicId} (enviada em ${orphan.createdAt.toISOString()})`,
    );
  }
  if (orphans.length === 0) return;

  if (!apply) {
    console.log(
      "\nNada foi apagado. Confira se este é o banco dono dessa conta do Cloudinary e rode com --apply para apagar.",
    );
    return;
  }
  for (const orphan of orphans) await deleteImage(orphan.publicId);
  console.log(`${orphans.length} fotos órfãs apagadas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
