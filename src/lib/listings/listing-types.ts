// Tipos de vaga (enum `ListingType` do banco) com os textos da interface.
// Fica fora do Prisma Client para poder ser usado no navegador.

export const LISTING_TYPES = ["QUARTO", "VAGA_REPUBLICA", "QUITINETE"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  QUARTO: "Quarto",
  VAGA_REPUBLICA: "Vaga em república",
  QUITINETE: "Quitinete",
};
