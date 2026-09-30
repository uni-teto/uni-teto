import { ArrowRightIcon, MapPinIcon } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { NEW_LISTING_PATH, SEARCH_PATH } from "@/lib/auth/routes";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NO_FILTERS, searchUrl } from "@/lib/search/search-filters";
import { searchListings } from "@/lib/search/search-listings";
import { ListingCard } from "./busca/listing-card";

// Anúncios em destaque na página inicial
const FEATURED_LISTINGS = 6;

const steps = [
  {
    title: "Escolha seu campus",
    text: "Os anúncios mostram a distância de verdade até o seu campus, não só o bairro.",
  },
  {
    title: "Compare as opções",
    text: "Filtre por distância, preço e tipo de vaga, e veja tudo no mapa.",
  },
  {
    title: "Fale com quem anuncia",
    text: "Estudantes entram com o e-mail da universidade, e só eles veem o WhatsApp e o e-mail de quem anuncia.",
  },
];

// Texto do topo conforme quem está vendo
const HERO = {
  visitor: {
    title: "Encontre moradia perto do seu campus",
    text: "Quartos, vagas em repúblicas e quitinetes para universitários, ordenados pela distância real até a sua universidade.",
  },
  ESTUDANTE: {
    title: "Encontre moradia perto do seu campus",
    text: "Quartos, vagas em repúblicas e quitinetes, ordenados pela distância real até a sua universidade.",
  },
  ANUNCIANTE: {
    title: "Anuncie para universitários",
    text: "Seu anúncio aparece para estudantes com a distância real até o campus. Cadastre seu WhatsApp no perfil para eles falarem com você.",
  },
};

export default async function Home() {
  const [session, campuses] = await Promise.all([
    getSession(),
    prisma.campus.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        universityId: true,
        university: { select: { acronym: true } },
      },
      orderBy: [{ university: { acronym: "asc" } }, { name: "asc" }],
    }),
  ]);
  const role = session?.user.role;
  const hero = role ? HERO[role] : HERO.visitor;

  // Destaques: para o estudante, os mais perto do campus da universidade
  // dele; para os outros, os mais recentes (as mesmas regras da busca)
  const ownCampus =
    role === "ESTUDANTE"
      ? campuses.find((c) => c.universityId === session?.user.universityId)
      : undefined;
  const featuredFilters = { ...NO_FILTERS, campusId: ownCampus?.id ?? null };
  const featured = await searchListings(featuredFilters, FEATURED_LISTINGS);

  return (
    <main className="flex-1">
      <section className="border-b bg-background">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col items-start gap-6">
            <h1 className="max-w-xl text-4xl leading-[1.1] font-bold text-balance sm:text-5xl lg:text-6xl">
              {hero.title}
            </h1>
            <p className="max-w-xl text-lg text-pretty text-muted-foreground">
              {hero.text}
            </p>

            <div className="flex flex-wrap gap-3">
              {role === "ANUNCIANTE" ? (
                <Link
                  href={NEW_LISTING_PATH}
                  className={buttonVariants({ size: "lg" })}
                >
                  Criar anúncio
                </Link>
              ) : (
                <Link
                  href={SEARCH_PATH}
                  className={buttonVariants({ size: "lg" })}
                >
                  Buscar moradia
                  <ArrowRightIcon aria-hidden />
                </Link>
              )}
              {session ? (
                <Link
                  href="/perfil"
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  Completar meu perfil
                </Link>
              ) : (
                <Link
                  href="/login"
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  Já tenho conta
                </Link>
              )}
            </div>

            {/* Cada campus leva à busca já ordenada pela distância até ele */}
            {campuses.length > 0 && (
              <div className="w-full">
                <h2 className="mb-3 font-sans text-sm font-medium tracking-normal text-muted-foreground">
                  Campi atendidos
                </h2>
                <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {campuses.map((campus) => (
                    <li key={campus.id}>
                      <Link
                        href={`${SEARCH_PATH}?campus=${encodeURIComponent(campus.id)}`}
                        className="flex items-center gap-2 rounded-full border border-input bg-background py-2 pr-4 pl-3 text-sm transition-colors hover:border-foreground"
                      >
                        <MapPinIcon className="size-4 shrink-0" aria-hidden />
                        <span className="font-medium">
                          {campus.university.acronym} · {campus.name}
                        </span>
                        <span className="sr-only">
                          , {campus.city}, {campus.state}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Símbolo da marca, só decorativo em telas largas */}
          <div
            aria-hidden
            className="hidden size-72 items-center justify-center rounded-[3rem] bg-primary lg:flex"
          >
            <Logo variant="symbol" inverted className="h-36" />
          </div>
        </div>
      </section>

      {featured.items.length > 0 && (
        <section
          aria-labelledby="destaques"
          className="mx-auto max-w-5xl px-4 pt-14"
        >
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="destaques" className="text-2xl font-semibold">
              {ownCampus
                ? `Perto de ${ownCampus.university.acronym} · ${ownCampus.name}`
                : "Anúncios recentes"}
            </h2>
            <Link
              href={searchUrl(featuredFilters)}
              className="text-sm font-medium underline underline-offset-4"
            >
              {featured.total === 1
                ? "Ver na busca"
                : `Ver os ${featured.total} anúncios`}
            </Link>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.items.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                campusId={featuredFilters.campusId}
                titleAs="h3"
              />
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="mb-6 text-2xl font-semibold">Como funciona</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map(({ title, text }, index) => (
            <li key={title} className="rounded-2xl border bg-card p-6">
              <span
                aria-hidden
                className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary font-heading text-sm font-semibold text-primary-foreground"
              >
                {index + 1}
              </span>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Quem já é anunciante tem o "Criar anúncio" no topo */}
      {role !== "ANUNCIANTE" && (
        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="flex flex-col items-start gap-6 rounded-3xl bg-primary p-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h2 className="text-2xl font-semibold">
                {role === "ESTUDANTE"
                  ? "Abriu uma vaga na sua república?"
                  : "Tem um quarto ou quitinete para alugar?"}
              </h2>
              <p className="mt-2 max-w-lg text-primary-foreground/75">
                Publique de graça. Seu anúncio aparece para universitários com a
                distância até o campus, e só estudantes verificados veem o seu
                contato.
              </p>
            </div>
            <Link
              href={session ? NEW_LISTING_PATH : "/cadastro?papel=anunciante"}
              className={buttonVariants({
                size: "lg",
                variant: "secondary",
                className: "shrink-0",
              })}
            >
              {session ? "Publicar um anúncio" : "Quero anunciar"}
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
