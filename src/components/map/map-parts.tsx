"use client";

import { latLngBounds } from "leaflet";
import { useEffect } from "react";
import { TileLayer, useMap } from "react-leaflet";

// Peças comuns aos mapas (anúncio e resultados da busca).

// Cores fixas: o mapa (tiles do OSM) é claro também no tema escuro
export const LISTING_COLOR = "#dc2626";
export const CAMPUS_COLOR = "#2563eb";

/** Tiles do OpenStreetMap, com a atribuição que a licença exige. */
export function OsmTiles() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  );
}

/**
 * Enquadra todos os pontos. Com um ponto só, usa o `zoom` informado. Roda de
 * novo quando a lista de pontos muda (outro campus, outra página da busca).
 */
export function FitPoints({
  points,
  zoom,
}: {
  points: [number, number][];
  zoom: number;
}) {
  const map = useMap();
  const key = JSON.stringify(points);

  useEffect(() => {
    const latLngs: [number, number][] = JSON.parse(key);
    if (latLngs.length === 0) return;
    if (latLngs.length < 2) {
      map.setView(latLngs[0], zoom);
      return;
    }
    map.fitBounds(latLngBounds(latLngs), { padding: [32, 32], maxZoom: 16 });
  }, [map, key, zoom]);

  return null;
}
