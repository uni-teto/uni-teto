import { z } from "zod";
import { emailSchema } from "./sign-up-schema";

export const signInSchema = z.object({
  email: emailSchema,
  // Sem regra de tamanho: quem valida a senha é o servidor
  password: z.string().min(1, "Informe sua senha."),
});

export type SignInInput = z.input<typeof signInSchema>;
