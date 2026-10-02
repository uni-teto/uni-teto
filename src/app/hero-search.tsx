"use client";

import { MapPinIcon, RulerIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SEARCH_PATH } from "@/lib/auth/routes";
import {
  NO_FILTERS,
  RADIUS_OPTIONS_KM,
  type RadiusKm,
  searchUrl,
} from "@/lib/search/search-filters";

export type HeroCampus = { id: string; label: string };

/**
 * Busca em pílula do topo da página inicial: campus e distância. Envia para
 * a busca (`/busca`) com os filtros na URL. Sem JavaScript o formulário é um
 * GET comum e funciona igual (a busca ignora os campos vazios).
 */
export function HeroSearch({
  campuses,
  defaultCampusId,
}: {
  campuses: HeroCampus[];
  /** Para o estudante: o campus da universidade dele */
  defaultCampusId: string | null;
}) {
  const router = useRouter();
  const [campusId, setCampusId] = useState(defaultCampusId ?? "");
  const [radius, setRadius] = useState("");

  return (
    <form
      role="search"
      aria-label="Buscar moradia"
      action={SEARCH_PATH}
      onSubmit={(event) => {
        event.preventDefault();
        router.push(
          searchUrl({
            ...NO_FILTERS,
            campusId: campusId || null,
            radiusKm: campusId && radius ? (Number(radius) as RadiusKm) : null,
          }),
        );
      }}
      className="flex w-full max-w-xl flex-col gap-1 rounded-3xl border bg-background p-2 shadow-lg sm:flex-row sm:items-center sm:rounded-full"
    >
      <label className="flex min-w-0 flex-1 items-center gap-3 rounded-full px-4 py-2 transition-colors hover:bg-muted">
        <MapPinIcon className="size-5 shrink-0" aria-hidden />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs font-semibold">Campus</span>
          <select
            name="campus"
            value={campusId}
            onChange={(event) => setCampusId(event.target.value)}
            className="w-full min-w-0 cursor-pointer truncate bg-transparent text-sm text-muted-foreground outline-none"
          >
            <option value="">Qual é a sua universidade?</option>
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.label}
              </option>
            ))}
          </select>
        </span>
      </label>

      <span aria-hidden className="hidden h-8 w-px bg-border sm:block" />

      <label className="flex items-center gap-3 rounded-full px-4 py-2 transition-colors hover:bg-muted sm:w-44">
        <RulerIcon className="size-5 shrink-0" aria-hidden />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs font-semibold">Distância</span>
          <select
            name="raio"
            value={radius}
            // Sem campus não há de onde medir
            disabled={!campusId}
            onChange={(event) => setRadius(event.target.value)}
            className="w-full cursor-pointer bg-transparent text-sm text-muted-foreground outline-none disabled:cursor-not-allowed"
          >
            <option value="">Qualquer distância</option>
            {RADIUS_OPTIONS_KM.map((km) => (
              <option key={km} value={km}>
                Até {km} km
              </option>
            ))}
          </select>
        </span>
      </label>

      <Button type="submit" size="lg" className="shrink-0">
        <SearchIcon aria-hidden />
        Buscar
      </Button>
    </form>
  );
}
