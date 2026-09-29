// CEP guardado só com os 8 dígitos (`zipCode Char(8)`); na tela, "64049-550".

/** Máscara enquanto a pessoa digita: "64049550" → "64049-550". */
export function maskZipCodeInput(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}

/** "64049-550" → "64049550"; `null` se não tiver 8 dígitos. */
export function normalizeZipCode(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}
