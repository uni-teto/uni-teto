"use client";

import "leaflet/dist/leaflet.css";
import { latLngBounds } from "leaflet";
import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

export type MapPoint = { latitude: number; longitude: number };
export type CampusPoint = MapPoint & { id: string; name: string };

// Cores fixas: o mapa (tiles do OSM) é claro também no tema escuro
const LISTING_COLOR = "#dc2626";
const CAMPUS_COLOR = "#2563eb";

/**
 * Mapa do anúncio com os campi escolhidos. Usa marcadores em círculo
 * (CircleMarker) em vez do ícone padrão do Leaflet, que depende de imagens
 * que o bundler não copia.
 */
export default function ListingMap({
  listing,
  campuses,
}: {
  listing: MapPoint & { title: string };
  campuses: CampusPoint[];
}) {
  const center: [number, number] = [listing.latitude, listing.longitude];

  return (
    <MapContainer
      center={center}
      zoom={16}
      scrollWheelZoom={false}
      className="z-0 size-full"
    >
      <FitPoints
        points={[
          center,
          ...campuses.map((c) => [c.latitude, c.longitude] as [number, number]),
        ]}
      />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {campuses.map((campus) => (
        <CircleMarker
          key={campus.id}
          center={[campus.latitude, campus.longitude]}
          radius={8}
          pathOptions={{ color: CAMPUS_COLOR, fillOpacity: 0.8 }}
        >
          <Tooltip>{campus.name}</Tooltip>
        </CircleMarker>
      ))}
      <CircleMarker
        center={center}
        radius={10}
        pathOptions={{ color: LISTING_COLOR, fillOpacity: 0.8 }}
      >
        <Tooltip permanent direction="top" offset={[0, -8]}>
          {listing.title}
        </Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}

/**
 * Enquadra todos os pontos (anúncio e campi). Com um ponto só, fica no zoom
 * inicial. Roda de novo quando a lista de pontos muda (outro campus).
 */
function FitPoints({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = JSON.stringify(points);

  useEffect(() => {
    const latLngs: [number, number][] = JSON.parse(key);
    if (latLngs.length < 2) {
      map.setView(latLngs[0], 16);
      return;
    }
    map.fitBounds(latLngBounds(latLngs), { padding: [32, 32], maxZoom: 16 });
  }, [map, key]);

  return null;
}
