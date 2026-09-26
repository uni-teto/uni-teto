"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/form-field";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { EMAIL_VERIFIED_PATH } from "@/lib/auth/routes";
import { signUpSchema, type SignUpInput } from "@/lib/auth/sign-up-schema";
import { ResendVerification } from "./resend-verification";

export function SignUpForm() {
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  async function onSubmit(input: SignUpInput) {
    const { name, email, password } = signUpSchema.parse(input);
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: EMAIL_VERIFIED_PATH,
    });

    if (!error) {
      setCreatedEmail(email);
      return;
    }

    // Domínio fora da lista: o erro vem do servidor (src/lib/auth/server.ts)
    if (error.code === "EMAIL_DOMAIN_NOT_ALLOWED") {
      setError("email", { message: error.message });
    } else {
      setError("root", {
        message: "Não foi possível criar a conta. Tente novamente.",
      });
    }
  }

  if (createdEmail) {
    return (
      <div role="status" className="space-y-3 text-sm">
        <p>
          Enviamos um link de confirmação para <strong>{createdEmail}</strong>.
        </p>
        <p className="text-muted-foreground">
          Abra o e-mail e clique no link para ativar sua conta. Se não
          encontrar, confira a caixa de spam. Se esse e-mail já tiver conta,
          enviamos instruções para entrar.
        </p>
        <ResendVerification email={createdEmail} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormField id="name" label="Nome" error={errors.name}>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </FormField>

        <FormField
          id="email"
          label="E-mail institucional"
          description="Use o e-mail da sua universidade, ex: nome@ufpi.edu.br"
          error={errors.email}
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <FormField id="password" label="Senha" error={errors.password}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>

        <FormField
          id="confirmPassword"
          label="Confirme a senha"
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </Button>
      </FieldGroup>
    </form>
  );
}
