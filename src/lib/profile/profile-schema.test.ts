import { describe, expect, it } from "vitest";
import { z } from "zod";
import { profileSchema } from "./profile-schema";

describe("profileSchema", () => {
  it("normaliza o WhatsApp", () => {
    expect(
      profileSchema.parse({ name: " Maria ", whatsapp: "(86) 99999-8888" }),
    ).toEqual({ name: "Maria", whatsapp: "5586999998888" });
  });

  it("aceita WhatsApp vazio e guarda null", () => {
    expect(profileSchema.parse({ name: "Maria", whatsapp: "  " })).toEqual({
      name: "Maria",
      whatsapp: null,
    });
  });

  it("recusa WhatsApp inválido", () => {
    const result = profileSchema.safeParse({
      name: "Maria",
      whatsapp: "3222-1111",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.flattenError(result.error).fieldErrors.whatsapp).toEqual([
        "Informe um celular com DDD, ex: (86) 99999-8888.",
      ]);
    }
  });

  it("usa a mesma regra de nome do cadastro", () => {
    expect(profileSchema.safeParse({ name: "", whatsapp: "" }).success).toBe(
      false,
    );
  });
});
