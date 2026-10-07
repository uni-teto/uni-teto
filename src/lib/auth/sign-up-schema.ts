import { z } from "zod";
import {
  sexSchema,
  socialNameSchema,
  surnameSchema,
  whatsappSchema,
} from "@/lib/profile/personal-data";
import { USER_ROLES } from "./roles";

// Mesmos limites de senha configurados no Better Auth (src/lib/auth/server.ts)
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Cadastro com e-mail que já tem conta (src/lib/auth/server.ts). */
export const EMAIL_ALREADY_REGISTERED_MESSAGE =
  "Já existe uma conta com este e-mail. Entre ou recupere sua senha.";

// Também usado na edição do perfil
export const nameSchema = z
  .string()
  .trim()
  .min(2, "Informe seu nome.")
  .max(100, "O nome pode ter no máximo 100 caracteres.");

// Também usados no login e na recuperação de senha
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Informe um e-mail válido."));

export const newPasswordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  )
  .max(
    PASSWORD_MAX_LENGTH,
    `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
  );

export function passwordsMatch(data: {
  password: string;
  confirmPassword: string;
}) {
  return data.password === data.confirmPassword;
}

export const passwordsMismatch = {
  message: "As senhas não conferem.",
  path: ["confirmPassword"],
};

export const signUpSchema = z
  .object({
    role: z.enum(USER_ROLES, {
      error: "Escolha se você quer procurar moradia ou anunciar um imóvel.",
    }),
    name: nameSchema,
    surname: surnameSchema,
    socialName: socialNameSchema,
    sex: sexSchema,
    whatsapp: whatsappSchema,
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, passwordsMismatch);

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignUpData = z.output<typeof signUpSchema>;
