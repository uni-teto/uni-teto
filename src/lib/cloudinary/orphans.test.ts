import { describe, expect, it } from "vitest";
import { findOrphans, ORPHAN_MIN_AGE_MS } from "./orphans";

const now = new Date("2026-09-29T12:00:00Z");
const old = new Date(now.getTime() - ORPHAN_MIN_AGE_MS - 1);
const recent = new Date(now.getTime() - 60_000);

describe("findOrphans", () => {
  it("acha as fotos antigas que ninguém usa", () => {
    const images = [
      { publicId: "uniteto/listings/a/usada", createdAt: old },
      { publicId: "uniteto/listings/a/orfa", createdAt: old },
      { publicId: "uniteto/avatars/user-1", createdAt: old },
    ];
    const used = new Set(["uniteto/listings/a/usada"]);
    expect(findOrphans(images, used, now).map((i) => i.publicId)).toEqual([
      "uniteto/listings/a/orfa",
      "uniteto/avatars/user-1",
    ]);
  });

  it("não mexe em foto recém-enviada (o envio pode estar em andamento)", () => {
    const images = [{ publicId: "uniteto/listings/a/nova", createdAt: recent }];
    expect(findOrphans(images, new Set(), now)).toEqual([]);
  });

  it("não mexe fora das pastas do UniTeto", () => {
    const images = [
      { publicId: "outro-projeto/foto", createdAt: old },
      { publicId: "uniteto-antigo/foto", createdAt: old },
    ];
    expect(findOrphans(images, new Set(), now)).toEqual([]);
  });
});
