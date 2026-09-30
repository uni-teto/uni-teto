import { SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  NO_CAMPUS,
  parseSearchFilters,
  type SearchFilters,
  searchQueryString,
  searchUrl,
} from "@/lib/search/search-filters";
import { searchListings } from "@/lib/search/search-listings";
import { ListingCard } from "./listing-card";
import { SearchForm } from "./search-form";

export const metadata: Metadata = {
  title: "Buscar moradia | UniTeto",
  description:
    "Quartos, vagas em repúblicas e quitinetes para universitários, ordenados pela distância real até o campus.",
};

// Busca pública de anúncios (#28), sem login. Os filtros ficam na URL
// (src/lib/search/search-filters.ts), então o link pode ser compartilhado.
// Sem campus, lista por mais recentes; com campus, do mais perto para o mais
// longe. O estudante logado já entra com o campus da universidade dele (#29).
// O contato não aparece aqui: fica na página do anúncio.
export default async function SearchPage({
  searchParams,
}: PageProps<"/busca">) {
  const [params, session, campuses] = await Promise.all([
    searchParams,
    getSession(),
    prisma.campus.findMany({
      select: {
        id: true,
        name: true,
        universityId: true,
        university: { select: { acronym: true } },
      },
      orderBy: [{ university: { acronym: "asc" } }, { name: "asc" }],
    }),
  ]);

  const parsed = parseSearchFilters(params);

  // Estudante sem campus na URL: entra com o campus da universidade dele.
  // Se escolher "todos os campi", a URL guarda `campus=todos` (NO_CAMPUS)
  // para o campus não voltar sozinho ao mudar de página
  const ownCampus =
    session?.user.role === "ESTUDANTE"
      ? campuses.find((c) => c.universityId === session.user.universityId)
      : undefined;
  if (ownCampus && parsed.campusId === null) {
    redirect(searchUrl({ ...parsed, campusId: ownCampus.id }));
  }

  const campus = campuses.find((c) => c.id === parsed.campusId) ?? null;
  // Campus que não existe (link antigo ou digitado errado): busca sem campus
  const filters: SearchFilters = campus
    ? parsed
    : { ...parsed, campusId: null, radiusKm: null };
  // Os mesmos filtros como vão nos links desta página
  const noCampusValue = ownCampus ? NO_CAMPUS : null;
  const urlFilters: SearchFilters = campus
    ? filters
    : { ...filters, campusId: noCampusValue };

  const result = await searchListings(filters);
  // Página além da última (anúncio saiu do ar, link antigo): volta à última
  if (filters.page > 1 && result.items.length === 0) {
    redirect(searchUrl({ ...urlFilters, page: Math.max(1, result.pageCount) }));
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

      <section
        aria-label="Filtros"
        className="mt-6 rounded-xl border bg-muted/40 p-4"
      >
        <SearchForm
          // Remonta quando a URL muda, para os campos de preço acompanharem
          key={searchQueryString(urlFilters)}
          campuses={campuses.map((c) => ({ id: c.id, label: campusLabel(c) }))}
          filters={urlFilters}
          noCampusValue={noCampusValue}
        />
        {!campus && campuses.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Escolha um campus para ver a distância de cada anúncio e ordenar do
            mais perto para o mais longe.
          </p>
        )}
      </section>

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
                ...urlFilters,
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
            filters={urlFilters}
            page={filters.page - 1}
            enabled={filters.page > 1}
          >
            Anterior
          </PageLink>
          <span className="text-muted-foreground">
            Página {filters.page} de {result.pageCount}
          </span>
          <PageLink
            filters={urlFilters}
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
