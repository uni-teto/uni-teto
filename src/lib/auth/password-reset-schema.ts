import { z } from "zod";
import {
  emailSchema,
  newPasswordSchema,
  passwordsMatch,
  passwordsMismatch,
} from "./sign-up-schema";

/** Passo 1: pedir o link de redefinição por e-mail. */
export const forgotPasswordSchema = z.object({ email: emailSchema });

export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;

/** Passo 2: escolher a nova senha (com o token do link). */
export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, passwordsMismatch);

export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
