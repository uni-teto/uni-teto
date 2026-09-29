"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPinIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { BRAZILIAN_STATES, STATE_CODES } from "@/lib/geo/states";
import {
  listingSchema,
  type ListingData,
  type ListingInput,
} from "@/lib/listings/listing-schema";
import {
  LISTING_TYPE_LABELS,
  LISTING_TYPES,
} from "@/lib/listings/listing-types";
import { locationNotice } from "@/lib/listings/location-notice";
import { maskZipCodeInput } from "@/lib/listings/zip-code";
import { createListingAction } from "./actions";

// Todos os campi do seed são em Teresina: já vem preenchido, mas dá para mudar
const DEFAULT_VALUES: ListingInput = {
  title: "",
  description: "",
  type: "" as ListingInput["type"],
  price: "",
  availableSpots: "1",
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "Teresina",
  state: "PI",
};

type Published = {
  precision: Parameters<typeof locationNotice>[0];
  displayName: string;
};

export function ListingForm() {
  const [published, setPublished] = useState<Published | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ListingInput, unknown, ListingData>({
    resolver: zodResolver(listingSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const zipCodeField = register("zipCode");

  async function onSubmit() {
    // Manda o que foi digitado: o servidor valida de novo e geocodifica
    let result: Awaited<ReturnType<typeof createListingAction>>;
    try {
      result = await createListingAction(getValues());
    } catch {
      // Erro inesperado no servidor: sem isso o formulário pararia calado
      setError("root", {
        message: "Não foi possível publicar o anúncio. Tente novamente.",
      });
      return;
    }
    if (result.ok) {
      setPublished(result);
      toast.success("Anúncio publicado.");
      return;
    }

    for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as keyof ListingInput, { message: messages[0] });
    }
    if (result.message) setError("root", { message: result.message });
  }

  if (published) {
    const notice = locationNotice(published.precision);
    return (
      <div role="status" className="space-y-4 text-sm">
        <p className="text-base font-medium">Seu anúncio foi publicado!</p>
        <p className="flex gap-2 text-muted-foreground">
          <MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Localização no mapa:{" "}
            <span className="text-foreground">{published.displayName}</span>
          </span>
        </p>
        {notice && (
          <p className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <TriangleAlertIcon
              className="mt-0.5 size-4 shrink-0 text-amber-600"
              aria-hidden
            />
            <span>{notice}</span>
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => {
              reset(DEFAULT_VALUES);
              setPublished(null);
            }}
          >
            Criar outro anúncio
          </Button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Ir para o início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Sobre a vaga</FieldLegend>
          <FieldGroup>
            <FormField
              id="title"
              label="Título"
              description="Ex: Quarto mobiliado a 5 minutos da UFPI"
              error={errors.title}
            >
              <Input
                id="title"
                aria-invalid={!!errors.title}
                {...register("title")}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField id="type" label="Tipo de vaga" error={errors.type}>
                <NativeSelect
                  id="type"
                  className="w-full"
                  aria-invalid={!!errors.type}
                  {...register("type")}
                >
                  <NativeSelectOption value="" disabled>
                    Escolha
                  </NativeSelectOption>
                  {LISTING_TYPES.map((type) => (
                    <NativeSelectOption key={type} value={type}>
                      {LISTING_TYPE_LABELS[type]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>

              <FormField
                id="price"
                label="Valor mensal (R$)"
                error={errors.price}
              >
                <Input
                  id="price"
                  inputMode="decimal"
                  placeholder="650,00"
                  aria-invalid={!!errors.price}
                  {...register("price")}
                />
              </FormField>

              <FormField
                id="availableSpots"
                label="Vagas disponíveis"
                error={errors.availableSpots}
              >
                <Input
                  id="availableSpots"
                  type="number"
                  min={1}
                  max={20}
                  inputMode="numeric"
                  aria-invalid={!!errors.availableSpots}
                  {...register("availableSpots")}
                />
              </FormField>
            </div>

            <FormField
              id="description"
              label="Descrição"
              description="Mobília, contas inclusas, regras da casa, o que tem por perto."
              error={errors.description}
            >
              <Textarea
                id="description"
                rows={5}
                aria-invalid={!!errors.description}
                {...register("description")}
              />
            </FormField>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Endereço</FieldLegend>
          <p className="-mt-2 text-sm text-muted-foreground">
            Usamos o endereço para calcular a distância até o campus. Ele
            aparece no anúncio.
          </p>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField id="zipCode" label="CEP" error={errors.zipCode}>
                <Input
                  id="zipCode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="64049-550"
                  aria-invalid={!!errors.zipCode}
                  {...zipCodeField}
                  onChange={(event) => {
                    event.target.value = maskZipCodeInput(event.target.value);
                    return zipCodeField.onChange(event);
                  }}
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField id="street" label="Rua" error={errors.street}>
                  <Input
                    id="street"
                    autoComplete="address-line1"
                    aria-invalid={!!errors.street}
                    {...register("street")}
                  />
                </FormField>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                id="number"
                label="Número"
                description='Use "s/n" se não houver.'
                error={errors.number}
              >
                <Input
                  id="number"
                  aria-invalid={!!errors.number}
                  {...register("number")}
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField
                  id="complement"
                  label="Complemento (opcional)"
                  error={errors.complement}
                >
                  <Input
                    id="complement"
                    autoComplete="address-line2"
                    aria-invalid={!!errors.complement}
                    {...register("complement")}
                  />
                </FormField>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                id="neighborhood"
                label="Bairro"
                error={errors.neighborhood}
              >
                <Input
                  id="neighborhood"
                  aria-invalid={!!errors.neighborhood}
                  {...register("neighborhood")}
                />
              </FormField>
              <FormField id="city" label="Cidade" error={errors.city}>
                <Input
                  id="city"
                  autoComplete="address-level2"
                  aria-invalid={!!errors.city}
                  {...register("city")}
                />
              </FormField>
              <FormField id="state" label="Estado" error={errors.state}>
                <NativeSelect
                  id="state"
                  className="w-full"
                  aria-invalid={!!errors.state}
                  {...register("state")}
                >
                  {STATE_CODES.map((code) => (
                    <NativeSelectOption key={code} value={code}>
                      {BRAZILIAN_STATES[code]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldError errors={[errors.root]} />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Localizando endereço e publicando..."
            : "Publicar anúncio"}
        </Button>
      </FieldGroup>
    </form>
  );
}
