import { SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import {
  parseSearchFilters,
  type SearchFilters,
  searchUrl,
} from "@/lib/search/search-filters";
import { searchListings } from "@/lib/search/search-listings";
import { ListingCard } from "./listing-card";

export const metadata: Metadata = {
  title: "Buscar moradia | UniTeto",
  description:
    "Quartos, vagas em repúblicas e quitinetes para universitários, ordenados pela distância real até o campus.",
};

// Busca pública de anúncios (#28), sem login. Os filtros ficam na URL
// (src/lib/search/search-filters.ts), então o link pode ser compartilhado.
// Sem campus, lista por mais recentes; com campus, do mais perto para o mais
// longe. O contato não aparece aqui: fica na página do anúncio.
export default async function SearchPage({
  searchParams,
}: PageProps<"/busca">) {
  const [params, campuses] = await Promise.all([
    searchParams,
    prisma.campus.findMany({
      select: {
        id: true,
        name: true,
        university: { select: { acronym: true } },
      },
      orderBy: [{ university: { acronym: "asc" } }, { name: "asc" }],
    }),
  ]);

  const parsed = parseSearchFilters(params);
  const campus = campuses.find((c) => c.id === parsed.campusId) ?? null;
  // Campus que não existe (link antigo ou digitado errado): busca sem campus
  const filters: SearchFilters = campus
    ? parsed
    : { ...parsed, campusId: null, radiusKm: null };

  const result = await searchListings(filters);
  // Página além da última (anúncio saiu do ar, link antigo): volta à última
  if (filters.page > 1 && result.items.length === 0) {
    redirect(searchUrl({ ...filters, page: Math.max(1, result.pageCount) }));
  }

  const campusLabel = (c: (typeof campuses)[number]) =>
    `${c.university.acronym} · ${c.name}`;
  const hasFilters =
    filters.radiusKm !== null ||
    filters.minPriceCents !== null ||
    filters.maxPriceCents !== null ||
    filters.type !== null;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        {campus ? `Moradia perto de ${campusLabel(campus)}` : "Buscar moradia"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground" role="status">
        {result.total === 1
          ? "1 anúncio encontrado"
          : `${result.total} anúncios encontrados`}
        {campus
          ? filters.radiusKm
            ? `, a até ${filters.radiusKm} km do campus, do mais perto para o mais longe.`
            : ", do mais perto para o mais longe do campus."
          : ", dos mais recentes para os mais antigos."}
      </p>

      {campuses.length > 0 && (
        <nav
          aria-label="Campus"
          className="mt-6 flex flex-wrap items-center gap-2 text-sm"
        >
          <span className="text-muted-foreground">
            {campus ? "Campus:" : "Escolha um campus para ver a distância:"}
          </span>
          {campuses.map((c) => {
            const selected = c.id === campus?.id;
            return (
              <Link
                key={c.id}
                // Trocar de campus muda a ordem: volta para a primeira página
                href={searchUrl({ ...filters, campusId: c.id, page: 1 })}
                aria-current={selected ? "true" : undefined}
                className={buttonVariants({
                  variant: selected ? "default" : "outline",
                  size: "sm",
                })}
              >
                {campusLabel(c)}
              </Link>
            );
          })}
          {campus && (
            <Link
              href={searchUrl({
                ...filters,
                campusId: null,
                radiusKm: null,
                page: 1,
              })}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Todos os anúncios
            </Link>
          )}
        </nav>
      )}

      {result.items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-dashed px-4 py-16 text-center">
          <SearchXIcon className="size-8 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-medium">Nenhum anúncio encontrado</p>
            <p className="text-sm text-muted-foreground">
              {hasFilters
                ? "Tente aumentar a distância ou a faixa de preço."
                : "Ainda não há anúncios publicados. Volte em breve."}
            </p>
          </div>
          {hasFilters && (
            <Link
              href={searchUrl({
                ...filters,
                radiusKm: null,
                minPriceCents: null,
                maxPriceCents: null,
                type: null,
                page: 1,
              })}
              className={buttonVariants({ variant: "outline" })}
            >
              Limpar filtros
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              campusId={filters.campusId}
            />
          ))}
        </ul>
      )}

      {result.pageCount > 1 && (
        <nav
          aria-label="Paginação"
          className="mt-8 flex items-center justify-center gap-4 text-sm"
        >
          <PageLink
            filters={filters}
            page={filters.page - 1}
            enabled={filters.page > 1}
          >
            Anterior
          </PageLink>
          <span className="text-muted-foreground">
            Página {filters.page} de {result.pageCount}
          </span>
          <PageLink
            filters={filters}
            page={filters.page + 1}
            enabled={filters.page < result.pageCount}
          >
            Próxima
          </PageLink>
        </nav>
      )}
    </main>
  );
}

function PageLink({
  filters,
  page,
  enabled,
  children,
}: {
  filters: SearchFilters;
  page: number;
  enabled: boolean;
  children: React.ReactNode;
}) {
  const className = buttonVariants({ variant: "outline", size: "sm" });
  if (!enabled) {
    return (
      <span aria-disabled="true" className={`${className} opacity-50`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={searchUrl({ ...filters, page })} className={className}>
      {children}
    </Link>
  );
}
