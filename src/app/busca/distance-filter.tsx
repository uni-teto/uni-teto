"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  RADIUS_OPTIONS_KM,
  type RadiusKm,
  type SearchFilters,
  searchUrl,
} from "@/lib/search/search-filters";

export type CampusOption = { id: string; label: string };

/**
 * Campus e raio da busca (#29). Cada escolha vai para a URL (o link continua
 * compartilhável) e volta para a primeira página, porque a ordem muda.
 */
export function DistanceFilter({
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
  const selectedCampus = campuses.some((c) => c.id === filters.campusId)
    ? filters.campusId!
    : "";

  function go(next: Partial<SearchFilters>) {
    startTransition(() => {
      router.push(searchUrl({ ...filters, ...next, page: 1 }));
    });
  }

  return (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:items-end"
      aria-busy={pending}
    >
      <div className="flex flex-1 flex-col gap-2">
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

      <div className="flex flex-col gap-2 sm:w-56">
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
    </div>
  );
}
