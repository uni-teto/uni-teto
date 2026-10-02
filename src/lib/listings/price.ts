// Preços são guardados em centavos (`priceCents`) para evitar erros de ponto
// flutuante. Na tela, a pessoa digita em reais no formato brasileiro.

/**
 * "650" → 65000, "650,5" → 65050, "1.200,00" → 120000, "R$ 800" → 80000.
 * Retorna `null` se não for um valor em reais válido.
 */
export function parsePriceToCents(input: string): number | null {
  const text = input.replace(/R\$|\s/gi, "");
  // Milhar com ponto (opcional) e até 2 casas depois da vírgula
  const match = /^(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?$/.exec(text);
  if (!match) return null;

  const reais = Number(match[1].replaceAll(".", ""));
  const centavos = Number((match[2] ?? "").padEnd(2, "0"));
  return reais * 100 + centavos;
}

/** 65000 → "R$ 650,00" */
export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** 65000 → "R$ 650" (etiqueta curta, sem centavos: marcadores do mapa). */
export function formatPriceShort(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

/** 65000 → "650,00" (valor inicial do campo de preço ao editar). */
export function centsToPriceInput(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
