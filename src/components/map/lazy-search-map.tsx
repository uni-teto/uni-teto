"use client";

import dynamic from "next/dynamic";

// O Leaflet usa `window`, então o mapa só é montado no navegador
export const LazySearchMap = dynamic(() => import("./search-map"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
      Carregando mapa...
    </div>
  ),
});
