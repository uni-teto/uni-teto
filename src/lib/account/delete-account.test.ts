import { describe, expect, it, vi } from "vitest";
import {
  deleteAccount,
  TOO_MANY_ATTEMPTS,
  WRONG_PASSWORD,
} from "./delete-account";

const PHOTO =
  "https://res.cloudinary.com/demo/image/upload/v1/uniteto/listings/l1/abc.jpg";
const AVATAR =
  "https://res.cloudinary.com/demo/image/upload/v1/uniteto/avatars/u1.png";

function setup({ passwordOk = true, allowed = true } = {}) {
  return {
    findImageUrls: vi.fn(async () => [PHOTO, AVATAR]),
    deleteUser: vi.fn(async () => passwordOk),
    deleteImage: vi.fn(async () => {}),
    attempts: { hit: vi.fn(() => ({ ok: allowed })) },
  };
}

describe("deleteAccount", () => {
  it("confere a senha, apaga a conta e as imagens no Cloudinary", async () => {
    const deps = setup();
    await expect(
      deleteAccount("u1", { password: "segredo" }, deps),
    ).resolves.toEqual({ ok: true });

    expect(deps.deleteUser).toHaveBeenCalledWith("segredo");
    expect(deps.deleteImage).toHaveBeenCalledWith("uniteto/listings/l1/abc");
    expect(deps.deleteImage).toHaveBeenCalledWith("uniteto/avatars/u1");
  });

  it("senha errada: não apaga nada", async () => {
    const deps = setup({ passwordOk: false });
    await expect(
      deleteAccount("u1", { password: "errada" }, deps),
    ).resolves.toEqual({
      ok: false,
      fieldErrors: { password: [WRONG_PASSWORD] },
    });
    expect(deps.deleteImage).not.toHaveBeenCalled();
  });

  it("exige a senha e nem tenta sem ela", async () => {
    const deps = setup();
    const result = await deleteAccount("u1", { password: "" }, deps);
    expect(result.ok).toBe(false);
    expect(deps.deleteUser).not.toHaveBeenCalled();
    await expect(deleteAccount("u1", {}, deps)).resolves.toMatchObject({
      ok: false,
    });
  });

  it("barra depois de muitas tentativas", async () => {
    const deps = setup({ allowed: false });
    await expect(
      deleteAccount("u1", { password: "segredo" }, deps),
    ).resolves.toEqual({ ok: false, message: TOO_MANY_ATTEMPTS });
    expect(deps.deleteUser).not.toHaveBeenCalled();
  });

  it("só apaga imagens das pastas do UniTeto, e falha no Cloudinary não desfaz", async () => {
    const deps = setup();
    deps.findImageUrls.mockResolvedValue([
      PHOTO,
      "https://outro.site/foto.jpg",
      "https://res.cloudinary.com/demo/image/upload/v1/outra-pasta/x.jpg",
    ]);
    deps.deleteImage.mockRejectedValue(new Error("Cloudinary fora do ar"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      deleteAccount("u1", { password: "segredo" }, deps),
    ).resolves.toEqual({ ok: true });
    expect(deps.deleteImage).toHaveBeenCalledTimes(1);
  });
});
