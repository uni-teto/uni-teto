import { describe, expect, it } from "vitest";
import {
  avatarPublicId,
  avatarThumbnailUrl,
  isOwnAvatarUrl,
} from "./avatar-url";

const cloud = "uniteto";
const url =
  "https://res.cloudinary.com/uniteto/image/upload/v1790000000/uniteto/avatars/user123.jpg";

describe("avatarPublicId", () => {
  it("usa uma pasta por usuário", () => {
    expect(avatarPublicId("user123")).toBe("uniteto/avatars/user123");
  });
});

describe("isOwnAvatarUrl", () => {
  it("aceita a foto do próprio usuário", () => {
    expect(isOwnAvatarUrl(url, cloud, "user123")).toBe(true);
  });

  it.each([
    ["de outro usuário", url.replace("user123", "outro")],
    [
      "de outra conta do Cloudinary",
      url.replace("/uniteto/image", "/outra/image"),
    ],
    ["de outro site", "https://exemplo.com/uniteto/avatars/user123.jpg"],
    ["sem https", url.replace("https://", "http://")],
    ["com formato não permitido", url.replace(".jpg", ".svg")],
    ["com algo depois da extensão", `${url}?x=1`],
  ])("recusa URL %s", (_, other) => {
    expect(isOwnAvatarUrl(other, cloud, "user123")).toBe(false);
  });

  it("não deixa o id do usuário funcionar como expressão regular", () => {
    expect(isOwnAvatarUrl(url, cloud, "user...")).toBe(false);
  });
});

describe("avatarThumbnailUrl", () => {
  it("adiciona o corte e o tamanho na URL", () => {
    expect(avatarThumbnailUrl(url, 96)).toBe(
      "https://res.cloudinary.com/uniteto/image/upload/c_fill,g_face,w_96,h_96,f_auto,q_auto/v1790000000/uniteto/avatars/user123.jpg",
    );
  });
});
