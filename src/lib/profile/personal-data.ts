import { z } from "zod";
import { normalizeWhatsapp } from "./whatsapp";

// Dados pessoais pedidos no cadastro e editáveis no perfil (além do nome).

export const SEXES = ["FEMININO", "MASCULINO", "NAO_INFORMADO"] as const;
export type Sex = (typeof SEXES)[number];

export const SEX_LABELS: Record<Sex, string> = {
  FEMININO: "Feminino",
  MASCULINO: "Masculino",
  NAO_INFORMADO: "Prefiro não informar",
};

export const surnameSchema = z
  .string()
  .trim()
  .min(2, "Informe seu sobrenome.")
  .max(100, "O sobrenome pode ter no máximo 100 caracteres.");

// Opcional: vazio vira `null`
export const socialNameSchema = z
  .string()
  .trim()
  .max(100, "O nome social pode ter no máximo 100 caracteres.")
  .refine((value) => value === "" || value.length >= 2, {
    message: "Informe o nome social completo ou deixe em branco.",
  })
  .optional()
  .transform((value) => value || null);

export const sexSchema = z.enum(SEXES, { error: "Escolha uma opção." });

// Obrigatório; normalizado para "55DDD9XXXXXXXX" (ver ./whatsapp.ts)
export const whatsappSchema = z
  .string({ error: "Informe seu WhatsApp com DDD." })
  .trim()
  .transform((value, ctx) => {
    const normalized = normalizeWhatsapp(value);
    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message:
          value === ""
            ? "Informe seu WhatsApp com DDD."
            : "Informe um celular com DDD, ex: (86) 99999-8888.",
      });
      return z.NEVER;
    }
    return normalized;
  });

export const PERSONAL_DATA_FIELDS = [
  "surname",
  "socialName",
  "sex",
  "whatsapp",
] as const;

/** Campos novos do cadastro, validados de novo no servidor (src/lib/auth/server.ts). */
export const personalDataSchema = z.object({
  surname: surnameSchema,
  socialName: socialNameSchema,
  sex: sexSchema,
  whatsapp: whatsappSchema,
});
