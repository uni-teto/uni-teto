import { z } from "zod";
import { nameSchema } from "@/lib/auth/sign-up-schema";
import {
  sexSchema,
  socialNameSchema,
  surnameSchema,
  whatsappSchema,
} from "./personal-data";

// Mesmas regras do cadastro
export const profileSchema = z.object({
  name: nameSchema,
  surname: surnameSchema,
  socialName: socialNameSchema,
  sex: sexSchema,
  whatsapp: whatsappSchema,
});

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileData = z.output<typeof profileSchema>;
