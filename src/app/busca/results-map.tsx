"use client";

import { MapIcon } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { LazySearchMap } from "@/components/map/lazy-search-map";
import type {
  SearchMapCampus,
  SearchMapListing,
} from "@/components/map/search-map";
import { Button } from "@/components/ui/button";
import { useSearchUi } from "./search-ui";

// Mesmo ponto de quebra `sm` do Tailwind
const WIDE_SCREEN = "(min-width: 640px)";

function subscribeToWidth(onChange: () => void) {
  const query = window.matchMedia(WIDE_SCREEN);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Mapa dos resultados (#31). Em tela larga aparece sempre; no celular fica
 * atrás do botão "Ver no mapa", para a lista não ficar longe do topo (e o
 * Leaflet só é baixado se a pessoa pedir).
 */
export function ResultsMap({
  campus,
  radiusMeters,
  listings,
}: {
  campus: SearchMapCampus | null;
  radiusMeters: number | null;
  listings: SearchMapListing[];
}) {
  const wide = useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia(WIDE_SCREEN).matches,
    // No servidor não há tela: o mapa entra depois, no navegador
    () => false,
  );
  const [open, setOpen] = useState(false);
  const { activeId, setActiveId } = useSearchUi();
  const visible = wide || open;

  return (
    <section aria-label="Mapa dos resultados" className="mt-6">
      <Button
        type="button"
        variant="outline"
        className="w-full sm:hidden"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <MapIcon aria-hidden />
        {open ? "Esconder mapa" : "Ver no mapa"}
      </Button>
      {visible && (
        <div className="mt-3 h-80 overflow-hidden rounded-2xl border sm:mt-0 sm:h-96">
          <LazySearchMap
            campus={campus}
            radiusMeters={radiusMeters}
            listings={listings}
            activeId={activeId}
            onActiveChange={setActiveId}
          />
        </div>
      )}
    </section>
  );
}
