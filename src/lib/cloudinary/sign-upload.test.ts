import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { signAvatarUpload } from "./sign-upload";

afterEach(() => {
  vi.unstubAllEnvs();
});

function stubCloudinaryEnv() {
  vi.stubEnv("CLOUDINARY_CLOUD_NAME", "uniteto");
  vi.stubEnv("CLOUDINARY_API_KEY", "123456");
  vi.stubEnv("CLOUDINARY_API_SECRET", "segredo-de-teste");
}

describe("signAvatarUpload", () => {
  it("retorna null sem as credenciais do Cloudinary", () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "");
    expect(signAvatarUpload("user123")).toBeNull();
  });

  it("fixa a pasta do usuário e os formatos aceitos", () => {
    stubCloudinaryEnv();
    const upload = signAvatarUpload("user123");

    expect(upload?.uploadUrl).toBe(
      "https://api.cloudinary.com/v1_1/uniteto/image/upload",
    );
    expect(upload?.fields).toMatchObject({
      public_id: "uniteto/avatars/user123",
      overwrite: true,
      allowed_formats: "jpg,png,webp",
      api_key: "123456",
    });
  });

  it("assina como o Cloudinary espera (SHA-1 dos parâmetros ordenados + segredo)", () => {
    stubCloudinaryEnv();
    const { fields } = signAvatarUpload("user123")!;

    const toSign = [
      `allowed_formats=${fields.allowed_formats}`,
      `invalidate=${fields.invalidate}`,
      `overwrite=${fields.overwrite}`,
      `public_id=${fields.public_id}`,
      `timestamp=${fields.timestamp}`,
    ].join("&");
    const expected = createHash("sha1")
      .update(toSign + "segredo-de-teste")
      .digest("hex");

    expect(fields.signature).toBe(expected);
  });

  it("não envia o segredo para o navegador", () => {
    stubCloudinaryEnv();
    expect(JSON.stringify(signAvatarUpload("user123"))).not.toContain(
      "segredo-de-teste",
    );
  });
});
