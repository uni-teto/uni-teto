import {
  ArrowRightIcon,
  BuildingIcon,
  GraduationCapIcon,
  MapIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { NEW_LISTING_PATH, SEARCH_PATH } from "@/lib/auth/routes";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NO_FILTERS, searchUrl } from "@/lib/search/search-filters";
import { searchListings } from "@/lib/search/search-listings";
import { ListingCard } from "./busca/listing-card";
import { HeroSearch } from "./hero-search";

// Anúncios em destaque na página inicial
const FEATURED_LISTINGS = 6;

// O que o UniTeto faz de fato (sem promessa de recurso que não existe)
const highlights = [
  { icon: GraduationCapIcon, text: "Distância real até o campus" },
  { icon: ShieldCheckIcon, text: "Contato só para estudantes" },
  { icon: MapIcon, text: "Busca no mapa" },
  { icon: BuildingIcon, text: "Quartos, repúblicas e quitinetes" },
];

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
  const campusLabel = (c: (typeof campuses)[number]) =>
    `${c.university.acronym} · ${c.name}`;

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
      {/* Topo: texto e busca à esquerda, foto com corte diagonal à direita */}
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="relative h-56 sm:h-72 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[46%] lg:[clip-path:polygon(14%_0,100%_0,100%_100%,0_100%)]">
            <Image
              src="/images/quarto-estudante.webp"
              alt="Quarto de estudante com cama, escrivaninha e janela para a cidade"
              fill
              preload
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover"
            />
          </div>

          <div className="relative flex flex-col items-start gap-6 p-6 sm:p-10 lg:w-[56%] lg:py-16">
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Moradia para quem estuda
            </p>
            <h1 className="max-w-lg text-4xl leading-[1.08] font-bold text-balance sm:text-5xl">
              {hero.title}
            </h1>
            <p className="max-w-md text-lg text-pretty text-muted-foreground">
              {hero.text}
            </p>

            {role === "ANUNCIANTE" ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  href={NEW_LISTING_PATH}
                  className={buttonVariants({ size: "lg" })}
                >
                  Criar anúncio
                </Link>
                <Link
                  href="/perfil"
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  Completar meu perfil
                </Link>
              </div>
            ) : (
              <HeroSearch
                campuses={campuses.map((c) => ({
                  id: c.id,
                  label: campusLabel(c),
                }))}
                defaultCampusId={ownCampus?.id ?? null}
              />
            )}

            <ul className="grid w-full max-w-xl grid-cols-2 gap-x-4 gap-y-3 pt-2 sm:grid-cols-4 lg:grid-cols-2">
              {highlights.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-xs">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Cada campus leva à busca já ordenada pela distância até ele */}
      {campuses.length > 0 && (
        <section
          aria-labelledby="campi"
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 pt-6"
        >
          <h2
            id="campi"
            className="font-sans text-sm font-medium tracking-normal text-muted-foreground"
          >
            Campi atendidos
          </h2>
          <ul className="flex flex-wrap gap-2">
            {campuses.map((campus) => (
              <li key={campus.id}>
                <Link
                  href={`${SEARCH_PATH}?campus=${encodeURIComponent(campus.id)}`}
                  className="flex items-center gap-2 rounded-full border bg-card py-1.5 pr-4 pl-3 text-sm transition-colors hover:border-foreground"
                >
                  <MapPinIcon className="size-4 shrink-0" aria-hidden />
                  <span className="font-medium">{campusLabel(campus)}</span>
                  <span className="sr-only">
                    , {campus.city}, {campus.state}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {featured.items.length > 0 && (
        <section
          aria-labelledby="destaques"
          className="mx-auto max-w-6xl px-4 pt-14"
        >
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="destaques" className="text-2xl font-semibold">
              {ownCampus
                ? `Perto de ${campusLabel(ownCampus)}`
                : "Anúncios recentes"}
            </h2>
            <Link
              href={searchUrl(featuredFilters)}
              className="flex items-center gap-1 text-sm font-medium hover:underline"
            >
              {featured.total === 1
                ? "Ver na busca"
                : `Ver os ${featured.total} anúncios`}
              <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Mais que moradia: foto com corte diagonal e texto */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="grid overflow-hidden rounded-3xl border bg-card shadow-sm md:grid-cols-2">
          <div className="relative h-56 md:h-auto md:min-h-80 md:[clip-path:polygon(0_0,100%_0,82%_100%,0_100%)]">
            <Image
              src="/images/republica.webp"
              alt="Quarto de república com duas camas altas e escrivaninhas embaixo"
              fill
              sizes="(min-width: 768px) 560px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Mais que moradia
            </p>
            <h2 className="text-3xl font-semibold text-balance">
              É sobre a sua jornada.
            </h2>
            <p className="text-muted-foreground">
              Morar perto do campus é ganhar tempo para estudar, descansar e
              aproveitar a universidade. O UniTeto mostra a distância de verdade
              até a sua faculdade, para você escolher com calma.
            </p>
            <p className="flex items-center gap-3 pt-2 font-hand text-3xl">
              Juntos na sua jornada.
              <Logo variant="symbol" className="h-7" />
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-6 text-2xl font-semibold">Como funciona</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map(({ title, text }, index) => (
            <li key={title} className="rounded-2xl border bg-card p-6">
              <span
                aria-hidden
                className="mb-4 flex size-9 items-center justify-center rounded-full bg-gold font-heading text-sm font-semibold text-gold-foreground"
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
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground">
            <div className="absolute inset-y-0 right-0 hidden w-2/5 md:block md:[clip-path:polygon(25%_0,100%_0,100%_100%,0_100%)]">
              <Image
                src="/images/quitinete.webp"
                alt=""
                fill
                sizes="450px"
                className="object-cover opacity-80"
              />
            </div>
            <div className="relative flex flex-col items-start gap-6 p-8 sm:p-10 md:w-3/5">
              <div>
                <h2 className="text-2xl font-semibold">
                  {role === "ESTUDANTE"
                    ? "Abriu uma vaga na sua república?"
                    : "Tem um quarto ou quitinete para alugar?"}
                </h2>
                <p className="mt-2 max-w-lg text-primary-foreground/75">
                  Publique de graça. Seu anúncio aparece para universitários com
                  a distância até o campus, e só estudantes verificados veem o
                  seu contato.
                </p>
              </div>
              <Link
                href={session ? NEW_LISTING_PATH : "/cadastro?papel=anunciante"}
                className={buttonVariants({ size: "lg", variant: "gold" })}
              >
                {session ? "Publicar um anúncio" : "Quero anunciar"}
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
