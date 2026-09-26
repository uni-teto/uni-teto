"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  profileSchema,
  type ProfileData,
  type ProfileInput,
} from "@/lib/profile/profile-schema";
import { maskWhatsappInput } from "@/lib/profile/whatsapp";
import { updateProfile } from "./actions";

export function ProfileForm({
  defaultValues,
}: {
  defaultValues: ProfileInput;
}) {
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileInput, unknown, ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  // Aplica a máscara "(86) 99999-8888" enquanto a pessoa digita
  const whatsappField = register("whatsapp");

  async function onSubmit() {
    // Manda o que foi digitado: o servidor valida e normaliza de novo
    const values = getValues();
    const result = await updateProfile(values);
    if (result.ok) {
      reset(values);
      toast.success("Alterações salvas.");
      return;
    }

    for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as keyof ProfileInput, { message: messages[0] });
    }
    if (result.message) setError("root", { message: result.message });
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
          id="whatsapp"
          label="WhatsApp (opcional)"
          description="Aparece nos seus anúncios para os interessados falarem com você."
          error={errors.whatsapp}
        >
          <Input
            id="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(86) 99999-8888"
            aria-invalid={!!errors.whatsapp}
            {...whatsappField}
            onChange={(event) => {
              event.target.value = maskWhatsappInput(event.target.value);
              return whatsappField.onChange(event);
            }}
          />
        </FormField>

        <FieldError errors={[errors.root]} />

        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </FieldGroup>
    </form>
  );
}
