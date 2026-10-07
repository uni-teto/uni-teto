"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { PersonalDataFields } from "@/components/personal-data-fields";
import {
  profileSchema,
  type ProfileData,
  type ProfileInput,
} from "@/lib/profile/profile-schema";
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
        <PersonalDataFields
          fields={{
            name: register("name"),
            surname: register("surname"),
            socialName: register("socialName"),
            sex: register("sex"),
            whatsapp: register("whatsapp"),
          }}
          errors={errors}
        />

        <FieldError errors={[errors.root]} />

        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </FieldGroup>
    </form>
  );
}
