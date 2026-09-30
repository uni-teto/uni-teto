"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  LISTING_TYPE_LABELS,
  LISTING_TYPES,
  type ListingType,
} from "@/lib/listings/listing-types";
import { parsePriceToCents } from "@/lib/listings/price";
import {
  RADIUS_OPTIONS_KM,
  type RadiusKm,
  type SearchFilters,
  searchUrl,
} from "@/lib/search/search-filters";

export type CampusOption = { id: string; label: string };

/**
 * "650", "650,00" ou "R$ 1.200" → centavos, arredondando para reais inteiros
 * (é como o preço vai na URL). Vazio ou inválido → sem limite.
 */
function reaisToCents(value: string): number | null {
  const cents = parsePriceToCents(value.trim());
  return cents === null ? null : Math.round(cents / 100) * 100;
}

const centsToReais = (cents: number | null) =>
  cents === null ? "" : String(cents / 100);

/**
 * Filtros da busca: campus e raio (#29), tipo de vaga e faixa de preço (#30).
 * Tudo vai para a URL (o link continua compartilhável) e volta para a
 * primeira página. Os seletores aplicam na hora; o preço, ao enviar.
 *
 * A página troca a `key` quando a URL muda, para os campos de preço
 * acompanharem (ex: depois de "Limpar").
 */
export function SearchForm({
  campuses,
  filters,
  noCampusValue,
}: {
  campuses: CampusOption[];
  /** Filtros como estão na URL */
  filters: SearchFilters;
  /**
   * O que vai em `?campus=` ao escolher "todos os campi": `null` tira o
   * parâmetro; para o estudante é `NO_CAMPUS`, senão o campus dele voltaria.
   */
  noCampusValue: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [minPrice, setMinPrice] = useState(centsToReais(filters.minPriceCents));
  const [maxPrice, setMaxPrice] = useState(centsToReais(filters.maxPriceCents));

  const selectedCampus = campuses.some((c) => c.id === filters.campusId)
    ? filters.campusId!
    : "";
  const hasFilters =
    filters.radiusKm !== null ||
    filters.minPriceCents !== null ||
    filters.maxPriceCents !== null ||
    filters.type !== null;

  function prices() {
    let min = reaisToCents(minPrice);
    let max = reaisToCents(maxPrice);
    // "De 800 a 300": a pessoa trocou os campos
    if (min !== null && max !== null && min > max) [min, max] = [max, min];
    return { minPriceCents: min, maxPriceCents: max };
  }

  function go(next: Partial<SearchFilters>) {
    startTransition(() => {
      // Leva junto o preço digitado e ainda não aplicado
      router.push(searchUrl({ ...filters, ...prices(), ...next, page: 1 }));
    });
  }

  return (
    <form
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        go({});
      }}
    >
      {campuses.length > 0 && (
        <>
          <div className="flex flex-col gap-2 lg:col-span-2">
            <Label htmlFor="campus">Campus</Label>
            <NativeSelect
              id="campus"
              value={selectedCampus}
              onChange={(event) => {
                const campusId = event.target.value;
                go(
                  campusId
                    ? { campusId }
                    : { campusId: noCampusValue, radiusKm: null },
                );
              }}
              className="w-full"
            >
              <NativeSelectOption value="">
                Todos os campi (sem distância)
              </NativeSelectOption>
              {campuses.map((campus) => (
                <NativeSelectOption key={campus.id} value={campus.id}>
                  {campus.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div className="flex flex-col gap-2 lg:col-span-2">
            <Label htmlFor="raio">Distância até o campus</Label>
            <NativeSelect
              id="raio"
              // Sem campus não há de onde medir
              disabled={!selectedCampus}
              value={selectedCampus && filters.radiusKm ? filters.radiusKm : ""}
              onChange={(event) => {
                const km = Number(event.target.value);
                go({ radiusKm: km ? (km as RadiusKm) : null });
              }}
              className="w-full"
            >
              <NativeSelectOption value="">
                {selectedCampus ? "Qualquer distância" : "Escolha um campus"}
              </NativeSelectOption>
              {RADIUS_OPTIONS_KM.map((km) => (
                <NativeSelectOption key={km} value={km}>
                  Até {km} km
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="tipo">Tipo de vaga</Label>
        <NativeSelect
          id="tipo"
          value={filters.type ?? ""}
          onChange={(event) => {
            const type = event.target.value;
            go({ type: type ? (type as ListingType) : null });
          }}
          className="w-full"
        >
          <NativeSelectOption value="">Todos os tipos</NativeSelectOption>
          {LISTING_TYPES.map((type) => (
            <NativeSelectOption key={type} value={type}>
              {LISTING_TYPE_LABELS[type]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="precoMin">Preço mínimo (R$)</Label>
        <Input
          id="precoMin"
          inputMode="decimal"
          maxLength={12}
          placeholder="Ex: 300"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="precoMax">Preço máximo (R$)</Label>
        <Input
          id="precoMax"
          inputMode="decimal"
          maxLength={12}
          placeholder="Ex: 800"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
        />
      </div>

      <div className="flex items-end gap-2">
        <Button type="submit" disabled={pending}>
          Aplicar preço
        </Button>
        {hasFilters && (
          <Link
            href={searchUrl({
              ...filters,
              radiusKm: null,
              minPriceCents: null,
              maxPriceCents: null,
              type: null,
              page: 1,
            })}
            className={buttonVariants({ variant: "ghost" })}
          >
            Limpar
          </Link>
        )}
      </div>
    </form>
  );
}
