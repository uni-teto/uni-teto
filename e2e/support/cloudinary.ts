import type { Page } from "@playwright/test";

// Cloudinary falso para os testes E2E: o navegador envia as fotos direto ao
// Cloudinary, então interceptamos essas chamadas no próprio navegador.
// O servidor de teste usa credenciais falsas (playwright.config.ts), que só
// servem para gerar a assinatura; a URL devolvida aqui usa a mesma conta e o
// mesmo `public_id` da assinatura, como o Cloudinary real faria.

// PNG de 1x1 pixel
export const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

export async function mockCloudinary(page: Page) {
  let version = 1790000000;

  // Envio: responde com o `secure_url` montado a partir da assinatura
  await page.route(
    "https://api.cloudinary.com/v1_1/*/image/upload",
    async (route) => {
      const request = route.request();
      const cloudName = new URL(request.url()).pathname.split("/")[2];
      const publicId = /name="public_id"\r\n\r\n([^\r\n]+)/.exec(
        request.postData() ?? "",
      )?.[1];
      version++;
      await route.fulfill({
        json: {
          secure_url: `https://res.cloudinary.com/${cloudName}/image/upload/v${version}/${publicId}.png`,
        },
      });
    },
  );

  // Exibição: qualquer imagem do Cloudinary vira o PNG de 1 pixel
  await page.route("https://res.cloudinary.com/**", (route) =>
    route.fulfill({ contentType: "image/png", body: TINY_PNG }),
  );
}
