import { z } from "zod";
import { nameSchema } from "@/lib/auth/sign-up-schema";
import { normalizeWhatsapp } from "./whatsapp";

export const profileSchema = z.object({
  name: nameSchema,
  // Opcional: vazio vira `null`; preenchido é normalizado para "55DDD9XXXXXXXX"
  whatsapp: z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return null;

      const normalized = normalizeWhatsapp(value);
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message: "Informe um celular com DDD, ex: (86) 99999-8888.",
        });
        return z.NEVER;
      }
      return normalized;
    }),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileData = z.output<typeof profileSchema>;
