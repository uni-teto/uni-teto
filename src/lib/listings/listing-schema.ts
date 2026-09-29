import { z } from "zod";
import { isStateCode, type StateCode } from "@/lib/geo/states";
import { LISTING_TYPES } from "./listing-types";
import { parsePriceToCents } from "./price";
import { normalizeZipCode } from "./zip-code";

// Validação do anúncio: a mesma no formulário (navegador) e na Server Action.
// Os campos chegam como texto (inputs) e saem prontos para o banco.

export const MIN_PRICE_CENTS = 50_00;
export const MAX_PRICE_CENTS = 20_000_00;
export const MAX_AVAILABLE_SPOTS = 20;

/** Texto obrigatório: "Informe a rua." se vazio. */
function requiredText(what: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, `Informe ${what}.`)
    .max(max, `Use no máximo ${max} caracteres.`);
}

export const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Dê um título com pelo menos 5 caracteres.")
    .max(100, "O título pode ter no máximo 100 caracteres."),
  description: z
    .string()
    .trim()
    .min(20, "Descreva o imóvel com pelo menos 20 caracteres.")
    .max(2000, "A descrição pode ter no máximo 2000 caracteres."),
  type: z.enum(LISTING_TYPES, { error: "Escolha o tipo de vaga." }),
  price: z.string().transform((value, ctx) => {
    const cents = parsePriceToCents(value);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Informe o valor, ex: 650,00." });
      return z.NEVER;
    }
    if (cents < MIN_PRICE_CENTS || cents > MAX_PRICE_CENTS) {
      ctx.addIssue({
        code: "custom",
        message: "O valor deve ficar entre R$ 50,00 e R$ 20.000,00.",
      });
      return z.NEVER;
    }
    return cents;
  }),
  availableSpots: z.string().transform((value, ctx) => {
    const spots = /^\d+$/.test(value.trim()) ? Number(value) : NaN;
    if (!(spots >= 1 && spots <= MAX_AVAILABLE_SPOTS)) {
      ctx.addIssue({
        code: "custom",
        message: `Informe de 1 a ${MAX_AVAILABLE_SPOTS} vagas.`,
      });
      return z.NEVER;
    }
    return spots;
  }),
  zipCode: z.string().transform((value, ctx) => {
    const zip = normalizeZipCode(value);
    if (!zip) {
      ctx.addIssue({ code: "custom", message: "Informe o CEP com 8 dígitos." });
      return z.NEVER;
    }
    return zip;
  }),
  street: requiredText("a rua", 120),
  number: requiredText("o número (ou s/n)", 10),
  complement: z
    .string()
    .trim()
    .max(60, "Use no máximo 60 caracteres.")
    .transform((value) => value || null),
  neighborhood: requiredText("o bairro", 80),
  city: requiredText("a cidade", 80),
  state: z
    .string()
    .refine(isStateCode, "Escolha o estado.")
    .transform((value) => value as StateCode),
});

export type ListingInput = z.input<typeof listingSchema>;
export type ListingData = z.output<typeof listingSchema>;
