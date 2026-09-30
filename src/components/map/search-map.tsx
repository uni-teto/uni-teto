"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  Tooltip,
} from "react-leaflet";
import { CAMPUS_COLOR, FitPoints, LISTING_COLOR, OsmTiles } from "./map-parts";

export type SearchMapCampus = {
  name: string;
  latitude: number;
  longitude: number;
};

export type SearchMapListing = {
  id: string;
  title: string;
  /** Página do anúncio */
  href: string;
  /** Ex: "R$ 650,00/mês" */
  price: string;
  /** Ex: "622 m do campus"; `null` sem campus escolhido */
  distance: string | null;
  latitude: number;
  longitude: number;
  /** Raio em metros da área desenhada quando o ponto é aproximado (0 = não desenha) */
  approximateRadius: number;
};

// Metros por grau de latitude (aproximação boa o bastante para enquadrar)
const METERS_PER_DEGREE = 111_320;

/** Os quatro extremos do círculo do raio, para ele caber no enquadramento. */
function circleCorners(
  { latitude, longitude }: SearchMapCampus,
  radiusMeters: number,
): [number, number][] {
  const dLat = radiusMeters / METERS_PER_DEGREE;
  const dLon = dLat / Math.cos((latitude * Math.PI) / 180);
  return [
    [latitude + dLat, longitude],
    [latitude - dLat, longitude],
    [latitude, longitude + dLon],
    [latitude, longitude - dLon],
  ];
}

/**
 * Mapa dos resultados da busca (#31): o campus escolhido, o raio em volta
 * dele e um marcador por anúncio da página atual. Clicar no marcador abre um
 * resumo com link para o anúncio. Marcadores em círculo, como no mapa do
 * anúncio (o ícone padrão do Leaflet depende de imagens que o bundler não copia).
 */
export default function SearchMap({
  campus,
  radiusMeters,
  listings,
}: {
  campus: SearchMapCampus | null;
  /** Raio do filtro; `null` = qualquer distância */
  radiusMeters: number | null;
  listings: SearchMapListing[];
}) {
  const points: [number, number][] = [
    ...listings.map((l) => [l.latitude, l.longitude] as [number, number]),
    ...(campus
      ? [[campus.latitude, campus.longitude] as [number, number]]
      : []),
    ...(campus && radiusMeters ? circleCorners(campus, radiusMeters) : []),
  ];

  return (
    <MapContainer
      center={points[0]}
      zoom={14}
      scrollWheelZoom={false}
      className="z-0 size-full"
    >
      <FitPoints points={points} zoom={15} />
      <OsmTiles />

      {campus && radiusMeters && (
        <Circle
          center={[campus.latitude, campus.longitude]}
          radius={radiusMeters}
          interactive={false}
          pathOptions={{
            color: CAMPUS_COLOR,
            weight: 1,
            dashArray: "6 6",
            fillOpacity: 0.05,
          }}
        />
      )}

      {listings.map(
        (listing) =>
          listing.approximateRadius > 0 && (
            // Centro do bairro: uma área, para o ponto não parecer exato
            <Circle
              key={`area-${listing.id}`}
              center={[listing.latitude, listing.longitude]}
              radius={listing.approximateRadius}
              interactive={false}
              pathOptions={{
                color: LISTING_COLOR,
                weight: 1,
                fillOpacity: 0.1,
              }}
            />
          ),
      )}

      {listings.map((listing) => (
        <CircleMarker
          key={listing.id}
          center={[listing.latitude, listing.longitude]}
          radius={8}
          pathOptions={{
            color: LISTING_COLOR,
            fillOpacity: 0.8,
            className: "search-map-listing",
          }}
        >
          <Popup>
            <div className="flex flex-col gap-1">
              <span className="font-medium">{listing.title}</span>
              <span>
                {listing.price}
                {listing.distance && ` · ${listing.distance}`}
              </span>
              {listing.approximateRadius > 0 && (
                <span>Localização aproximada (centro do bairro)</span>
              )}
              <Link href={listing.href} className="underline">
                Ver anúncio
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {campus && (
        <CircleMarker
          center={[campus.latitude, campus.longitude]}
          radius={9}
          pathOptions={{ color: CAMPUS_COLOR, fillOpacity: 0.9 }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]}>
            {campus.name}
          </Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
