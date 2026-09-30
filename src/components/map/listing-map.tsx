"use client";

import "leaflet/dist/leaflet.css";
import { Circle, CircleMarker, MapContainer, Tooltip } from "react-leaflet";
import { CAMPUS_COLOR, FitPoints, LISTING_COLOR, OsmTiles } from "./map-parts";

export type MapPoint = { latitude: number; longitude: number };
export type CampusPoint = MapPoint & { id: string; name: string };

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
      <OsmTiles />
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
