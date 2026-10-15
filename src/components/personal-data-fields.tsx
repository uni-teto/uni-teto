"use client";

import type {
  FieldError as FormError,
  UseFormRegisterReturn,
} from "react-hook-form";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { SEX_LABELS, SEXES } from "@/lib/profile/personal-data";
import { maskWhatsappInput } from "@/lib/profile/whatsapp";

type Field = "name" | "surname" | "socialName" | "sex" | "whatsapp";

/**
 * Nome, sobrenome, nome social, sexo e WhatsApp: os mesmos campos no cadastro
 * e no perfil. Cada formulário passa o `register(...)` e o erro de cada campo.
 */
export function PersonalDataFields({
  fields,
  errors,
}: {
  fields: Record<Field, UseFormRegisterReturn>;
  errors: Partial<Record<Field, FormError>>;
}) {
  const whatsapp = fields.whatsapp;

  return (
    <>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <FormField id="name" label="Nome" error={errors.name}>
          <Input
            id="name"
            autoComplete="given-name"
            aria-invalid={!!errors.name}
            {...fields.name}
          />
        </FormField>

        <FormField id="surname" label="Sobrenome" error={errors.surname}>
          <Input
            id="surname"
            autoComplete="family-name"
            aria-invalid={!!errors.surname}
            {...fields.surname}
          />
        </FormField>
      </div>

      <FormField
        id="socialName"
        label="Nome social (opcional)"
        description="Se preencher, é ele que aparece no site no lugar do seu nome."
        error={errors.socialName}
      >
        <Input
          id="socialName"
          aria-invalid={!!errors.socialName}
          {...fields.socialName}
        />
      </FormField>

      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <FormField id="sex" label="Sexo" error={errors.sex}>
          <NativeSelect
            id="sex"
            className="w-full"
            aria-invalid={!!errors.sex}
            {...fields.sex}
          >
            {/* Sem `disabled`: assim o navegador já mostra "Escolha" antes de o
                React carregar (com `disabled` ele pula para a 1ª opção) */}
            <NativeSelectOption value="" hidden>
              Escolha
            </NativeSelectOption>
            {SEXES.map((sex) => (
              <NativeSelectOption key={sex} value={sex}>
                {SEX_LABELS[sex]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>

        <FormField id="whatsapp" label="WhatsApp" error={errors.whatsapp}>
          <Input
            id="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(86) 99999-8888"
            aria-invalid={!!errors.whatsapp}
            {...whatsapp}
            // Aplica a máscara "(86) 99999-8888" enquanto a pessoa digita
            onChange={(event) => {
              event.target.value = maskWhatsappInput(event.target.value);
              return whatsapp.onChange(event);
            }}
          />
        </FormField>
      </div>
    </>
  );
}
