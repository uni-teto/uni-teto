/**
 * Anúncios de demonstração (usados pelo `npm run db:seed-demo`), para ver a
 * busca, os filtros e o mapa funcionando sem cadastrar tudo à mão.
 *
 * - Ruas, bairros e CEPs são reais (ViaCEP); as coordenadas e a precisão são
 *   as que o `geocodeAddress` devolveu para cada rua (Nominatim), consultados
 *   em 30/09/2026. Por isso o seed não chama o Nominatim.
 * - Os imóveis são fictícios: o número é sempre "s/n" e a descrição avisa que
 *   é demonstração.
 * - Os donos não têm senha (não dá para entrar com eles) e usam o domínio
 *   `uniteto.example`, reservado para exemplos: o e-mail não chega a ninguém.
 *   Ficam sem WhatsApp, para o link não apontar para o telefone de alguém.
 *
 * - Fotos: geradas por IA, no Cloudinary em `uniteto/demo/` (endereços em
 *   ./demo-photos.ts). Três por anúncio, combinando a capa com o tipo de vaga.
 *
 * Os `id`s são fixos para o seed poder rodar várias vezes sem duplicar.
 */
import type { GeocodePrecision } from "@/lib/geo/geocode";
import type { StateCode } from "@/lib/geo/states";
import type { ListingType } from "@/lib/listings/listing-types";
import { DEMO_PHOTO_URLS, type DemoPhoto } from "./demo-photos";

export const DEMO_EMAIL_DOMAIN = "uniteto.example";

export type DemoOwner = {
  id: string;
  name: string;
  email: string;
  role: "ESTUDANTE" | "ANUNCIANTE";
  /** Só estudante: `id` da universidade no seed (`universities.ts`) */
  universityId: string | null;
};

export const demoOwners: DemoOwner[] = [
  {
    id: "demo-owner-rita",
    name: "Rita Carvalho (demonstração)",
    email: `rita@${DEMO_EMAIL_DOMAIN}`,
    role: "ANUNCIANTE",
    universityId: null,
  },
  {
    id: "demo-owner-antonio",
    name: "Antônio Sousa (demonstração)",
    email: `antonio@${DEMO_EMAIL_DOMAIN}`,
    role: "ANUNCIANTE",
    universityId: null,
  },
  {
    id: "demo-owner-lucas",
    name: "Lucas Moura (demonstração)",
    email: `lucas@${DEMO_EMAIL_DOMAIN}`,
    role: "ESTUDANTE",
    universityId: "ufpi",
  },
  {
    id: "demo-owner-bia",
    name: "Bia Rocha (demonstração)",
    email: `bia@${DEMO_EMAIL_DOMAIN}`,
    role: "ESTUDANTE",
    universityId: "uespi",
  },
];

export type DemoListing = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  type: ListingType;
  status: "ATIVO" | "PAUSADO";
  priceCents: number;
  availableSpots: number;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: StateCode;
  zipCode: string;
  latitude: number;
  longitude: number;
  locationPrecision: GeocodePrecision;
  createdAt: Date;
};

const DEMO_NOTE = "Anúncio de demonstração do UniTeto: o imóvel não existe.";

const DESCRIPTIONS: Record<ListingType, string[]> = {
  QUARTO: [
    "Quarto mobiliado com ar-condicionado, internet e contas inclusas.",
    "Quarto individual em casa de família, com guarda-roupa e ventilador.",
    "Suíte com entrada independente, água e luz inclusas no valor.",
  ],
  VAGA_REPUBLICA: [
    "Vaga em república de estudantes, com cozinha equipada e internet.",
    "Vaga em quarto dividido, casa tranquila e perto de ponto de ônibus.",
    "República mista com área de estudos; contas divididas entre os moradores.",
  ],
  QUITINETE: [
    "Quitinete com cozinha, banheiro privativo e vaga para moto.",
    "Quitinete mobiliada em condomínio fechado, com portão eletrônico.",
    "Quitinete nova, com ar-condicionado e internet inclusa.",
  ],
};

type Owner = "rita" | "antonio" | "lucas" | "bia";

// título, tipo, preço (R$), vagas, dono, rua, bairro, cidade, UF, CEP,
// latitude, longitude, precisão
type Row = [
  title: string,
  type: ListingType,
  priceReais: number,
  availableSpots: number,
  owner: Owner,
  street: string,
  neighborhood: string,
  city: string,
  state: StateCode,
  zipCode: string,
  latitude: number,
  longitude: number,
  locationPrecision: GeocodePrecision,
];

// prettier-ignore
const ROWS: Row[] = [
  // Em volta da UFPI (Ininga, Fátima, Jóquei, Horto)
  ["Quarto mobiliado em frente à UFPI", "QUARTO", 650, 1, "rita", "Avenida Universitária", "Ininga", "Teresina", "PI", "64049550", -5.0621995, -42.8011078, "rua"],
  ["Vaga em república a pé da UFPI", "VAGA_REPUBLICA", 380, 2, "lucas", "Rua Visconde da Parnaíba", "Ininga", "Teresina", "PI", "64049570", -5.0631411, -42.7954062, "rua"],
  ["Quitinete na Fátima com ar-condicionado", "QUITINETE", 950, 1, "antonio", "Rua Visconde da Parnaíba", "Fátima", "Teresina", "PI", "64049453", -5.0640332, -42.7893491, "rua"],
  ["Suíte perto da ponte estaiada", "QUARTO", 800, 1, "rita", "Avenida Raul Lopes", "Fátima", "Teresina", "PI", "64049548", -5.0628289, -42.8043002, "rua"],
  ["Vaga em república no Ininga", "VAGA_REPUBLICA", 300, 3, "lucas", "Rua Dirce Oliveira", "Ininga", "Teresina", "PI", "64048550", -5.048394, -42.7749498, "rua"],
  ["Quarto com contas inclusas na Dom Severino", "QUARTO", 700, 1, "antonio", "Avenida Dom Severino", "Fátima", "Teresina", "PI", "64049370", -5.0691237, -42.7986331, "rua"],
  ["Quitinete mobiliada na Rua Angélica", "QUITINETE", 1100, 1, "rita", "Rua Angélica", "Fátima", "Teresina", "PI", "64049532", -5.0731714, -42.7925356, "rua"],
  ["Quarto individual na Elias João Tajra", "QUARTO", 600, 1, "antonio", "Avenida Elias João Tajra", "Fátima", "Teresina", "PI", "64049305", -5.0716852, -42.7868134, "rua"],
  ["Vaga para estudante na Homero Castelo Branco", "VAGA_REPUBLICA", 420, 1, "lucas", "Avenida Homero Castelo Branco", "Fátima", "Teresina", "PI", "64049505", -5.0703817, -42.7830116, "rua"],
  ["Quitinete no Jóquei com vaga para moto", "QUITINETE", 1200, 1, "rita", "Avenida Jóquei Clube", "Jóquei", "Teresina", "PI", "64049240", -5.0748162, -42.7860061, "rua"],
  ["Quarto em casa de família no Jóquei", "QUARTO", 550, 1, "antonio", "Rua Anfrísio Lobão", "Jóquei", "Teresina", "PI", "64049280", -5.0726779, -42.7870461, "rua"],
  ["República mista no Jóquei", "VAGA_REPUBLICA", 450, 2, "lucas", "Rua Governador Joca Pires", "Jóquei", "Teresina", "PI", "64048212", -5.0774675, -42.7885116, "rua"],
  ["Suíte com entrada independente no Jóquei", "QUARTO", 780, 1, "rita", "Avenida Senador Area Leão", "Jóquei", "Teresina", "PI", "64049110", -5.0780897, -42.7841786, "rua"],
  ["Vaga em quarto dividido no Jóquei", "VAGA_REPUBLICA", 280, 1, "lucas", "Rua Aviador Irapuan Rocha", "Jóquei", "Teresina", "PI", "64048232", -5.0762366, -42.7895289, "bairro"],
  ["Quitinete nova no Horto", "QUITINETE", 850, 1, "antonio", "Travessa Petrônio Portela", "Horto", "Teresina", "PI", "64052845", -5.0643418, -42.7780563, "rua"],
  ["Quarto perto da Avenida Kennedy", "QUARTO", 500, 2, "rita", "Avenida Presidente Kennedy", "Horto", "Teresina", "PI", "64052675", -5.068136, -42.7710538, "rua"],
  ["Vaga em república no São Cristóvão", "VAGA_REPUBLICA", 350, 2, "lucas", "Rua Anfrísio Lobão", "São Cristóvão", "Teresina", "PI", "64051152", -5.0711009, -42.7799139, "rua"],
  ["Quitinete no São Cristóvão", "QUITINETE", 900, 1, "antonio", "Avenida Presidente Kennedy", "São Cristóvão", "Teresina", "PI", "64052345", -5.0779324, -42.7741267, "rua"],
  ["Quarto simples nos Noivos", "QUARTO", 400, 1, "rita", "Rua Professor Pires Gayoso", "Noivos", "Teresina", "PI", "64046350", -5.0852074, -42.7779561, "rua"],
  ["Quarto na Água Mineral", "QUARTO", 380, 1, "antonio", "Avenida Duque de Caxias", "Água Mineral", "Teresina", "PI", "64006245", -5.0458234, -42.8114965, "rua"],

  // Em volta da UESPI (Pirajá, Aeroporto, Marquês, Mafuá)
  ["Vaga em república ao lado da UESPI", "VAGA_REPUBLICA", 320, 2, "bia", "Rua João Cabral", "Acarape", "Teresina", "PI", "64002095", -5.0737256, -42.8273643, "rua"],
  ["Quarto mobiliado no Pirajá", "QUARTO", 480, 1, "bia", "Rua Rui Barbosa", "Pirajá", "Teresina", "PI", "64002228", -5.0729408, -42.8254142, "rua"],
  ["Quitinete na Vila Operária", "QUITINETE", 700, 1, "antonio", "Avenida Santos Dumont", "Vila Operária", "Teresina", "PI", "64002200", -5.0777936, -42.8214925, "rua"],
  ["Quarto perto do aeroporto", "QUARTO", 450, 1, "rita", "Avenida Centenário", "Aeroporto", "Teresina", "PI", "64003700", -5.0562509, -42.8222981, "rua"],
  ["República de estudantes no Aeroporto", "VAGA_REPUBLICA", 300, 3, "bia", "Rua Magalhães Filho", "Aeroporto", "Teresina", "PI", "64003685", -5.067583, -42.8172508, "rua"],
  ["Quitinete no Marquês", "QUITINETE", 750, 1, "antonio", "Rua Magalhães Filho", "Marquês", "Teresina", "PI", "64002450", -5.0718145, -42.8150549, "rua"],
  ["Quarto com ar-condicionado no Marquês", "QUARTO", 520, 1, "rita", "Rua Desembargador Francisco Pires de Castro", "Marquês", "Teresina", "PI", "64002490", -5.0739951, -42.8121114, "bairro"],
  ["Vaga em casa de estudantes no Mafuá", "VAGA_REPUBLICA", 260, 2, "bia", "Rua Alcides Freitas", "Mafuá", "Teresina", "PI", "64002340", -5.0780439, -42.8153374, "rua"],
  ["Quarto individual no Marquês", "QUARTO", 470, 1, "antonio", "Rua Jonatas Batista", "Marquês", "Teresina", "PI", "64002495", -5.0780176, -42.8097369, "rua"],

  // Centro e Cabral
  ["Quitinete no Cabral, perto do rio", "QUITINETE", 1000, 1, "rita", "Avenida Marechal Castelo Branco", "Cabral", "Teresina", "PI", "64000810", -5.0803529, -42.7979034, "rua"],
  ["Quarto no Centro, perto de tudo", "QUARTO", 430, 1, "antonio", "Rua Desembargador Freitas", "Centro", "Teresina", "PI", "64000240", -5.0858113, -42.8135257, "rua"],
  ["Vaga em república no Centro", "VAGA_REPUBLICA", 250, 2, "bia", "Rua Coelho Rodrigues", "Centro", "Teresina", "PI", "64000080", -5.0859971, -42.8065695, "rua"],
  ["Quitinete no Centro", "QUITINETE", 680, 1, "rita", "Rua Lisandro Nogueira", "Centro", "Teresina", "PI", "64000200", -5.0851321, -42.8101708, "rua"],
  ["Quarto em pensão no Centro", "QUARTO", 360, 1, "antonio", "Rua Álvaro Mendes", "Centro", "Teresina", "PI", "64000060", -5.0914421, -42.8152329, "rua"],

  // Mais longe: zona sul, zona leste, Dirceu e Timon (MA)
  ["Quitinete na zona sul", "QUITINETE", 600, 1, "rita", "Avenida Barão de Gurguéia", "Pio XII", "Teresina", "PI", "64019870", -5.1158466, -42.8046023, "rua"],
  ["Quarto no Campestre", "QUARTO", 400, 1, "antonio", "Avenida Zequinha Freire", "Campestre", "Teresina", "PI", "64053820", -5.0679545, -42.7492976, "rua"],
  ["Vaga em república no Colorado", "VAGA_REPUBLICA", 250, 2, "lucas", "Avenida Noé Mendes", "Colorado", "Teresina", "PI", "64083025", -5.0992108, -42.7329805, "rua"],
  ["Quarto na Extrema", "QUARTO", 350, 1, "rita", "Rua Joaquim Nelson", "Extrema", "Teresina", "PI", "64076305", -5.1209031, -42.7581107, "bairro"],
  ["Quitinete em Timon, perto da ponte", "QUITINETE", 550, 1, "antonio", "Avenida Piauí", "Parque Piauí I", "Timon", "MA", "65631030", -5.090963, -42.8235636, "rua"],
  ["Quarto em Timon", "QUARTO", 330, 1, "bia", "Avenida Teresina", "Parque Piauí II", "Timon", "MA", "65636500", -5.0969235, -42.8414636, "rua"],
];

// Pausados não aparecem na busca (só o dono vê): servem para conferir isso
const PAUSED = new Set([11, 26]);

// Um anúncio por dia, para a ordem "mais recentes" ser sempre a mesma
const FIRST_DAY = Date.UTC(2026, 7, 20, 12);
const DAY_MS = 24 * 60 * 60 * 1000;

export const demoListings: DemoListing[] = ROWS.map(
  (
    [
      title,
      type,
      priceReais,
      availableSpots,
      owner,
      street,
      neighborhood,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      locationPrecision,
    ],
    index,
  ) => {
    const descriptions = DESCRIPTIONS[type];
    return {
      id: `demo-listing-${String(index + 1).padStart(2, "0")}`,
      ownerId: `demo-owner-${owner}`,
      title,
      description: `${descriptions[index % descriptions.length]} ${DEMO_NOTE}`,
      type,
      status: PAUSED.has(index + 1) ? "PAUSADO" : "ATIVO",
      priceCents: priceReais * 100,
      availableSpots,
      street,
      number: "s/n",
      neighborhood,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      locationPrecision,
      createdAt: new Date(FIRST_DAY + index * DAY_MS),
    };
  },
);

// ---- Fotos (enviadas por `npm run cloudinary:demo-photos`)

const BEDROOMS: DemoPhoto[] = ["quarto-estudante", "republica-noite"];
const REPUBLICS: DemoPhoto[] = ["republica", "republica-noite"];
const APARTMENTS: DemoPhoto[] = [
  "ap-terroso",
  "ap-oliva",
  "ap-verde-oliva",
  "ap-plantas-luz",
  "ap-varanda",
  "ap-vista",
  "ap-cozinha-sala",
  "ap-cozinha-integrada",
  "ap-escandinavo",
  "ap-luz-natural",
  "ap-verde-madeira",
  "ap-por-do-sol",
  "ap-cozinha-jantar",
  "estudio",
  "loft",
];

/** Item `n` de uma lista, dando a volta quando acaba. */
const pick = <T>(list: T[], n: number) => list[n % list.length];

/**
 * Três fotos por anúncio, sem repetir dentro dele. A capa combina com o tipo:
 * república abre com o quarto de beliches; quitinete, com o apartamento;
 * quarto, com o apartamento e o quarto em seguida. As demais giram entre as
 * fotos de apartamento, para os anúncios vizinhos não ficarem iguais.
 */
function photosFor(type: ListingType, index: number): DemoPhoto[] {
  const a = pick(APARTMENTS, index * 2);
  const b = pick(APARTMENTS, index * 2 + 1);
  switch (type) {
    case "VAGA_REPUBLICA":
      return [pick(REPUBLICS, index), a, b];
    case "QUARTO":
      return [a, pick(BEDROOMS, index), b];
    case "QUITINETE":
      return [a, b, pick(APARTMENTS, index * 2 + 7)];
  }
}

export type DemoListingPhoto = {
  id: string;
  listingId: string;
  url: string;
  /** 0 é a capa */
  position: number;
};

export const demoListingPhotos: DemoListingPhoto[] = demoListings.flatMap(
  (listing, index) =>
    photosFor(listing.type, index).map((photo, position) => ({
      id: `${listing.id}-photo-${position}`,
      listingId: listing.id,
      url: DEMO_PHOTO_URLS[photo],
      position,
    })),
);
