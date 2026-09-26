/**
 * Números de WhatsApp são guardados só com dígitos e com o DDI do Brasil,
 * ex: "5586999998888" (55 + DDD 86 + celular 99999-8888). É o formato que
 * o link https://wa.me/<numero> espera.
 */

// DDD: dois dígitos de 1 a 9 (não existe DDD com 0). Celular: 9 + 8 dígitos.
const MOBILE_WITH_DDD = /^[1-9]{2}9\d{8}$/;

/**
 * Converte o que a pessoa digitou para o formato guardado no banco.
 * Aceita máscaras e o +55 opcional. Retorna `null` se não for um celular
 * brasileiro válido.
 *
 * @example normalizeWhatsapp("(86) 99999-8888") // "5586999998888"
 */
export function normalizeWhatsapp(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) digits = digits.slice(2);

  return MOBILE_WITH_DDD.test(digits) ? `55${digits}` : null;
}

/** Formata para exibição: "5586999998888" → "(86) 99999-8888". */
export function formatWhatsapp(stored: string): string {
  const local = stored.startsWith("55") ? stored.slice(2) : stored;
  if (!MOBILE_WITH_DDD.test(local)) return stored;

  return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
}

/**
 * Máscara aplicada enquanto a pessoa digita: "86999998888" → "(86) 99999-8888".
 * Aceita colar com +55 e ignora o que passar de 11 dígitos.
 */
export function maskWhatsappInput(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
  digits = digits.slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
