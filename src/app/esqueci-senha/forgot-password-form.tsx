"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/auth/password-reset-schema";
import { RESET_PASSWORD_PATH } from "@/lib/auth/routes";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(input: ForgotPasswordInput) {
    const { email } = forgotPasswordSchema.parse(input);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: RESET_PASSWORD_PATH,
    });

    if (error) {
      setError("root", {
        message: "Não foi possível enviar o link. Tente novamente.",
      });
      return;
    }
    setSentTo(email);
  }

  // A resposta é a mesma exista ou não a conta: não revela quais e-mails
  // estão cadastrados
  if (sentTo) {
    return (
      <div role="status" className="space-y-2 text-sm">
        <p>
          Se existir uma conta com <strong>{sentTo}</strong>, enviamos um link
          para redefinir a senha.
        </p>
        <p className="text-muted-foreground">
          O link vale por 1 hora. Se não encontrar o e-mail, confira a caixa de
          spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormField id="email" label="E-mail institucional" error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <FieldError errors={[errors.root]} />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar link"}
        </Button>
      </FieldGroup>
    </form>
  );
}
