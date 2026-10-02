"use client";

import {
  BedDoubleIcon,
  BuildingIcon,
  HouseIcon,
  LayoutGridIcon,
  type LucideIcon,
} from "lucide-react";
import {
  LISTING_TYPE_LABELS,
  LISTING_TYPES,
  type ListingType,
} from "@/lib/listings/listing-types";
import { type SearchFilters, searchUrl } from "@/lib/search/search-filters";
import { cn } from "@/lib/utils";
import { SearchLink } from "./search-ui";

const ICONS: Record<ListingType, LucideIcon> = {
  QUARTO: BedDoubleIcon,
  VAGA_REPUBLICA: HouseIcon,
  QUITINETE: BuildingIcon,
};

const OPTIONS: { type: ListingType | null; label: string; icon: LucideIcon }[] =
  [
    { type: null, label: "Todos", icon: LayoutGridIcon },
    ...LISTING_TYPES.map((type) => ({
      type,
      label: LISTING_TYPE_LABELS[type],
      icon: ICONS[type],
    })),
  ];

/**
 * Categorias da busca (tipo de vaga), com ícone, acima dos resultados. Cada
 * uma é um link para a mesma busca com aquele tipo, na primeira página.
 */
export function TypeChips({ filters }: { filters: SearchFilters }) {
  return (
    <nav aria-label="Tipo de vaga" className="mt-6 border-b">
      <ul className="-mb-px flex gap-6 overflow-x-auto sm:gap-8">
        {OPTIONS.map(({ type, label, icon: Icon }) => {
          const current = filters.type === type;
          return (
            <li key={label} className="shrink-0">
              <SearchLink
                href={searchUrl({ ...filters, type, page: 1 })}
                ariaCurrent={current}
                className={cn(
                  "flex flex-col items-center gap-1.5 border-b-2 px-1 pb-3 text-xs font-medium transition-colors",
                  current
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <Icon className="size-6" strokeWidth={1.5} aria-hidden />
                {label}
              </SearchLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
