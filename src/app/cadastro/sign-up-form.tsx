"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { HomeIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/form-field";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/client";
import type { UserRole } from "@/lib/auth/roles";
import { EMAIL_VERIFIED_PATH } from "@/lib/auth/routes";
import { signUpSchema, type SignUpInput } from "@/lib/auth/sign-up-schema";
import { ResendVerification } from "./resend-verification";

const ROLE_OPTIONS: ReadonlyArray<{
  value: UserRole;
  icon: typeof SearchIcon;
  title: string;
  text: string;
}> = [
  {
    value: "ESTUDANTE",
    icon: SearchIcon,
    title: "Procurar moradia",
    text: "Sou estudante e uso o e-mail da universidade.",
  },
  {
    value: "ANUNCIANTE",
    icon: HomeIcon,
    title: "Anunciar imóvel",
    text: "Tenho quarto, vaga ou quitinete para alugar.",
  },
];

const EMAIL_FIELD: Record<UserRole, { label: string; description: string }> = {
  ESTUDANTE: {
    label: "E-mail institucional",
    description: "Use o e-mail da sua universidade, ex: nome@ufpi.edu.br",
  },
  ANUNCIANTE: {
    label: "E-mail",
    description: "Estudantes interessados poderão falar com você por ele.",
  },
};

export function SignUpForm({ defaultRole }: { defaultRole?: UserRole }) {
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { role: defaultRole },
  });
  const role = watch("role");
  const emailField = EMAIL_FIELD[role ?? "ESTUDANTE"];

  async function onSubmit(input: SignUpInput) {
    const data = signUpSchema.parse(input);
    const { error } = await authClient.signUp.email({
      role: data.role,
      name: data.name,
      email: data.email,
      password: data.password,
      callbackURL: EMAIL_VERIFIED_PATH,
    });

    if (!error) {
      setCreatedEmail(data.email);
      return;
    }

    // Regras de papel e domínio: o erro vem do servidor (src/lib/auth/server.ts)
    if (error.code === "EMAIL_DOMAIN_NOT_ALLOWED") {
      setError("email", { message: error.message });
    } else if (error.code === "INVALID_ROLE") {
      setError("role", { message: error.message });
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
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Você quer:</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLE_OPTIONS.map(({ value, icon: Icon, title, text }) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50",
                  "has-checked:border-primary has-checked:bg-primary/5",
                  "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                )}
              >
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...register("role")}
                />
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="text-muted-foreground">{text}</span>
                </span>
              </label>
            ))}
          </div>
          <FieldError errors={[errors.role]} />
        </fieldset>

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
          label={emailField.label}
          description={emailField.description}
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
