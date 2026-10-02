import "dotenv/config";
import { writeFileSync } from "node:fs";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { getCloudinaryConfig } from "@/lib/cloudinary/sign-upload";

// Envia as fotos dos anúncios de demonstração para o Cloudinary e grava os
// endereços em src/lib/seed/demo-photos.ts: `npm run cloudinary:demo-photos`.
//
// Só precisa rodar uma vez (ou quando as fotos mudarem). Os endereços ficam no
// código, então qualquer máquina que rode `npm run db:seed-demo` mostra as
// fotos, sem precisar dos arquivos nem das credenciais do Cloudinary.
//
// As fotos ficam em `uniteto/demo/`, fora das pastas que o
// `npm run cloudinary:cleanup` limpa (elas não pertencem a nenhum anúncio de
// verdade). Os arquivos originais ficam fora do git: imgsanuncios/ (geradas
// por IA para os anúncios) e imgslayout/ (as do layout).

const PHOTOS: Record<string, string> = {
  // Quartos e repúblicas (as mesmas imagens do layout)
  "quarto-estudante":
    "imgslayout/Quarto estudantil aconchegante e organizado.png",
  republica: "imgslayout/Quarto compartilhado com beliches e estudos.png",
  "republica-noite":
    "imgslayout/Quarto de dormitório moderno ao entardecer.png",
  // Apartamentos e quitinetes
  "ap-terroso": "imgsanuncios/Apartamento Aconchegante em Tons Terrosos.png",
  "ap-oliva": "imgsanuncios/Apartamento Compacto em Tons de Oliva.png",
  "ap-verde-oliva": "imgsanuncios/Apartamento Compacto em Verde Oliva.png",
  "ap-plantas-luz":
    "imgsanuncios/Apartamento Moderno com Plantas e Luz Aconchegante.png",
  "ap-varanda": "imgsanuncios/Apartamento Moderno com Varanda e Plantas.png",
  "ap-vista": "imgsanuncios/Apartamento Moderno com Vista Urbana.png",
  "ap-cozinha-sala":
    "imgsanuncios/Apartamento compacto com cozinha e sala aconchegantes.png",
  "ap-cozinha-integrada":
    "imgsanuncios/Apartamento compacto com cozinha integrada.png",
  "ap-escandinavo":
    "imgsanuncios/Apartamento compacto com decoração escandinava.png",
  "ap-luz-natural":
    "imgsanuncios/Apartamento compacto com plantas e luz natural.png",
  "ap-verde-madeira":
    "imgsanuncios/Apartamento compacto em verde e madeira.png",
  "ap-por-do-sol":
    "imgsanuncios/Apartamento moderno com vista urbana ao pôr do sol.png",
  "ap-cozinha-jantar": "imgsanuncios/Cozinha compacta com sala e jantar.png",
  estudio: "imgsanuncios/Estúdio compacto com cozinha e plantas.png",
  loft: "imgsanuncios/Loft Moderno em Verde e Madeira.png",
};

async function main() {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error("Configure CLOUDINARY_* no .env para enviar as fotos.");
  }
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
  });

  const urls: Record<string, string> = {};
  for (const [slug, file] of Object.entries(PHOTOS)) {
    // Reduz antes de enviar: o site nunca mostra a foto maior que 1600 px
    const jpeg = await sharp(file)
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${jpeg.toString("base64")}`,
      { public_id: `uniteto/demo/${slug}`, overwrite: true, invalidate: true },
    );
    urls[slug] = result.secure_url;
    console.log(`${slug}: ${Math.round(jpeg.length / 1024)} KB`);
  }

  writeFileSync(
    "src/lib/seed/demo-photos.ts",
    `// Gerado por \`npm run cloudinary:demo-photos\` (scripts/upload-demo-photos.ts).
// Fotos dos anúncios de demonstração no Cloudinary, por nome. Não editar à mão.

export const DEMO_PHOTO_URLS = ${JSON.stringify(urls, null, 2)} as const;

export type DemoPhoto = keyof typeof DEMO_PHOTO_URLS;
`,
  );
  console.log(`${Object.keys(urls).length} fotos enviadas.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
