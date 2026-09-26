"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/form-field";
import { PasswordInput } from "@/components/password-input";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { authClient } from "@/lib/auth/client";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/auth/password-reset-schema";
import { FORGOT_PASSWORD_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";

export function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(input: ResetPasswordInput) {
    const { password } = resetPasswordSchema.parse(input);
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    if (error) {
      setError("root", {
        message:
          error.code === "INVALID_TOKEN"
            ? "Este link expirou ou já foi usado."
            : "Não foi possível alterar a senha. Tente novamente.",
      });
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div role="status" className="space-y-3 text-sm">
        <p>Senha alterada. Por segurança, você saiu de todos os aparelhos.</p>
        <Link href={SIGN_IN_PATH} className={buttonVariants()}>
          Entrar com a nova senha
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormField id="password" label="Nova senha" error={errors.password}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>

        <FormField
          id="confirmPassword"
          label="Confirme a nova senha"
          error={errors.confirmPassword}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </FormField>

        <FieldError errors={[errors.root]} />
        {errors.root && (
          <Link
            href={FORGOT_PASSWORD_PATH}
            className="text-sm font-medium underline"
          >
            Pedir novo link
          </Link>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </FieldGroup>
    </form>
  );
}
