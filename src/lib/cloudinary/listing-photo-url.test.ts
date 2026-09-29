import { describe, expect, it } from "vitest";
import { publicIdFromUrl } from "./image-url";
import {
  isListingPhotoUrl,
  listingPhotoPublicId,
  listingPhotoThumbnailUrl,
} from "./listing-photo-url";
import { imageFileError } from "./upload-client";

const cloud = "uniteto";
const url =
  "https://res.cloudinary.com/uniteto/image/upload/v1790000000/uniteto/listings/anuncio1/f3a9c2e1-77aa-4b0e-9c1d-000000000000.jpg";

describe("isListingPhotoUrl", () => {
  it("aceita foto da pasta do anúncio", () => {
    expect(isListingPhotoUrl(url, cloud, "anuncio1")).toBe(true);
  });

  it.each([
    ["de outro anúncio", url.replace("/anuncio1/", "/anuncio2/")],
    ["de subpasta do anúncio", url.replace("/anuncio1/", "/anuncio1/x/")],
    ["do avatar", url.replace("listings/anuncio1", "avatars")],
    ["de outra conta", url.replace("com/uniteto/", "com/outra/")],
    ["de outro site", "https://exemplo.com/uniteto/listings/anuncio1/a.jpg"],
    ["com formato não permitido", url.replace(".jpg", ".gif")],
    ["com algo depois da extensão", `${url}?x=1`],
  ])("recusa foto %s", (_, other) => {
    expect(isListingPhotoUrl(other, cloud, "anuncio1")).toBe(false);
  });

  it("não deixa o id do anúncio funcionar como expressão regular", () => {
    expect(isListingPhotoUrl(url, cloud, "anuncio.")).toBe(false);
  });
});

describe("publicIdFromUrl", () => {
  it("tira a versão e a extensão", () => {
    expect(publicIdFromUrl(url)).toBe(
      "uniteto/listings/anuncio1/f3a9c2e1-77aa-4b0e-9c1d-000000000000",
    );
  });

  it("ignora transformações antes da versão", () => {
    expect(publicIdFromUrl(listingPhotoThumbnailUrl(url, 400, 300))).toBe(
      "uniteto/listings/anuncio1/f3a9c2e1-77aa-4b0e-9c1d-000000000000",
    );
  });

  it("devolve null para URL que não é do Cloudinary", () => {
    expect(publicIdFromUrl("https://exemplo.com/foto.jpg")).toBeNull();
  });

  it("volta ao mesmo public_id usado na assinatura", () => {
    const publicId = listingPhotoPublicId("anuncio1", "abc");
    expect(
      publicIdFromUrl(
        `https://res.cloudinary.com/uniteto/image/upload/v1/${publicId}.png`,
      ),
    ).toBe(publicId);
  });
});

describe("listingPhotoThumbnailUrl", () => {
  it("corta no tamanho pedido", () => {
    expect(listingPhotoThumbnailUrl(url, 400, 300)).toContain(
      "/image/upload/c_fill,w_400,h_300,f_auto,q_auto/v1790000000/",
    );
  });
});

describe("imageFileError", () => {
  it("aceita JPG, PNG e WEBP até 5 MB", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(imageFileError({ type, size: 5 * 1024 * 1024 })).toBeNull();
    }
  });

  it("recusa outros formatos e arquivos grandes", () => {
    expect(imageFileError({ type: "image/gif", size: 10 })).toBe(
      "Use uma imagem JPG, PNG ou WEBP.",
    );
    expect(
      imageFileError({ type: "image/png", size: 5 * 1024 * 1024 + 1 }),
    ).toBe("A imagem pode ter no máximo 5 MB.");
  });
});
