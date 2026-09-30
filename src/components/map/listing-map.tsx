"use client";

import "leaflet/dist/leaflet.css";
import { latLngBounds } from "leaflet";
import { useEffect } from "react";
import {
  Circle,
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
  listing: MapPoint & {
    title: string;
    /** Raio em metros quando o ponto é aproximado (0 = ponto exato) */
    approximateRadius: number;
  };
  campuses: CampusPoint[];
}) {
  const center: [number, number] = [listing.latitude, listing.longitude];
  const approximate = listing.approximateRadius > 0;

  return (
    <MapContainer
      center={center}
      zoom={16}
      scrollWheelZoom={false}
      className="z-0 size-full"
    >
      <FitPoints
        // Centro do bairro: afasta para o círculo caber
        zoom={listing.approximateRadius > 300 ? 14 : 16}
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
      {approximate ? (
        // Aproximado: uma área em vez de um ponto, para não parecer exato
        <Circle
          center={center}
          radius={listing.approximateRadius}
          pathOptions={{ color: LISTING_COLOR, fillOpacity: 0.15 }}
        >
          <Tooltip permanent direction="top">
            {listing.title} (localização aproximada)
          </Tooltip>
        </Circle>
      ) : (
        <CircleMarker
          center={center}
          radius={10}
          pathOptions={{ color: LISTING_COLOR, fillOpacity: 0.8 }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]}>
            {listing.title}
          </Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}

/**
 * Enquadra todos os pontos (anúncio e campi). Com um ponto só, usa o
 * `zoom` informado. Roda de novo quando a lista de pontos muda (outro campus).
 */
function FitPoints({
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
    if (latLngs.length < 2) {
      map.setView(latLngs[0], zoom);
      return;
    }
    map.fitBounds(latLngBounds(latLngs), { padding: [32, 32], maxZoom: 16 });
  }, [map, key, zoom]);

  return null;
}
